import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Trend Segmentation Pipeline using Polars
File: spark_ai/ingen_customer/02_trend_segmentation/trend_segmentation_polars.py

Provides a consolidated, single-entry-point function `run_trend_segmentation_polars`
supporting:
  1. Time-period aggregations (monthly, quarterly, yearly) using native Polars expressions.
  2. Modality 1: Share Trend Segmentation (strict monotonicity, mean +/- 5% flat tolerance).
  3. Modality 2: Volume Trend Segmentation (exponential moving average smoothing alpha=0.5).
  4. Classification into INCREASING, DECLINING, FLAT, and FLUCTUATING TREND.
  5. Generating customer-level label table and aggregated period-by-period summary table.
"""

import os
import warnings
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import polars as pl

warnings.filterwarnings("ignore")


def _read_data_polars(file_input: Union[str, pl.DataFrame, pl.LazyFrame]) -> pl.DataFrame:
    """Read input into an eager Polars DataFrame."""
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
        raise ValueError(f"Unsupported file format: {ext}")


def _classify_share_trend_vectorized(matrix: np.ndarray) -> List[str]:
    """
    Vectorized rule engine for share trend segmentation:
    - FLAT: all periods within [mean - 5, mean + 5]
    - INCREASING: strictly increasing diffs, count(0) < 2, all unique
    - DECLINING: strictly decreasing diffs, count(0) < 2, all unique
    - FLUCTUATING: fallback
    """
    n_rows, k_periods = matrix.shape
    segments = []

    for i in range(n_rows):
        series = matrix[i, :]
        mean_val = np.mean(series)

        # 1. Check Flat
        is_flat = np.all((series >= mean_val - 5.0) & (series < mean_val + 5.0))
        if is_flat:
            segments.append("FLAT TREND")
            continue

        # Diffs
        diffs = np.diff(series)
        zero_count = np.sum(series == 0)
        unique_count = len(np.unique(series))

        # 2. Check Increasing
        if np.all(diffs > 0) and zero_count < 2 and unique_count == k_periods:
            segments.append("INCREASING TREND")
            continue

        # 3. Check Declining
        if np.all(diffs < 0) and zero_count < 2 and unique_count == k_periods:
            segments.append("DECLINING TREND")
            continue

        # 4. Fallback Fluctuating
        segments.append("FLUCTUATING TREND")

    return segments


def _classify_volume_trend_vectorized(matrix: np.ndarray, alpha: float = 0.5) -> List[str]:
    """
    Exponentially smoothed volume trend rule engine (alpha=0.5):
    - FLAT: all EMA points within mean_vol +/- 5% of sum_vol
    - INCREASING: EMA is monotonically non-decreasing with sufficient unique steps
    - DECLINING: EMA is monotonically non-increasing with sufficient unique steps
    - FLUCTUATING: fallback
    """
    n_rows, k_periods = matrix.shape
    segments = []

    for i in range(n_rows):
        raw = matrix[i, :]
        # Calculate EMA
        ema = np.zeros(k_periods)
        ema[0] = raw[0]
        for t in range(1, k_periods):
            ema[t] = alpha * raw[t] + (1.0 - alpha) * ema[t - 1]

        sum_val = np.sum(ema)
        mean_val = np.floor(sum_val / k_periods)
        lower_bound = mean_val - (0.05 * sum_val)
        upper_bound = mean_val + (0.05 * sum_val)

        # 1. Check Flat
        if np.all((ema >= lower_bound) & (ema < upper_bound)):
            segments.append("FLAT TREND")
            continue

        unique_cnt = len(np.unique(ema))
        is_asc = np.all(np.diff(ema) >= 0)
        is_desc = np.all(np.diff(ema) <= 0)

        # 2. Check Increasing
        if is_asc and unique_cnt > 1 and unique_cnt >= (k_periods // 2):
            segments.append("INCREASING TREND")
            continue

        # 3. Check Declining
        if is_desc and unique_cnt > 1 and unique_cnt >= (k_periods // 2):
            segments.append("DECLINING TREND")
            continue

        # 4. Fallback Fluctuating
        segments.append("FLUCTUATING TREND")

    return segments


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "trend_segmentation"])
def run_trend_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: str = "date",
    time_granularity: str = "quarter",
    trend_type: str = "share",
    class_col: Optional[str] = None,
    selected_product: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, str, List[str]]]:
    """
    Consolidated all-in-one Trend Segmentation pipeline built in Polars.

    Parameters:
        file_path: Input file (CSV/Parquet/IPC) or Polars DataFrame.
        customer_col: Unique customer ID column.
        product_col: Product name column.
        sales_col: Sales volume/units/revenue column.
        date_col: Date/timestamp column.
        time_granularity: 'quarter', 'month', or 'year'.
        trend_type: 'share' (class market share) or 'volume' (EMA volume).
        class_col: Category/therapeutic class (required if trend_type='share').
        selected_product: Product to evaluate. If None, picks the top volume product.
        start_date: Date range filter start (YYYY-MM-DD).
        end_date: Date range filter end (YYYY-MM-DD).

    Returns:
        Dict with:
            - 'summary_table': pl.DataFrame segment counts and period mean metrics.
            - 'customer_labels': pl.DataFrame customer-level assigned segments and period values.
            - 'trend_type': 'share' or 'volume'.
            - 'product': evaluated product.
            - 'periods': sorted period names.
    """
    df_raw = _read_data_polars(file_path)

    # Standardize column names
    col_mapping = {}
    cols_lower = {col.lower().strip(): col for col in df_raw.columns}

    for cand in [customer_col.lower(), "customer", "customerid", "customer_id"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "customer"
            break

    for cand in [product_col.lower(), "product", "item type", "item_type", "product_name"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "product"
            break

    for cand in [sales_col.lower(), "sales", "units sold", "units", "quantity", "total revenue", "revenue"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "sales"
            break

    for cand in [date_col.lower(), "date", "order date", "order_date", "trx_date"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "date"
            break

    if class_col:
        for cand in [class_col.lower(), "class", "product_class", "region", "category"]:
            if cand in cols_lower:
                col_mapping[cols_lower[cand]] = "class"
                break

    df = df_raw.rename(col_mapping)
    for req in ["customer", "product", "sales", "date"]:
        if req not in df.columns:
            raise KeyError(f"Required column '{req}' missing from dataset. Found: {df_raw.columns}")

    # Parse types and dates
    df = df.with_columns([
        pl.col("customer").cast(pl.Utf8),
        pl.col("product").cast(pl.Utf8),
        pl.col("sales").cast(pl.Float64, strict=False).fill_null(0.0),
        pl.col("date").str.to_date(strict=False).alias("__date")
    ])

    # Date range filter
    if start_date:
        df = df.filter(pl.col("__date") >= pl.lit(start_date).str.to_date())
    if end_date:
        df = df.filter(pl.col("__date") <= pl.lit(end_date).str.to_date())

    # Build time period column
    if time_granularity == "month":
        df = df.with_columns(
            pl.concat_str([pl.col("__date").dt.year(), pl.lit("_M"), pl.col("__date").dt.month().to_string().str.zfill(2)]).alias("period")
        )
    elif time_granularity == "year":
        df = df.with_columns(
            pl.col("__date").dt.year().to_string().alias("period")
        )
    else:  # default quarter
        df = df.with_columns(
            pl.concat_str([pl.col("__date").dt.year(), pl.lit("_Q"), pl.col("__date").dt.quarter()]).alias("period")
        )

    # Determine product to evaluate
    if not selected_product:
        top_prod = df.group_by("product").agg(pl.col("sales").sum()).sort("sales", descending=True).select("product").to_series().to_list()
        selected_product = str(top_prod[0]) if top_prod else None

    if not selected_product:
        raise ValueError("No products found in dataset.")

    # -------------------------------------------------------------
    # Modality 1: Share Trend
    # -------------------------------------------------------------
    if trend_type == "share":
        # Group by customer, period, product
        df_vol = df.group_by(["customer", "period", "product"]).agg(pl.col("sales").sum())

        # Pivot to get class total and product sales
        df_piv = df_vol.pivot(values="sales", index=["customer", "period"], on="product").fill_null(0.0)
        prod_cols = [c for c in df_piv.columns if c not in ["customer", "period"]]

        df_piv = df_piv.with_columns(
            pl.sum_horizontal(prod_cols).alias("class_total")
        )

        if selected_product not in df_piv.columns:
            raise ValueError(f"Selected product '{selected_product}' not present in class.")

        # Compute share percentage
        df_shares = df_piv.with_columns(
            ((pl.col(selected_product) / pl.col("class_total").replace(0.0, None)) * 100.0).fill_null(0.0).alias("product_share")
        )

        # Pivot customer by period shares
        df_time_matrix = df_shares.pivot(values="product_share", index="customer", on="period").fill_null(0.0)

    # -------------------------------------------------------------
    # Modality 2: Volume Trend
    # -------------------------------------------------------------
    else:
        df_prod = df.filter(pl.col("product") == selected_product)
        df_vol = df_prod.group_by(["customer", "period"]).agg(pl.col("sales").sum())
        df_time_matrix = df_vol.pivot(values="sales", index="customer", on="period").fill_null(0.0)

    period_cols = sorted([c for c in df_time_matrix.columns if c != "customer"])
    if len(period_cols) < 2:
        raise ValueError(f"Trend segmentation requires at least 2 distinct periods. Found: {period_cols}")

    # Reorder columns chronologically
    df_time_matrix = df_time_matrix.select(["customer"] + period_cols)

    customer_ids = df_time_matrix.select("customer").to_series().to_list()
    matrix = df_time_matrix.select(period_cols).to_numpy()

    # Apply vectorized classification rules
    if trend_type == "share":
        assigned_segments = _classify_share_trend_vectorized(matrix)
    else:
        assigned_segments = _classify_volume_trend_vectorized(matrix, alpha=0.5)

    # Customer labels table
    df_customer_labels = df_time_matrix.with_columns(
        pl.Series("Segment", assigned_segments)
    )

    # Output Summary Table
    period_means = [pl.col(p).mean().round(2).alias(f"{p}_mean") for p in period_cols]
    df_summary = df_customer_labels.group_by("Segment").agg([
        pl.col("customer").count().alias("Customer count"),
        *period_means
    ]).sort("Customer count", descending=True)

    return {
        "summary_table": df_summary,
        "customer_labels": df_customer_labels,
        "trend_type": trend_type,
        "product": selected_product,
        "periods": period_cols
    }
