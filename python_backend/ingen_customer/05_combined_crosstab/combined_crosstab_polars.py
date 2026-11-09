import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Combined Segmentation & Crosstab Pipeline using Polars
File: spark_ai/ingen_customer/05_combined_crosstab/combined_crosstab_polars.py

Provides a single-entry-point function `run_combined_crosstab_polars` supporting:
  1. Full outer joins between two independent segmentation outputs on 'customer'.
  2. Construction of 2D cross-tabulation matrices using Polars pivot & aggregations.
  3. Generating compound segment names (<Horizontal> - <Vertical>).
  4. Handling residual / unmatched customer groups.
  5. Returning nested JSON crosstab dictionary for heatmap visualization and Polars summary table.
"""

import os
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


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "combined_crosstab"])
def run_combined_crosstab_polars(
    horizontal_data: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    vertical_data: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    customer_col: str = "customer",
    h_segment_col: str = "Segment",
    v_segment_col: str = "Segment",
    h_name: str = "Horizontal",
    v_name: str = "Vertical",
    fill_unmatched: bool = True
) -> Dict[str, Any]:
    """
    Consolidated 2D Combined Segmentation / Crosstab Matrix in Polars.

    Parameters:
        horizontal_data: File path or pl.DataFrame with horizontal segment assignments.
        vertical_data: File path or pl.DataFrame with vertical segment assignments.
        customer_col: Account identifier column.
        h_segment_col: Column name of segment in horizontal dataset.
        v_segment_col: Column name of segment in vertical dataset.
        h_name: Title of horizontal dimension.
        v_name: Title of vertical dimension.
        fill_unmatched: If True, fills missing segments with 'Remaining Group'.

    Returns:
        Dict with:
            - 'crosstab_matrix': pl.DataFrame 2D contingency count matrix.
            - 'customer_labels': pl.DataFrame customer-level compound segment labels.
            - 'summary_table': pl.DataFrame compound segment counts and percentages.
            - 'crosstab_json': Nested dictionary formatted for frontend heatmaps.
    """
    df_h_raw = _read_data_polars(horizontal_data)
    df_v_raw = _read_data_polars(vertical_data)

    # Standardize column names
    df_h = df_h_raw.rename({
        col: "customer" for col in df_h_raw.columns if col.lower().strip() in [customer_col.lower(), "customer", "customerid"]
    })
    df_v = df_v_raw.rename({
        col: "customer" for col in df_v_raw.columns if col.lower().strip() in [customer_col.lower(), "customer", "customerid"]
    })

    df_h = df_h.rename({
        col: "h_segment" for col in df_h.columns if col.lower().strip() in [h_segment_col.lower(), "segment"]
    })
    df_v = df_v.rename({
        col: "v_segment" for col in df_v.columns if col.lower().strip() in [v_segment_col.lower(), "segment"]
    })

    df_h = df_h.select(["customer", "h_segment"]).with_columns([
        pl.col("customer").cast(pl.Utf8),
        pl.col("h_segment").cast(pl.Utf8)
    ])
    df_v = df_v.select(["customer", "v_segment"]).with_columns([
        pl.col("customer").cast(pl.Utf8),
        pl.col("v_segment").cast(pl.Utf8)
    ])

    # Full outer join on customer
    df_merged = df_h.join(df_v, on="customer", how="full")

    # Handle unmatched customers
    if fill_unmatched:
        df_merged = df_merged.with_columns([
            pl.col("h_segment").fill_null(f"Remaining {h_name} Group"),
            pl.col("v_segment").fill_null(f"Remaining {v_name} Group")
        ])
    else:
        df_merged = df_merged.drop_nulls(["h_segment", "v_segment"])

    # Create compound segment label
    df_merged = df_merged.with_columns(
        pl.concat_str([pl.col("h_segment"), pl.lit(" - "), pl.col("v_segment")]).alias("Combined_Segment")
    )

    # Generate 2D contingency table (pivot)
    df_counts = df_merged.group_by(["h_segment", "v_segment"]).agg(
        pl.col("customer").count().alias("count")
    )

    df_matrix = df_counts.pivot(
        values="count",
        index="h_segment",
        on="v_segment"
    ).fill_null(0)

    # Summary table
    total_customers = df_merged.height
    df_summary = df_merged.group_by("Combined_Segment").agg(
        pl.col("customer").count().alias("Customer count")
    ).with_columns([
        ((pl.col("Customer count") / pl.lit(total_customers if total_customers > 0 else 1)) * 100.0).round(2).alias("PCT of Universe")
    ]).sort("Customer count", descending=True)

    # Construct nested JSON format
    crosstab_dict = {}
    h_types = df_merged.select("h_segment").unique().to_series().to_list()
    v_types = df_merged.select("v_segment").unique().to_series().to_list()

    for h in h_types:
        crosstab_dict[h] = {}
        sub_df = df_merged.filter(pl.col("h_segment") == h)
        for v in v_types:
            cnt = sub_df.filter(pl.col("v_segment") == v).height
            crosstab_dict[h][v] = {
                "count": cnt,
                "combined_name": f"{h} - {v}"
            }

    return {
        "crosstab_matrix": df_matrix,
        "customer_labels": df_merged.select(["customer", "h_segment", "v_segment", "Combined_Segment"]),
        "summary_table": df_summary,
        "crosstab_json": {
            "horizontal_dimension": h_name,
            "vertical_dimension": v_name,
            "matrix": crosstab_dict
        }
    }
