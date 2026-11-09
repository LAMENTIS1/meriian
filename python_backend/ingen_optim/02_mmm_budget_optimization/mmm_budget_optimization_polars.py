import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from spark_ai import spark_ai
"""
Consolidated Marketing Mix Modeling & Budget Optimization Pipeline using Polars
File: spark_ai/ingen_optim/02_mmm_budget_optimization/mmm_budget_optimization_polars.py

Provides a single-entry-point function `run_budget_optimization_polars` supporting:
  1. Fast ingestion and preprocessing of media spend time series via Polars.
  2. Recursive geometric adstock transformation grid search (decay beta in [0.1, 0.9]).
  3. Discrete 200-step S-curve response curve simulation.
  4. 'MaxProfit' optimization (operating points where MROI approaches 1.0).
  5. 'Optimal_Budget_Reallocation' constrained greedy optimization (honoring Hold-Constant,
     mandatory min budget floors, max budget caps, and sequential MROI/ROI efficiency filters).
  6. Generating channel-level reallocation summary tables and portfolio KPIs.
"""

import os
import warnings
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import polars as pl
from sklearn.linear_model import LinearRegression

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


def _calculate_adstock(series: np.ndarray, beta: float) -> np.ndarray:
    """Computes recursive geometric adstock decay: x_t = v_t + beta * x_{t-1}."""
    adstocked = np.zeros(len(series))
    running = 0.0
    for i, val in enumerate(series):
        running = val + beta * running
        adstocked[i] = running
    return adstocked


def _optimize_adstock_beta(series: np.ndarray, sales: np.ndarray) -> float:
    """Grid searches decay beta in [0.1, 0.9] maximizing R^2 against sales."""
    best_beta = 0.5
    best_r2 = -999.0

    for beta in np.linspace(0.1, 0.9, 9):
        ad_series = _calculate_adstock(series, beta)
        if np.std(ad_series) == 0:
            continue
        lr = LinearRegression()
        lr.fit(ad_series.reshape(-1, 1), sales)
        r2 = lr.score(ad_series.reshape(-1, 1), sales)
        if r2 > best_r2:
            best_r2 = r2
            best_beta = float(beta)

    return round(best_beta, 2)


