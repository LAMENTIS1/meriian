import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Decile Segmentation Pipeline using Polars
File: spark_ai/ingen_customer/03_decile_segmentation/decile_segmentation_polars.py

Provides a single-entry-point function `run_decile_segmentation_polars` supporting:
  1. High-throughput file loading (CSV, Parquet, IPC) via Polars.
  2. Time-period filtering ('auto' latest year or 'date_range').
  3. Scope flexibility: Product-level deciling or Class-level deciling.
  4. Separation of active volume accounts vs Zero Sales Decile Segment accounts.
  5. Cumulative running volume and percentage calculations using Polars expressions.
  6. Applying the Pareto deciling tiers (Decile 10 down to Decile 1 + Zero sales).
  7. Generating executive summary tables (counts, total sales, PCT, averages).
"""

import os
import warnings
from typing import Dict, List, Optional, Tuple, Union

import polars as pl

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


def _apply_time_period_filter(
    df: pl.DataFrame,
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto"
) -> Tuple[pl.DataFrame, str]:
    """Applies time period filter using Polars expressions."""
    if date_col is None or date_col not in df.columns:
        return df, "All_Data"

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
            return filtered_df, f"{start_date}_to_{end_date}"

    elif time_period_mode == "auto":
        df_years = df_with_date.with_columns(pl.col("__parsed_date").dt.year().alias("__year"))
        max_year = df_years.select(pl.col("__year").max()).item()
        if max_year is not None:
            filtered_df = df_years.filter(pl.col("__year") == max_year).drop(["__parsed_date", "__year"])
            return filtered_df, f"Year_{max_year}"

    return df_with_date.drop("__parsed_date"), "Full_Period"


def _map_decile_segment(pct_cum: float) -> str:
    """Map cumulative volume percentage to decile label."""
    if pct_cum <= 10.5:
        return "Decile 10 (90-100%)"
    elif pct_cum <= 20.5:
        return "Decile 9 (80-90%)"
    elif pct_cum <= 30.5:
        return "Decile 8 (70-80%)"
    elif pct_cum <= 40.5:
        return "Decile 7 (60-70%)"
    elif pct_cum <= 50.5:
        return "Decile 6 (50-60%)"
    elif pct_cum <= 60.5:
        return "Decile 5 (40-50%)"
    elif pct_cum <= 70.5:
        return "Decile 4 (30-40%)"
    elif pct_cum <= 80.5:
        return "Decile 3 (20-30%)"
    elif pct_cum <= 90.5:
        return "Decile 2 (10-20%)"
    else:
        return "Decile 1 (0-10%)"


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "decile_segmentation"])
def run_decile_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto",
    scope: str = "product",
    target_entity: Optional[str] = None,
    class_col: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, str]]:
    """
    Consolidated all-in-one Decile Segmentation pipeline implemented purely in Polars.

    Parameters:
        file_path: File path (CSV/Parquet/IPC) or Polars DataFrame.
        customer_col: Unique customer ID column.
        product_col: Product name column.
        sales_col: Sales volume/units/revenue column.
        date_col: Date column for temporal filtering.
        start_date: Start date string (YYYY-MM-DD).
        end_date: End date string (YYYY-MM-DD).
        time_period_mode: 'auto' (latest year in data), 'date_range', or 'all'.
        scope: 'product' (deciles for one brand) or 'class' (deciles for category).
        target_entity: Specific product or class name to evaluate.
        class_col: Column indicating category/class (required when scope='class').

    Returns:
        Dict with:
            - 'summary_table': pl.DataFrame segment counts, total sales, pct, avg sales.
            - 'customer_labels': pl.DataFrame customer-level assigned decile segment.
            - 'target_entity': Evaluated product or class name.
            - 'time_period_used': Applied time filter label.
    """
    df_raw = _read_data_polars(file_path)

    # Standardize column names
    col_mapping = {}
    cols_lower = {col.lower().strip(): col for col in df_raw.columns}

    for cand in [customer_col.lower(), "customer", "customerid", "customer_id", "cstmr_id"]:
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

    if date_col:
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
    for req in ["customer", "product", "sales"]:
        if req not in df.columns:
            raise KeyError(f"Required column '{req}' not found in dataset. Columns: {df_raw.columns}")

    df = df.with_columns([
        pl.col("customer").cast(pl.Utf8),
        pl.col("product").cast(pl.Utf8),
        pl.col("sales").cast(pl.Float64, strict=False).fill_null(0.0)
    ])

    # Time period filter
    time_col = "date" if "date" in df.columns else None
    df_filtered, period_label = _apply_time_period_filter(
        df=df,
        date_col=time_col,
        start_date=start_date,
        end_date=end_date,
        time_period_mode=time_period_mode
    )

    # 1. Filter by Scope & Entity
    if scope == "class":
        if "class" not in df_filtered.columns:
            raise ValueError("scope='class' selected but 'class' column is missing.")
        if target_entity:
            df_target = df_filtered.filter(pl.col("class") == target_entity)
            entity_name = target_entity
        else:
            first_cls = df_filtered.select(pl.col("class").drop_nulls().first()).item()
            entity_name = str(first_cls) if first_cls else "Class"
            df_target = df_filtered.filter(pl.col("class") == entity_name)
    else:
        if target_entity:
            df_target = df_filtered.filter(pl.col("product") == target_entity)
            entity_name = target_entity
        else:
            top_prod = df_filtered.group_by("product").agg(pl.col("sales").sum()).sort("sales", descending=True).select("product").to_series().to_list()
            entity_name = str(top_prod[0]) if top_prod else "Product"
            df_target = df_filtered.filter(pl.col("product") == entity_name)

    # 2. Get universe of customers and aggregate sales
    all_customers = df_filtered.select("customer").unique()
    df_customer_sales = df_target.group_by("customer").agg(pl.col("sales").sum())

    # Left join with all customers to preserve Zero Sales accounts
    df_pop = all_customers.join(df_customer_sales, on="customer", how="left").with_columns(
        pl.col("sales").fill_null(0.0)
    )

    # 3. Partition Active vs Zero Sales
    df_active = df_pop.filter(pl.col("sales") > 0.0).sort("sales", descending=True)
    df_zero = df_pop.filter(pl.col("sales") == 0.0)

    # 4. Compute Cumulative Running Percentages on Active Population
    total_sales = df_active.select(pl.col("sales").sum()).item()
    if total_sales is None or total_sales == 0.0:
        raise ValueError(f"No active positive sales found for entity '{entity_name}'.")

    df_active = df_active.with_columns([
        pl.col("sales").cum_sum().alias("cum_sales")
    ]).with_columns([
        ((pl.col("cum_sales") / pl.lit(total_sales)) * 100.0).alias("cum_pct")
    ])

    # Assign decile segments to active
    active_cum_pct = df_active.select("cum_pct").to_series().to_list()
    active_labels = [_map_decile_segment(p) for p in active_cum_pct]

    df_active_labeled = df_active.with_columns(
        pl.Series("Segment", active_labels)
    ).select(["customer", "sales", "Segment"])

    # Assign Zero Sales Decile Segment
    df_zero_labeled = df_zero.with_columns(
        pl.lit("Zero Sales Decile Segment").alias("Segment")
    ).select(["customer", "sales", "Segment"])

    # Combine both populations
    df_customer_labels = pl.concat([df_active_labeled, df_zero_labeled])

    # 5. Output Summary Table
    df_summary = df_customer_labels.group_by("Segment").agg([
        pl.col("customer").count().alias("customer count"),
        pl.col("sales").sum().round(2).alias(f"{entity_name} sales total")
    ])

    sum_col = f"{entity_name} sales total"
    overall_total = df_summary.select(pl.col(sum_col).sum()).item()
    overall_total = overall_total if overall_total > 0 else 1.0

    df_summary = df_summary.with_columns([
        ((pl.col(sum_col) / pl.lit(overall_total)) * 100.0).round(2).alias(f"PCT {entity_name}"),
        (pl.col(sum_col) / pl.col("customer count")).round(2).alias(f"{entity_name} Avg")
    ])

    # Canonical sorting order
    tier_order = {
        "Decile 10 (90-100%)": 10,
        "Decile 9 (80-90%)": 9,
        "Decile 8 (70-80%)": 8,
        "Decile 7 (60-70%)": 7,
        "Decile 6 (50-60%)": 6,
        "Decile 5 (40-50%)": 5,
        "Decile 4 (30-40%)": 4,
        "Decile 3 (20-30%)": 3,
        "Decile 2 (10-20%)": 2,
        "Decile 1 (0-10%)": 1,
        "Zero Sales Decile Segment": 0
    }

    df_summary = df_summary.with_columns(
        pl.col("Segment").replace_strict(tier_order, default=-1).alias("__sort_rank")
    ).sort("__sort_rank", descending=True).drop("__sort_rank")

    return {
        "summary_table": df_summary,
        "customer_labels": df_customer_labels,
        "target_entity": entity_name,
        "time_period_used": period_label
    }
