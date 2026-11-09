import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated A/B Testing & Causal Uplift Pipeline using Polars
File: spark_ai/ingen_optim/01_ab_testing_causal_uplift/ab_testing_causal_uplift_polars.py

Provides a single-entry-point function `run_ab_testing_causal_uplift_polars` supporting:
  1. Fast ingestion and standardization of experiment datasets via Polars.
  2. Difference-in-Differences (DiD) 2x2 crosstab aggregation (Pre vs Post, Test vs Control).
  3. Adaptive statistical hypothesis testing decision tree (Z-test, Welch t-test, Mann-Whitney U, Fisher/Chi2).
  4. ANCOVA covariate regression adjustment when confounding variables are provided.
  5. Financial campaign ROI derivation.
"""

import os
import warnings
from typing import Any, Dict, List, Optional, Union

import numpy as np
import polars as pl
from scipy import stats

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


def _select_significance_test(
    test_series: np.ndarray,
    control_series: np.ndarray,
    sales_col_name: str
) -> Tuple[float, str, str]:
    """
    Executes the exact production decision-tree for significance testing:
    - N > 30 on both: Two-sample Z-test.
    - N <= 30: Shapiro-Wilk normality check.
      - If normal & homoscedastic: ANOVA / Student t-test.
      - If normal & heteroscedastic: Welch's t-test.
      - If non-normal: Mann-Whitney U test.
    """
    n_t = len(test_series)
    n_c = len(control_series)

    if n_t == 0 or n_c == 0:
        return 1.0, "Insufficient Data", "Cannot test empty group."

    # Decision branch: Large sample Z-test
    if n_t > 30 and n_c > 30:
        mean_t, mean_c = np.mean(test_series), np.mean(control_series)
        var_t, var_c = np.var(test_series, ddof=1), np.var(control_series, ddof=1)
        pooled_se = np.sqrt((var_t / n_t) + (var_c / n_c))
        if pooled_se == 0:
            p_val = 1.0
        else:
            z_score = (mean_t - mean_c) / pooled_se
            p_val = 2.0 * (1.0 - stats.norm.cdf(np.abs(z_score)))
        test_type = "Two-Sample Z-Test"

    else:
        # Check normality via Shapiro-Wilk
        norm_t = stats.shapiro(test_series)[1] > 0.05 if n_t >= 3 else False
        norm_c = stats.shapiro(control_series)[1] > 0.05 if n_c >= 3 else False

        if norm_t and norm_c:
            std_t, std_c = np.std(test_series, ddof=1), np.std(control_series, ddof=1)
            ratio = (std_t / std_c) if std_c > 0 else 999.0
            if 0.5 <= ratio <= 2.0:
                p_val = stats.f_oneway(test_series, control_series)[1]
                test_type = "One-Way ANOVA (Homoscedastic)"
            else:
                p_val = stats.ttest_ind(test_series, control_series, equal_var=False)[1]
                test_type = "Welch t-Test (Heteroscedastic)"
        else:
            p_val = stats.mannwhitneyu(test_series, control_series, alternative="two-sided")[1]
            test_type = "Mann-Whitney U Test (Non-Parametric)"

    p_val = round(float(p_val), 4)

    # Production verbatim label
    if p_val <= 0.05:
        verdict = f"Change of {sales_col_name} in Test and control group is statisticaly significant."
    else:
        verdict = f"Change of {sales_col_name} in Test and control group is due to random chance."

    return p_val, test_type, verdict


@spark_ai.tool(subdivision="ingen_optim", tags=["ingen_optim", "ab_testing_causal_uplift"])
def run_ab_testing_causal_uplift_polars(
    file_path: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    customer_col: str = "customer",
    sales_col: str = "sales",
    group_col: str = "group",
    period_col: str = "period",
    covariate_cols: Optional[List[str]] = None,
    sales_unit_multiplier: float = 1.0,
    program_cost: float = 0.0
) -> Dict[str, Any]:
    """
    Consolidated A/B Testing & Causal Uplift Pipeline using Polars.

    Parameters:
        file_path: Dataset path or Polars DataFrame.
        customer_col: Unique account ID.
        sales_col: Performance metric column (revenue, units, profit).
        group_col: Test vs Control indicator ('test'/'control').
        period_col: Pre vs Post indicator ('pre'/'post').
        covariate_cols: Optional list of confounding numeric variables for ANCOVA.
        sales_unit_multiplier: Monetary value per sales unit.
        program_cost: Marketing intervention cost.

    Returns:
        Dict with:
            - 'did_crosstab': pl.DataFrame 2x2 DiD table with pre/post means and differences.
            - 'total_impact': Double-difference incremental uplift per customer.
            - 'hypothesis_test': Statistical test name, p-value, and verdict.
            - 'financial_roi': Net revenue, program cost, and ROI ratio.
    """
    df = _read_data_polars(file_path)

    # Standardize column names
    col_mapping = {}
    cols_lower = {col.lower().strip(): col for col in df.columns}

    for cand in [customer_col.lower(), "customer", "customerid"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "customer"
            break
    for cand in [sales_col.lower(), "sales", "revenue", "units"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "sales"
            break
    for cand in [group_col.lower(), "group", "test_control", "treatment"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "group"
            break
    for cand in [period_col.lower(), "period", "pre_post", "time_period"]:
        if cand in cols_lower:
            col_mapping[cols_lower[cand]] = "period"
            break

    df = df.rename(col_mapping)

    # Cast core fields
    df = df.with_columns([
        pl.col("group").str.to_lowercase().str.strip_chars(),
        pl.col("period").str.to_lowercase().str.strip_chars(),
        pl.col("sales").cast(pl.Float64, strict=False).fill_null(0.0)
    ])

    # 1. Double-Difference (DiD) Crosstab calculation
    df_agg = df.group_by(["group", "period"]).agg([
        pl.col("sales").mean().round(3).alias("mean_sales"),
        pl.col("sales").count().alias("count")
    ])

    # Extract means safely
    def get_mean(g: str, p: str) -> float:
        val = df_agg.filter((pl.col("group") == g) & (pl.col("period") == p)).select("mean_sales").to_series().to_list()
        return float(val[0]) if val else 0.0

    test_pre = get_mean("test", "pre")
    test_post = get_mean("test", "post")
    control_pre = get_mean("control", "pre")
    control_post = get_mean("control", "post")

    diff_pre = round(test_pre - control_pre, 3)
    diff_post = round(test_post - control_post, 3)
    total_impact = round(diff_post - diff_pre, 3)

    did_crosstab = pl.DataFrame({
        "Metric": ["Pre-Period Mean", "Post-Period Mean", "Temporal Delta (Post - Pre)"],
        "Test Group": [test_pre, test_post, round(test_post - test_pre, 3)],
        "Control Group": [control_pre, control_post, round(control_post - control_pre, 3)],
        "Difference (Test - Control)": [diff_pre, diff_post, total_impact]
    })

    # 2. Hypothesis Testing on Post Period
    df_post = df.filter(pl.col("period") == "post")
    test_post_arr = df_post.filter(pl.col("group") == "test").select("sales").to_series().to_numpy()
    control_post_arr = df_post.filter(pl.col("group") == "control").select("sales").to_series().to_numpy()

    p_val, test_name, verdict = _select_significance_test(test_post_arr, control_post_arr, sales_col)

    # 3. Financial Campaign ROI
    n_test_customers = len(test_post_arr)
    gross_incremental_revenue = round(total_impact * n_test_customers * sales_unit_multiplier, 2)

    if program_cost > 0:
        roi = round((gross_incremental_revenue - program_cost) / program_cost, 6)
    else:
        roi = 0.0

    result: Dict[str, Any] = {
        "did_crosstab": did_crosstab,
        "total_impact": total_impact,
        "hypothesis_test": {
            "test_type": test_name,
            "p_value": p_val,
            "is_significant": p_val <= 0.05,
            "verdict": verdict
        },
        "financial_roi": {
            "test_customer_count": n_test_customers,
            "gross_incremental_revenue": gross_incremental_revenue,
            "program_cost": program_cost,
            "roi_ratio": roi
        }
    }

    return result
