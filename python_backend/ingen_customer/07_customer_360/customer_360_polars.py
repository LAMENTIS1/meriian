import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Customer 360 Segmentation Pipeline using Polars
File: spark_ai/ingen_customer/07_customer_360/customer_360_polars.py

Provides a single-entry-point function `run_customer_360_polars` supporting:
  1. High-speed sequential full outer joins across multiple segmentation runs using Polars.
  2. Flexible source ingestion (file paths, Polars DataFrames, or configuration dicts).
  3. Dynamic column renaming per segmentation dimension.
  4. Database-safe column name sanitization (length <= 63 chars, bracket conversion).
  5. Generating master wide table with complete customer 360 profile and summary stats.
"""

import os
import re
import warnings
from typing import Any, Dict, List, Optional, Union

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


def _sanitize_header(col_name: str) -> str:
    """Sanitize column name for PostgreSQL & BI limits (<= 63 characters, replace parentheses)."""
    clean = str(col_name).replace("(", "[").replace(")", "]")
    clean = re.sub(r"[^\w\[\]_ ]", "_", clean).strip()
    return clean[:63]


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "customer_360"])
def run_customer_360_polars(
    segment_sources: Optional[List[Union[str, pl.DataFrame, Dict[str, Any]]]] = None,
    customer_col: str = "customer",
    default_fill_value: Optional[str] = "Not Evaluated",
    sanitize_headers: bool = True
) -> Dict[str, Any]:
    """
    Consolidated Customer 360 Master Profiling Pipeline using Polars.

    Parameters:
        segment_sources: List of file paths, DataFrames, or source dicts:
                         [{'data': path_or_df, 'alias': 'Col_Name', 'seg_col': 'Segment'}]
        customer_col: Account identifier column.
        default_fill_value: Value to replace nulls for unmeasured customers.
        sanitize_headers: Enforce SQL/BI header standards (<= 63 chars).

    Returns:
        Dict with:
            - 'customer_360_master': pl.DataFrame master wide customer profile table.
            - 'total_unique_customers': Total unified accounts.
            - 'dimensions': List of unified dimension columns.
            - 'dimension_summaries': Value counts per dimension.
    """
    if segment_sources is None:
        segment_sources = ["/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv"]

    if not segment_sources:
        raise ValueError("At least one segmentation source must be provided.")

    processed_dfs: List[pl.DataFrame] = []
    dimension_names: List[str] = []

    for idx, src in enumerate(segment_sources):
        if isinstance(src, dict):
            raw_input = src.get("data")
            alias = src.get("alias") or f"Dimension_{idx+1}"
            seg_col_name = src.get("seg_col") or "Segment"
        else:
            raw_input = src
            alias = f"Dimension_{idx+1}"
            seg_col_name = "Segment"

        df_in = _read_data_polars(raw_input)

        # Map customer
        for c in df_in.columns:
            if c.lower().strip() in [customer_col.lower(), "customer", "customerid"]:
                df_in = df_in.rename({c: "customer"})
                break

        # Map segment column
        for c in df_in.columns:
            if c != "customer" and c.lower().strip() in [seg_col_name.lower(), "segment"]:
                df_in = df_in.rename({c: alias})
                break

        if alias not in df_in.columns:
            # Pick first non-customer column as segment
            non_c = [col for col in df_in.columns if col != "customer"]
            if non_c:
                df_in = df_in.rename({non_c[0]: alias})
            else:
                raise ValueError(f"No segment column found in source {idx+1}")

        if sanitize_headers:
            clean_alias = _sanitize_header(alias)
            df_in = df_in.rename({alias: clean_alias})
            alias = clean_alias

        df_sub = df_in.select(["customer", alias]).with_columns([
            pl.col("customer").cast(pl.Utf8),
            pl.col(alias).cast(pl.Utf8)
        ]).unique(subset=["customer"])

        processed_dfs.append(df_sub)
        dimension_names.append(alias)

    # Sequential Full Outer Join across all sources
    master_df = processed_dfs[0]
    for df_next in processed_dfs[1:]:
        master_df = master_df.join(df_next, on="customer", how="full")

    # Apply default fill value
    if default_fill_value is not None:
        fill_exprs = [pl.col(d).fill_null(default_fill_value) for d in dimension_names]
        master_df = master_df.with_columns(fill_exprs)

    # Generate dimension value distributions
    dim_summaries = {}
    for d in dimension_names:
        counts = master_df.group_by(d).agg(pl.col("customer").count().alias("count")).sort("count", descending=True)
        dim_summaries[d] = counts.to_dicts()

    return {
        "customer_360_master": master_df,
        "total_unique_customers": master_df.height,
        "dimensions": dimension_names,
        "dimension_summaries": dim_summaries
    }
