import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Custom Segmentation & Comparison Pipeline using Polars
File: spark_ai/ingen_customer/06_custom_segmentation/custom_segmentation_polars.py

Provides a single-entry-point function `run_custom_segmentation_polars` supporting:
  1. Translating arbitrary nested JSON predicate trees into Polars expressions.
  2. Filtering large datasets with Polars lazy / eager evaluation.
  3. Labelling cohort vs non-cohort customer populations.
  4. Performing set comparisons (intersections, unique differentials, Jaccard similarity)
     against secondary datasets or cohorts.
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


def _build_polars_predicate(variable_spec: Dict[str, Any]) -> pl.Expr:
    """Build a single Polars filter expression from a condition dictionary."""
    col = variable_spec.get("header") or variable_spec.get("column")
    op = str(variable_spec.get("logics") or variable_spec.get("operator")).strip().lower()
    val = variable_spec.get("value")

    if op in ["=", "==", "eq"]:
        return pl.col(col) == val
    elif op in ["!=", "<>", "ne"]:
        return pl.col(col) != val
    elif op in [">", "gt"]:
        return pl.col(col) > float(val)
    elif op in ["<", "lt"]:
        return pl.col(col) < float(val)
    elif op in [">=", "gte"]:
        return pl.col(col) >= float(val)
    elif op in ["<=", "lte"]:
        return pl.col(col) <= float(val)
    elif op in ["in", "is_in"]:
        val_list = val if isinstance(val, list) else [val]
        return pl.col(col).is_in(val_list)
    elif op in ["not in", "is_not_in", "nin"]:
        val_list = val if isinstance(val, list) else [val]
        return ~pl.col(col).is_in(val_list)
    elif op in ["contains", "like"]:
        return pl.col(col).str.contains(str(val))
    else:
        raise ValueError(f"Unsupported operator: {op}")


@spark_ai.tool(subdivision="ingen_customer", tags=["ingen_customer", "custom_segmentation"])
def run_custom_segmentation_polars(
    file_path: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    segment_name: str = "Custom_Cohort",
    filter_groups: Optional[List[Dict[str, Any]]] = None,
    top_level_logic: str = "AND",
    primary_key: str = "customer",
    compare_with_file: Optional[Union[str, pl.DataFrame]] = None,
    secondary_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Consolidated Custom Segmentation & Comparison Pipeline using Polars.

    Parameters:
        file_path: Path to dataset or existing Polars DataFrame.
        segment_name: Label for the filtered cohort.
        filter_groups: List of filter group dicts containing 'variables' and 'group_logic'.
        top_level_logic: 'AND' or 'OR' between groups.
        primary_key: Account identifier in primary dataset.
        compare_with_file: Secondary dataset to run set-theoretic comparison against.
        secondary_key: Key in secondary dataset (defaults to primary_key).

    Returns:
        Dict with:
            - 'cohort_data': pl.DataFrame matching cohort records.
            - 'customer_labels': pl.DataFrame all customers tagged with cohort or 'Outside Cohort'.
            - 'summary': Dictionary with counts and coverage.
            - 'comparison': (If compare_with_file provided) overlap counts and Jaccard similarity.
    """
    df = _read_data_polars(file_path)

    # Standardize primary key if needed
    for c in df.columns:
        if c.lower().strip() in [primary_key.lower(), "customer", "customerid"]:
            df = df.rename({c: "customer"})
            break

    # Build group expressions
    group_expressions = []
    if filter_groups:
        for group in filter_groups:
            vars_list = group.get("variables", [])
            group_logic = group.get("group_logic", "AND").upper()
            var_exprs = [_build_polars_predicate(v) for v in vars_list]

            if var_exprs:
                if group_logic == "OR":
                    group_expr = pl.any_horizontal(var_exprs)
                else:
                    group_expr = pl.all_horizontal(var_exprs)
                group_expressions.append(group_expr)

    # Combine top-level expressions
    if group_expressions:
        if top_level_logic.upper() == "OR":
            final_filter = pl.any_horizontal(group_expressions)
        else:
            final_filter = pl.all_horizontal(group_expressions)
        df_cohort = df.filter(final_filter)
    else:
        df_cohort = df

    # Label all customers
    cohort_customers = df_cohort.select("customer").unique().to_series().to_list()
    df_customer_labels = df.select("customer").unique().with_columns(
        pl.when(pl.col("customer").is_in(cohort_customers))
        .then(pl.lit(segment_name))
        .otherwise(pl.lit("Outside_Cohort"))
        .alias("Segment")
    )

    total_universe = df.select("customer").n_unique()
    cohort_count = len(cohort_customers)

    res: Dict[str, Any] = {
        "cohort_data": df_cohort,
        "customer_labels": df_customer_labels,
        "summary": {
            "cohort_name": segment_name,
            "cohort_customer_count": cohort_count,
            "total_universe_count": total_universe,
            "coverage_pct": round((cohort_count / total_universe) * 100.0, 2) if total_universe > 0 else 0.0
        }
    }

    # Set Comparison if secondary file provided
    if compare_with_file:
        df_sec = _read_data_polars(compare_with_file)
        sec_key = secondary_key or primary_key
        for c in df_sec.columns:
            if c.lower().strip() in [sec_key.lower(), "customer", "customerid"]:
                df_sec = df_sec.rename({c: "customer"})
                break

        sec_customers = set(df_sec.select("customer").unique().to_series().to_list())
        cohort_set = set(cohort_customers)

        intersection = cohort_set.intersection(sec_customers)
        only_cohort = cohort_set.difference(sec_customers)
        only_sec = sec_customers.difference(cohort_set)
        union = cohort_set.union(sec_customers)

        jaccard = (len(intersection) / len(union)) if len(union) > 0 else 0.0

        res["comparison"] = {
            "cohort_count": len(cohort_set),
            "secondary_count": len(sec_customers),
            "overlap_count": len(intersection),
            "only_in_cohort": len(only_cohort),
            "only_in_secondary": len(only_sec),
            "jaccard_similarity": round(jaccard, 4)
        }

    return res
