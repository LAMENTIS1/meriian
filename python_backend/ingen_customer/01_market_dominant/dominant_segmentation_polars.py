import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Market Dominant Segmentation Pipeline using Polars
File: spark_ai/ingen_customer/dominant_segmentation_polars.py

This module delivers a consolidated, single-entry-point function `run_dominant_segmentation_polars`
built with Polars. It performs:
  1. High-performance file reading (CSV, Parquet, IPC) via Polars lazy/eager evaluation.
  2. Time-period filtering (date range, latest year selection, or custom sales period).
  3. Product aggregation and customer share calculations directly with Polars expressions.
  4. Outlier detection via standardized Z-scores (tagging outliers as cluster 99).
  5. 2D PCA dimensionality reduction and automatic cluster count selection (CH & DB index consensus).
  6. Multi-model clustering competition (Weighted K-Means vs Gaussian Mixture Models via S_Dbw validity).
  7. Hierarchical commercial business rules (Single Dominant, Multi-Product, Spreader, Outlier).
  8. Consolidation and KPI derivations (pct contribution, average sales per customer, shares).
"""

import os
import math
import warnings
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import polars as pl
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score

warnings.filterwarnings("ignore")


def _read_data_polars(file_input: Union[str, pl.DataFrame, pl.LazyFrame]) -> pl.DataFrame:
    """Read data file into an eager Polars DataFrame."""
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


def _apply_time_period_filter(
    df: pl.DataFrame,
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto"
) -> Tuple[pl.DataFrame, str]:
    """
    Apply time-period filtering using Polars expressions.
    - 'auto': detects latest year from date_col and filters for that year.
    - 'date_range': filters records between start_date and end_date.
    - 'all': uses all records without filtering.
    """
    if date_col is None or date_col not in df.columns:
        return df, "All_Data"

    # Cast to date/datetime if not already
    df_with_date = df.with_columns(
        pl.col(date_col).str.to_date(strict=False).alias("__parsed_date")
    )

    if time_period_mode == "date_range":
        conditions = []
        if start_date:
            conditions.append(pl.col("__parsed_date") >= pl.lit(start_date).str.to_date())
        if end_date:
            conditions.append(pl.col("__parsed_date") <= pl.lit(end_date).str.to_date())
        
        if conditions:
            filtered_df = df_with_date.filter(pl.all_horizontal(conditions)).drop("__parsed_date")
            period_label = f"{start_date}_to_{end_date}"
            return filtered_df, period_label

    elif time_period_mode == "auto":
        # Extract latest year
        df_years = df_with_date.with_columns(pl.col("__parsed_date").dt.year().alias("__year"))
        max_year = df_years.select(pl.col("__year").max()).item()
        if max_year is not None:
            filtered_df = df_years.filter(pl.col("__year") == max_year).drop(["__parsed_date", "__year"])
            period_label = f"Year_{max_year}"
            return filtered_df, period_label

    return df_with_date.drop("__parsed_date"), "Full_Period"


def _determine_optimal_clusters(features: np.ndarray, max_k: int = 8) -> int:
    """Find consensus optimal clusters using Calinski-Harabasz and Davies-Bouldin scores."""
    n_samples = len(features)
    if n_samples <= 3:
        return 2

    upper_k = min(max_k, n_samples - 1)
    if upper_k < 2:
        return 2

    k_range = list(range(2, upper_k + 1))
    ch_scores = {}
    db_scores = {}

    for k in k_range:
        km = KMeans(n_clusters=k, init="k-means++", max_iter=300, n_init=10, random_state=12345)
        labels = km.fit_predict(features)
        if len(set(labels)) > 1:
            ch_scores[k] = calinski_harabasz_score(features, labels)
            db_scores[k] = davies_bouldin_score(features, labels)

    best_ch_k = max(ch_scores, key=ch_scores.get) if ch_scores else 2
    best_db_k = min(db_scores, key=db_scores.get) if db_scores else 2

    optimal_k = int(round(np.mean([best_ch_k, best_db_k])))
    return max(2, min(optimal_k, upper_k))


def _fit_clustering_engine(
    df_shares: pl.DataFrame,
    customer_ids: List[str],
    share_cols: List[str],
    class_totals: np.ndarray
) -> Tuple[np.ndarray, int, str]:
    """
    Performs Z-score outlier detection, feature standardization, 2D PCA,
    K-means vs GMM competition, and returns cluster assignments.
    """
    share_matrix = df_shares.select(share_cols).to_numpy()

    # Z-Score Outlier filtering (|z| >= 3)
    if len(share_matrix) > 3:
        z_scores = np.abs(stats.zscore(share_matrix, axis=0, nan_policy="omit"))
        clean_mask = (z_scores < 3).all(axis=1)
    else:
        clean_mask = np.ones(len(share_matrix), dtype=bool)

    clean_features = share_matrix[clean_mask]
    clean_weights = class_totals[clean_mask]

    if len(clean_features) == 0:
        clean_features = share_matrix
        clean_weights = class_totals
        clean_mask = np.ones(len(share_matrix), dtype=bool)

    # StandardScaler + 2D PCA
    scaled = StandardScaler().fit_transform(clean_features)
    pca = PCA(n_components=min(2, clean_features.shape[1]), random_state=12345)
    pca_2d = pca.fit_transform(scaled)

    if pca_2d.shape[1] < 2:
        pca_2d = np.hstack([pca_2d, np.zeros((len(pca_2d), 1))])

    # Optimal clusters
    optimal_k = _determine_optimal_clusters(pca_2d)

    # Train Weighted KMeans
    km = KMeans(n_clusters=optimal_k, init="k-means++", max_iter=1000, n_init=10, random_state=12345)
    km_labels = km.fit_predict(pca_2d, sample_weight=clean_weights) + 1

    # Train GMM
    gmm_labels = None
    try:
        gmm = GaussianMixture(n_components=optimal_k, random_state=12345)
        gmm_labels = gmm.fit_predict(pca_2d) + 1
    except Exception:
        pass

    # Model evaluation: S_Dbw if available, else Davies-Bouldin
    best_algo = "kmeans"
    best_labels = km_labels

    try:
        from s_dbw import S_Dbw
        s_km = S_Dbw(pca_2d, km_labels, centers_id=None, method="Tong", alg_noise="bind", centr="mean", metric="euclidean")
        s_scores = {"kmeans": s_km}
        if gmm_labels is not None and len(set(gmm_labels)) > 1:
            s_gmm = S_Dbw(pca_2d, gmm_labels, centers_id=None, method="Tong", alg_noise="bind", centr="mean", metric="euclidean")
            s_scores["gmm"] = s_gmm
        best_algo = min(s_scores, key=s_scores.get)
        best_labels = km_labels if best_algo == "kmeans" else gmm_labels
    except Exception:
        db_km = davies_bouldin_score(pca_2d, km_labels)
        db_scores = {"kmeans": db_km}
        if gmm_labels is not None and len(set(gmm_labels)) > 1:
            db_gmm = davies_bouldin_score(pca_2d, gmm_labels)
            db_scores["gmm"] = db_gmm
        best_algo = min(db_scores, key=db_scores.get)
        best_labels = km_labels if best_algo == "kmeans" else gmm_labels

    # Map back labels, assigning 99 to outliers
    final_clusters = np.full(len(share_matrix), fill_value=99, dtype=int)
    final_clusters[clean_mask] = best_labels

    return final_clusters, optimal_k, best_algo


def _assign_dominant_business_rules(
    df_grouped_sales: pl.DataFrame,
    customer_ids: List[str],
    cluster_labels: np.ndarray,
    products: List[str],
    class_name: str
) -> Tuple[pl.DataFrame, pl.DataFrame]:
    """
    Applies commercial labeling rules and aggregates segment summary statistics using Polars.
    """
    # Polars customer-cluster mapping
    df_cluster_map = pl.DataFrame({
        "customer": customer_ids,
        "cluster_no": cluster_labels
    })

    # Join sales with cluster assignments
    df_joined = df_grouped_sales.join(df_cluster_map, on="customer", how="inner")

    # Cluster-level product sums and class total
    df_cluster_sums = df_joined.group_by(["cluster_no", "product"]).agg(
        pl.col("sales").sum().alias("product_sum")
    ).pivot(
        values="product_sum",
        index="cluster_no",
        on="product"
    ).fill_null(0.0)

    # Customer counts per cluster
    df_cluster_counts = df_cluster_map.group_by("cluster_no").agg(
        pl.col("customer").count().alias("Customer count")
    )

    df_cluster_metrics = df_cluster_counts.join(df_cluster_sums, on="cluster_no", how="inner")

    # Compute class total volume per cluster
    prod_sum_cols = [p for p in products if p in df_cluster_metrics.columns]
    df_cluster_metrics = df_cluster_metrics.with_columns(
        pl.sum_horizontal(prod_sum_cols).alias(f"{class_name} class total")
    )

    # Compute cluster-level product share percentages
    share_exprs = [
        ((pl.col(p) / pl.col(f"{class_name} class total")) * 100.0).alias(f"{p} share")
        for p in prod_sum_cols
    ]
    df_cluster_metrics = df_cluster_metrics.with_columns(share_exprs)

    # Business Heuristic Rules
    num_of_prod = len(prod_sum_cols)
    formula_multi = (100.0 / num_of_prod) * math.floor(num_of_prod / math.floor(num_of_prod / 2))
    multi_prod_min = formula_multi * 0.9
    spreader_min = (100.0 / num_of_prod) * 0.8
    spreader_max = (100.0 / num_of_prod) * 1.2

    # Map labels row by row
    cluster_rows = df_cluster_metrics.to_dicts()
    cluster_to_segment = {}

    for row in cluster_rows:
        clu = row["cluster_no"]
        if clu == 99:
            cluster_to_segment[clu] = "OUTLIER"
            continue

        shares = {p: row.get(f"{p} share", 0.0) for p in prod_sum_cols}
        assigned_segment = None

        # 1. Single product dominance (>50%)
        for p, s in shares.items():
            if s > 50.0:
                assigned_segment = f"{p} DOMINANT"
                break

        # 2. Multi-product dominance for N >= 5
        if assigned_segment is None and num_of_prod >= 5:
            matched = [p for p, s in shares.items() if s > multi_prod_min]
            if len(matched) >= 2:
                assigned_segment = f"{' '.join(matched)} DOMINANT"

        # 3. Multi-product dominance for N in [3, 4]
        if assigned_segment is None and num_of_prod in [3, 4]:
            low = [p for p, s in shares.items() if s <= 15.0]
            high = [p for p, s in shares.items() if s > 35.0]
            if len(low) >= 1 and len(high) == 2:
                assigned_segment = f"{'-'.join(high)} DOMINANT"

        # 4. Spreader (all products within [0.8 * 100/N, 1.2 * 100/N])
        if assigned_segment is None:
            if all(spreader_min <= s <= spreader_max for s in shares.values()):
                assigned_segment = "SPREADER"
            else:
                assigned_segment = "SPREADER"

        cluster_to_segment[clu] = assigned_segment

    # Append Segment label
    df_cluster_metrics = df_cluster_metrics.with_columns(
        pl.col("cluster_no").replace_strict(cluster_to_segment, default="SPREADER").alias("Segment")
    )

    # Consolidate duplicate segment names
    sum_aggs = [pl.col(p).sum().alias(f"{p} sum") for p in prod_sum_cols]
    df_summary = df_cluster_metrics.group_by("Segment").agg([
        pl.col("Customer count").sum(),
        *sum_aggs
    ])

    # Class total after consolidation
    summed_prod_cols = [f"{p} sum" for p in prod_sum_cols]
    df_summary = df_summary.with_columns(
        pl.sum_horizontal(summed_prod_cols).alias(f"{class_name} class total")
    )

    # Derive pct contribution, Avg sales, and share % via Polars expressions
    kpi_exprs = []
    for p in prod_sum_cols:
        col_sum = f"{p} sum"
        total_p = df_summary.select(pl.col(col_sum).sum()).item()
        total_p = total_p if total_p > 0 else 1.0

        kpi_exprs.extend([
            ((pl.col(col_sum) / pl.col(f"{class_name} class total")) * 100.0).round(2).alias(f"{p} share"),
            ((pl.col(col_sum) / total_p) * 100.0).round(2).alias(f"pct {p}"),
            (pl.col(col_sum) / pl.col("Customer count")).round(2).alias(f"{p} Avg")
        ])

    df_summary = df_summary.with_columns(kpi_exprs)

    # Select ordered columns
    pct_cols = [f"pct {p}" for p in prod_sum_cols]
    avg_cols = [f"{p} Avg" for p in prod_sum_cols]
    share_cols = [f"{p} share" for p in prod_sum_cols]
    ordered_cols = ["Segment", "Customer count"] + pct_cols + avg_cols + share_cols
    df_summary = df_summary.select(ordered_cols)

    # Generate customer label table
    df_customer_labels = df_cluster_map.with_columns(
        pl.col("cluster_no").replace_strict(cluster_to_segment, default="SPREADER").alias("Segment")
    ).select(["customer", "Segment"])

    return df_summary, df_customer_labels


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "dominant_segmentation"])
def run_dominant_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto",
    class_col: Optional[str] = None,
    selected_class: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, int, str, List[str]]]:
    """
    Consolidated all-in-one Dominant Segmentation pipeline implemented strictly in Polars.

    Parameters:
        file_path: File path (CSV/Parquet/IPC) or Polars DataFrame / LazyFrame.
        customer_col: Column name identifying unique customer ID.
        product_col: Column name identifying product name.
        sales_col: Column name identifying sales volume, quantity, or revenue.
        date_col: Column containing date/timestamp for time-period evaluation (optional).
        start_date: Start date string (YYYY-MM-DD) when time_period_mode='date_range'.
        end_date: End date string (YYYY-MM-DD) when time_period_mode='date_range'.
        time_period_mode: 'auto' (latest year in data), 'date_range', or 'all'.
        class_col: Column identifying product class / market area (optional).
        selected_class: Specific class to filter by. Defaults to first found class or 'Overall'.

    Returns:
        Dict with keys:
            - 'summary_table': pl.DataFrame segment KPI summary table.
            - 'customer_labels': pl.DataFrame customer-level segment assignments.
            - 'optimal_clusters': Number of clusters selected.
            - 'best_algorithm': Best performing algorithm ('kmeans' or 'gmm').
            - 'products': List of products analyzed.
            - 'time_period_used': Time period string filtered on.
            - 'class_name': Evaluated class name.
    """
    # 1. Read file with Polars
    df_raw = _read_data_polars(file_path)

    # Standardize column names
    col_mapping = {}
    cols_lower = {col.lower().strip(): col for col in df_raw.columns}

    # Match customer
    for cand in [customer_col.lower(), "customer", "customerid", "customer_id", "cstmr_id"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "customer"
            break

    # Match product
    for cand in [product_col.lower(), "product", "item type", "item_type", "product_name"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "product"
            break

    # Match sales
    for cand in [sales_col.lower(), "sales", "units sold", "units", "quantity", "total revenue", "revenue"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "sales"
            break

    # Match date if provided
    if date_col:
        for cand in [date_col.lower(), "date", "order date", "order_date", "trx_date"]:
            if cand in cols_lower:
                col_mapping[cols_lower[cand]] = "date"
                break

    # Match class if provided
    if class_col:
        for cand in [class_col.lower(), "class", "product_class", "region", "market"]:
            if cand in cols_lower:
                col_mapping[cols_lower[cand]] = "class"
                break

    df = df_raw.rename(col_mapping)

    for req in ["customer", "product", "sales"]:
        if req not in df.columns:
            raise KeyError(f"Required column '{req}' not found in file. Columns: {df_raw.columns}")

    # Ensure types
    df = df.with_columns([
        pl.col("customer").cast(pl.Utf8),
        pl.col("product").cast(pl.Utf8),
        pl.col("sales").cast(pl.Float64, strict=False).fill_null(0.0)
    ])

    # 2. Time-period filtering
    time_col = "date" if "date" in df.columns else None
    df_filtered, period_label = _apply_time_period_filter(
        df=df,
        date_col=time_col,
        start_date=start_date,
        end_date=end_date,
        time_period_mode=time_period_mode
    )

    # 3. Class filtering
    if "class" in df_filtered.columns:
        if selected_class:
            df_filtered = df_filtered.filter(pl.col("class") == selected_class)
            class_name = selected_class
        else:
            first_class = df_filtered.select(pl.col("class").drop_nulls().first()).item()
            class_name = str(first_class) if first_class is not None else "Overall"
            df_filtered = df_filtered.filter(pl.col("class") == class_name)
    else:
        class_name = selected_class or "Class"

    # 4. Group by customer & product using Polars expressions
    df_grouped = df_filtered.group_by(["customer", "product"]).agg(
        pl.col("sales").sum()
    )

    # Pivot customer product sales
    df_pivot_sales = df_grouped.pivot(
        values="sales",
        index="customer",
        on="product"
    ).fill_null(0.0)

    products = [c for c in df_pivot_sales.columns if c != "customer"]
    if len(products) <= 1:
        raise ValueError(f"Dominant segmentation requires >= 2 products in class. Found: {products}")

    # Compute customer class totals and product share percentages
    df_pivot_with_total = df_pivot_sales.with_columns(
        pl.sum_horizontal(products).alias("class_total")
    )

    share_exprs = [
        ((pl.col(p) / pl.col("class_total").replace(0.0, None)) * 100.0).fill_null(0.0).alias(f"{p}_share")
        for p in products
    ]
    df_shares = df_pivot_with_total.with_columns(share_exprs)

    customer_ids = df_shares.select("customer").to_series().to_list()
    share_col_names = [f"{p}_share" for p in products]
    class_totals = df_shares.select("class_total").to_numpy().flatten()

    # 5. ML Clustering Engine
    cluster_labels, optimal_k, best_algo = _fit_clustering_engine(
        df_shares=df_shares,
        customer_ids=customer_ids,
        share_cols=share_col_names,
        class_totals=class_totals
    )

    # 6. Commercial Business Rules & KPI Summary
    df_summary, df_customer_labels = _assign_dominant_business_rules(
        df_grouped_sales=df_grouped,
        customer_ids=customer_ids,
        cluster_labels=cluster_labels,
        products=products,
        class_name=class_name
    )

    # Re-attach customer share columns to customer labels
    df_customer_labels = df_customer_labels.join(
        df_shares.select(["customer"] + share_col_names),
        on="customer",
        how="inner"
    )

    return {
        "summary_table": df_summary,
        "customer_labels": df_customer_labels,
        "optimal_clusters": optimal_k,
        "best_algorithm": best_algo,
        "products": products,
        "time_period_used": period_label,
        "class_name": class_name
    }