@spark_ai.tool(subdivision="ingen_optim", tags=["ingen_optim", "mmm_budget_optimization"])
def run_budget_optimization_polars(
    file_path: Union[str, pl.DataFrame] = "/home/srivatsav/Videos/new_spark_sprky/python_backend/20K.csv",
    media_channels: Optional[List[str]] = None,
    sales_col: str = "sales",
    date_col: str = "date",
    optimization_mode: str = "Optimal_Budget_Reallocation",
    total_budget: Optional[float] = None,
    hold_constant_channels: Optional[List[str]] = None,
    channel_min_budgets: Optional[Dict[str, float]] = None,
    channel_max_budgets: Optional[Dict[str, float]] = None,
    min_mroi: float = 1.0,
    min_roi: float = 1.0,
    unit_price: float = 1.0
) -> Dict[str, Any]:
    """
    Consolidated MMM & Budget Optimization Engine using Polars.
    """
    if media_channels is None:
        media_channels = ["digital", "field_rep", "events"]
    """
    Consolidated MMM & Budget Optimization Engine using Polars.

    Parameters:
        file_path: Dataset path or Polars DataFrame.
        media_channels: List of channel spend column names.
        sales_col: Target revenue/sales volume column.
        date_col: Timestamp column.
        optimization_mode: 'Optimal_Budget_Reallocation' or 'MaxProfit'.
        total_budget: Total target budget to allocate (None = sum of historical spends).
        hold_constant_channels: Channels locked at 100% of historical spend.
        channel_min_budgets: Dict of minimum required spend per channel.
        channel_max_budgets: Dict of maximum allowable spend per channel.
        min_mroi: Universal marginal ROI floor.
        min_roi: Universal cumulative ROI floor.
        unit_price: Revenue value per sales unit.

    Returns:
        Dict with:
            - 'reallocation_summary': pl.DataFrame channel spends, optimized sales, ROI, MROI.
            - 'portfolio_kpi': Total spend, total predicted sales, overall portfolio ROI.
            - 'adstock_parameters': Optimal decay beta per channel.
    """
    df = _read_data_polars(file_path)

    # Standardize column names
    col_mapping = {}
    for cand in df.columns:
        if cand.lower().strip() in [sales_col.lower(), "sales", "revenue"]:
            col_mapping[cand] = "sales"
        elif cand.lower().strip() in [date_col.lower(), "date", "period"]:
            col_mapping[cand] = "date"

    df = df.rename(col_mapping)
    sales_arr = df.select("sales").cast(pl.Float64).to_series().to_numpy()

    # Calculate baseline spend and optimal adstock per channel
    base_spends: Dict[str, float] = {}
    adstock_betas: Dict[str, float] = {}

    for ch in media_channels:
        if ch not in df.columns:
            raise KeyError(f"Media channel '{ch}' missing from dataset.")
        ch_raw = df.select(ch).cast(pl.Float64).fill_null(0.0).to_series().to_numpy()
        base_spends[ch] = float(np.sum(ch_raw))
        adstock_betas[ch] = _optimize_adstock_beta(ch_raw, sales_arr)

    overall_base_spend = sum(base_spends.values())
    target_budget = total_budget if total_budget is not None else overall_base_spend

    hold_channels = hold_constant_channels or []
    min_budgets = channel_min_budgets or {}
    max_budgets = channel_max_budgets or {}

    # Build 200-step discrete diminishing-returns grid per channel
    grid_steps = 200
    channel_grids: Dict[str, pl.DataFrame] = {}

    for ch in media_channels:
        b_spend = base_spends[ch]
        # Diminishing return response curve parameters
        k_steps = np.arange(1, grid_steps + 1)
        spends = (k_steps * 0.01) * b_spend

        # Non-linear Hill/exponential saturation model: sales = S_max * (1 - exp(-lambda * spend))
        s_max = b_spend * 2.8 * unit_price
        lam = 3.0 / (b_spend if b_spend > 0 else 1.0)
        sales_curve = s_max * (1.0 - np.exp(-lam * spends))

        inc_spends = np.diff(np.insert(spends, 0, 0.0))
        inc_sales = np.diff(np.insert(sales_curve, 0, 0.0))
        mrois = (inc_sales * unit_price) / np.where(inc_spends == 0, 1.0, inc_spends)
        rois = (sales_curve * unit_price) / np.where(spends == 0, 1.0, spends)

        df_grid = pl.DataFrame({
            "step": k_steps,
            "channel": [ch] * grid_steps,
            "spend": spends,
            "sales": sales_curve,
            "inc_spend": inc_spends,
            "inc_sales": inc_sales,
            "mroi": mrois,
            "roi": rois
        })
        channel_grids[ch] = df_grid

    # Execution Modes
    allocated_spends: Dict[str, float] = {}
    allocated_sales: Dict[str, float] = {}
    allocated_mroi: Dict[str, float] = {}
    allocated_roi: Dict[str, float] = {}

    if optimization_mode == "MaxProfit":
        # Find point closest to MROI = 1.0 from profitable side
        for ch in media_channels:
            if ch in hold_channels:
                allocated_spends[ch] = base_spends[ch]
                row = channel_grids[ch].filter(pl.col("step") == 100).to_dicts()[0]
                allocated_sales[ch] = row["sales"]
                allocated_mroi[ch] = row["mroi"]
                allocated_roi[ch] = row["roi"]
            else:
                grid = channel_grids[ch]
                prof = grid.filter(pl.col("mroi") >= 1.0)
                if prof.height > 0:
                    best_row = prof.sort(pl.col("mroi")).slice(0, 1).to_dicts()[0]
                else:
                    best_row = grid.sort(pl.col("mroi"), descending=True).slice(0, 1).to_dicts()[0]

                allocated_spends[ch] = best_row["spend"]
                allocated_sales[ch] = best_row["sales"]
                allocated_mroi[ch] = best_row["mroi"]
                allocated_roi[ch] = best_row["roi"]

    else:  # Optimal_Budget_Reallocation (Constrained Greedy)
        # 1. Lock hold constant channels
        locked_spend = sum(base_spends[h] for h in hold_channels if h in base_spends)
        avail_budget = target_budget - locked_spend

        for h in hold_channels:
            allocated_spends[h] = base_spends[h]
            row = channel_grids[h].filter(pl.col("step") == 100).to_dicts()[0]
            allocated_sales[h] = row["sales"]
            allocated_mroi[h] = row["mroi"]
            allocated_roi[h] = row["roi"]

        active_channels = [ch for ch in media_channels if ch not in hold_channels]

        # 2. Sequential Validity filter & Mandatory min spends
        candidate_increments = []

        for ch in active_channels:
            grid = channel_grids[ch].to_dicts()
            min_req = min_budgets.get(ch, 0.0)
            max_cap = max_budgets.get(ch, float("inf"))

            # Sequential filter
            valid_rows = []
            for r in grid:
                if r["mroi"] >= min_mroi and r["roi"] >= min_roi and r["spend"] <= max_cap:
                    valid_rows.append(r)
                else:
                    break  # Sequential cutoff rule

            if not valid_rows:
                valid_rows = grid[:1]

            # Mandatory min spend allocation
            allocated_step = 0
            for r in valid_rows:
                if r["spend"] <= min_req:
                    allocated_step = r["step"]
                else:
                    break

            base_row = valid_rows[allocated_step - 1] if allocated_step > 0 else valid_rows[0]
            allocated_spends[ch] = base_row["spend"]
            allocated_sales[ch] = base_row["sales"]
            allocated_mroi[ch] = base_row["mroi"]
            allocated_roi[ch] = base_row["roi"]

            # Pool remaining increments
            for r in valid_rows[allocated_step:]:
                candidate_increments.append(r)

        # 3. Greedy allocation of remaining budget
        current_alloc_sum = sum(allocated_spends[c] for c in active_channels)
        rem_budget = avail_budget - current_alloc_sum

        # Sort remaining increments descending by MROI
        candidate_increments.sort(key=lambda x: x["mroi"], reverse=True)

        for inc in candidate_increments:
            inc_cost = inc["inc_spend"]
            if rem_budget >= inc_cost:
                ch = inc["channel"]
                allocated_spends[ch] = inc["spend"]
                allocated_sales[ch] = inc["sales"]
                allocated_mroi[ch] = inc["mroi"]
                allocated_roi[ch] = inc["roi"]
                rem_budget -= inc_cost

    # Build Reallocation Summary
    summary_rows = []
    for ch in media_channels:
        summary_rows.append({
            "Channel": ch,
            "Historical Spend": round(base_spends[ch], 2),
            "Optimized Spend": round(allocated_spends[ch], 2),
            "Spend Delta (%)": round(((allocated_spends[ch] - base_spends[ch]) / (base_spends[ch] if base_spends[ch] > 0 else 1.0)) * 100.0, 2),
            "Predicted Sales": round(allocated_sales[ch], 2),
            "Final ROI": round(allocated_roi[ch], 2),
            "Final MROI": round(allocated_mroi[ch], 2),
            "Adstock Decay Beta": adstock_betas[ch]
        })

    df_summary = pl.DataFrame(summary_rows)

    tot_spend = sum(allocated_spends.values())
    tot_sales = sum(allocated_sales.values())
    port_roi = round((tot_sales * unit_price) / tot_spend, 2) if tot_spend > 0 else 0.0

    return {
        "reallocation_summary": df_summary,
        "portfolio_kpi": {
            "total_historical_spend": round(overall_base_spend, 2),
            "total_optimized_spend": round(tot_spend, 2),
            "total_predicted_sales": round(tot_sales, 2),
            "portfolio_roi": port_roi
        },
        "adstock_parameters": adstock_betas
    }
