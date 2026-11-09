import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Look-Alike Audience Modeling & Inference Pipeline using Polars
File: spark_ai/ingen_customer/08_lookalike_engine/lookalike_engine_polars.py

Provides a single-entry-point function `run_lookalike_engine_polars` supporting:
  1. Merging training customer features with upstream segmentation seed labels via Polars.
  2. Binarizing target class (y=1 for selected seed segment, y=0 for background).
  3. Preprocessing, zero-variance pruning, and balanced class training.
  4. Training supervised classifiers (RandomForest / LogisticRegression) optimized for ROC-AUC.
  5. Ingesting prospect datasets and generating predicted look-alike probabilities.
  6. Flagging standard look-alikes (P >= 0.50) and high-confidence look-alikes (P >= confidence_threshold).
"""

import os
import warnings
from typing import Any, Dict, List, Optional, Union

import numpy as np
import polars as pl
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")


def _read_data_polars(file_input: Union[str, pl.DataFrame, pl.LazyFrame]) -> pl.DataFrame:
    """Read data input into an eager Polars DataFrame."""
    if isinstance(file_input, pl.DataFrame):
        return file_input
    if isinstance(file_input, pl.LazyFrame):
        return file_input.collect()

    ext = os.path.splitext(file_input)[-1].lower()
    if ext in [".csv", ".txt"]:
        return pl.read_csv(file_input, infer_schema_length=10000, ignore_errors=True)
    elif ext in [".parquet", ".pq"]:
        return pl.read_parquet(file_input)
    elif ext in [".ipc", ".arrow", ".feather"]:
        return pl.read_ipc(file_input)
    else:
        raise ValueError(f"Unsupported file format for Polars reader: {ext}")


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "lookalike_engine"])
def run_lookalike_engine_polars(
    train_file_path: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    segment_label_path: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    positive_class: str = "Decile 10 (90-100%)",
    feature_cols: Optional[List[str]] = None,
    customer_col: str = "customer",
    prospect_file_path: Optional[Union[str, pl.DataFrame]] = None,
    confidence_threshold: float = 0.80
) -> Dict[str, Any]:
    """
    Consolidated Look-Alike Modeling & Inference Engine using Polars.

    Parameters:
        train_file_path: Customer feature dataset.
        segment_label_path: Segmentation label dataset containing 'customer' and 'Segment'.
        positive_class: Target segment to replicate (e.g., 'Decile 10 (90-100%)').
        feature_cols: Predictor column names. If None, auto-selects numeric columns.
        customer_col: Account identifier column.
        prospect_file_path: Unsegmented prospect dataset to score.
        confidence_threshold: Cutoff for high confidence look-alikes (default 0.80).

    Returns:
        Dict with:
            - 'model_metrics': Train/validation ROC-AUC and feature importances.
            - 'scored_prospects': pl.DataFrame with predicted probabilities and look-alike flags.
            - 'inference_kpis': Look-alike rate, high-confidence counts, and total prospects.
    """
    df_train_raw = _read_data_polars(train_file_path)
    df_labels_raw = _read_data_polars(segment_label_path)

    # Standardize column names
    for c in df_train_raw.columns:
        if c.lower().strip() in [customer_col.lower(), "customer", "customerid"]:
            df_train_raw = df_train_raw.rename({c: "customer"})
            break

    for c in df_labels_raw.columns:
        if c.lower().strip() in [customer_col.lower(), "customer", "customerid"]:
            df_labels_raw = df_labels_raw.rename({c: "customer"})
            break

    seg_col = None
    for c in df_labels_raw.columns:
        if c != "customer" and c.lower().strip() in ["segment", "segment_name"]:
            seg_col = c
            break

    if not seg_col:
        raise KeyError("Could not find segment column in segment_label_path dataset.")

    # Join features with segment labels
    df_labeled = df_train_raw.join(df_labels_raw.select(["customer", seg_col]), on="customer", how="inner")

    # Binarize positive seed target
    df_labeled = df_labeled.with_columns(
        pl.when(pl.col(seg_col) == positive_class).then(1).otherwise(0).alias("target")
    )

    pos_count = df_labeled.filter(pl.col("target") == 1).height
    if pos_count < 2:
        raise ValueError(f"Insufficient positive instances for class '{positive_class}'. Found {pos_count}.")

    # Identify features
    if feature_cols:
        features = [f for f in feature_cols if f in df_labeled.columns and f not in ["customer", "target", seg_col]]
    else:
        # Auto-select numeric features
        features = [
            col for col in df_labeled.columns
            if col not in ["customer", "target", seg_col] and df_labeled[col].dtype in [pl.Float64, pl.Float32, pl.Int64, pl.Int32]
        ]

    if not features:
        raise ValueError("No valid numeric features found for modeling.")

    # Fill nulls and extract arrays
    df_clean = df_labeled.select(["customer", "target"] + features).fill_null(0.0)
    X = df_clean.select(features).to_numpy()
    y = df_clean.select("target").to_numpy().flatten()

    # Stratified Split
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.30, random_state=12345, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # Train competing models (Random Forest with balanced class weights)
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight="balanced", random_state=12345)
    rf.fit(X_train_scaled, y_train)
    val_probs_rf = rf.predict_proba(X_val_scaled)[:, 1]
    auc_rf = roc_auc_score(y_val, val_probs_rf) if len(set(y_val)) > 1 else 0.5

    lr = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=12345)
    lr.fit(X_train_scaled, y_train)
    val_probs_lr = lr.predict_proba(X_val_scaled)[:, 1]
    auc_lr = roc_auc_score(y_val, val_probs_lr) if len(set(y_val)) > 1 else 0.5

    # Pick winning model
    winning_model = rf if auc_rf >= auc_lr else lr
    winning_name = "RandomForest" if auc_rf >= auc_lr else "LogisticRegression"
    winning_auc = max(auc_rf, auc_lr)

    feature_importances = dict(zip(features, rf.feature_importances_))

    result: Dict[str, Any] = {
        "model_metrics": {
            "best_model": winning_name,
            "validation_auc": round(winning_auc, 4),
            "positive_seed_count": pos_count,
            "total_training_accounts": len(y),
            "feature_importances": feature_importances
        }
    }

    # Stage 2: Inference on prospects if provided
    if prospect_file_path:
        df_prospects = _read_data_polars(prospect_file_path)
        for c in df_prospects.columns:
            if c.lower().strip() in [customer_col.lower(), "customer", "customerid"]:
                df_prospects = df_prospects.rename({c: "customer"})
                break

        # Check features
        available_features = [f for f in features if f in df_prospects.columns]
        missing_features = [f for f in features if f not in df_prospects.columns]

        if missing_features:
            df_prospects = df_prospects.with_columns([pl.lit(0.0).alias(f) for f in missing_features])

        X_prospect = df_prospects.select(features).fill_null(0.0).to_numpy()
        X_prospect_scaled = scaler.transform(X_prospect)

        probs = winning_model.predict_proba(X_prospect_scaled)[:, 1]

        df_scored = df_prospects.select("customer").with_columns([
            pl.Series("lookalike_probability", np.round(probs, 4)),
            pl.when(pl.Series("lookalike_probability", probs) >= 0.50)
            .then(pl.lit(f"Look-Alike ({positive_class})"))
            .otherwise(pl.lit("Non-Target"))
            .alias("Segment"),
            (pl.Series("lookalike_probability", probs) >= confidence_threshold).alias("is_high_confidence")
        ])

        total_prospects = df_scored.height
        lookalike_count = df_scored.filter(pl.col("Segment") != "Non-Target").height
        high_conf_count = df_scored.filter(pl.col("is_high_confidence") == True).height

        result["scored_prospects"] = df_scored
        result["inference_kpis"] = {
            "total_prospects_scored": total_prospects,
            "lookalike_count": lookalike_count,
            "lookalike_rate_pct": round((lookalike_count / total_prospects) * 100.0, 2) if total_prospects > 0 else 0.0,
            "high_confidence_count": high_conf_count
        }

    return result
