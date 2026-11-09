# Google Meridian MMM Toolkit — Run Guide

This guide explains how to set up the environment, run the modular toolkit (Polars edition), and execute all 61 functions or the automated pipeline.

---

## 1. Quick Environment Setup

Meridian is installed and verified in the Python 3.12 virtual environment located at `./.venv`.

```bash
# Navigate to the workspace
cd /home/srivatsav/Downloads/meridian

# Activate the verified virtual environment
source .venv/bin/activate

# Verify Python version and Meridian installation
python -V
# Expected: Python 3.12.13
python -c "import meridian, polars; print('Meridian Version:', meridian.__version__)"
# Expected: Meridian Version: 2.2.0
```

---

## 2. Option A: Run the End-to-End Automated Pipeline (1 Command)

Runs all data loading, Bayesian modeling, MCMC sampling, health checks, ROI calculation, visualizations, budget optimization, and report export on a 520-row synthetic dataset:

```bash
python meridian_complete_toolkit.py
```

### What gets generated:
All deliverables will be saved to `./meridian_toolkit_output/`:
- **`master_report.html`**: The unified dashboard combining all cards, Vega-Lite charts, and reports into a single file.
- **`results_summary.html`**: Executive marketing report with channel ROIs, revenue shares, and response curves.
- **`model_health_card.html`**: Comprehensive MCMC convergence & diagnostic health card.
- **`fitted_model.pkl`**: Serialized model ready to be reloaded anytime without refitting.
- **`charts/`**: 8 interactive JSON chart specifications (`model_fit.json`, `response_curves.json`, `adstock_decay.json`, `waterfall.json`, `roi_bar.json`, etc.).

---

## 3. Option B: Interactive / Modular Usage (Calling Individual Functions)

Every function in `meridian_complete_toolkit.py` takes a **Polars DataFrame (`df`)** as its first parameter.

You can import and run individual steps inside a Python script or Jupyter Notebook:

```python
import polars as pl
import meridian_complete_toolkit as tk

# Step 1: Create or Load Data in Polars
df = tk.create_demo_dataframe(n_geos=5, n_weeks=104)

# Step 2: Ingest & Inspect
input_data = tk.fn_01_load_data(df)
info = tk.fn_03_inspect_input_data(df, input_data)

# Step 3: Build Specification (Hill curves, baseline knots)
spec = tk.fn_07_build_model_spec(df, saturation="hill", knots=1)

# Step 4: Fit Model via MCMC (No-U-Turn Sampler / NUTS)
# (Use n_chains=2, n_keep=200 for fast tests; n_chains=4, n_keep=1000 for production)
mmm = tk.fn_12_fit_model(
    df, input_data, spec, n_chains=2, n_adapt=100, n_burnin=100, n_keep=200
)

# Step 5: Review Convergence & Diagnostics
health_summary = tk.fn_13_run_health_review(df, mmm, output_dir="./output")
accuracy = tk.fn_16_get_predictive_accuracy(df, mmm)

# Step 6: Extract Business Metrics (ROI, mROI, Incremental KPI)
roi = tk.fn_19_get_roi(df, mmm)
mroi = tk.fn_20_get_mroi(df, mmm)
incremental_volume = tk.fn_22_get_incremental_kpi(df, mmm)

# Step 7: Generate Visualizations (Saved as Vega-Lite JSON)
tk.fn_34_plot_model_fit(df, mmm, output_dir="./output/charts")
tk.fn_37_plot_response_curves(df, mmm, output_dir="./output/charts")
tk.fn_40_plot_waterfall(df, mmm, output_dir="./output/charts")
tk.fn_43_plot_roi_bar(df, mmm, output_dir="./output/charts")

# Step 8: Run Budget Optimization
opt_result = tk.fn_48_optimize_fixed_budget(df, mmm, spend_lower=0.5, spend_upper=0.5)

# Step 9: Export Reports & Persistence
html_path = tk.fn_53_generate_html_summary(df, mmm, output_dir="./output")
saved_path = tk.fn_54_save_model(df, mmm, path="./output/fitted_model.pkl")
```

---

## 4. Option C: Advanced Enterprise Features (Group 12)

### Experimental Calibration (GeoX Lift Tests)
```python
# Injects experiment lift into channel priors
calibrated_prior = tk.fn_58_calibrate_with_experiments(
    df,
    input_data,
    channel="Channel0",
    point_estimate=2.2,
    standard_error=0.4,
    start_date="2022-01-03",
    end_date="2022-01-24",
)
```

### Automatic Knot Selection (AKS)
```python
# Enables Meridian's dynamic baseline knot selector
spec_aks = tk.fn_59_build_advanced_model_spec(
    df, enable_aks=True, adstock_decay_spec="geometric"
)
```

### MLflow Autologging
```python
# Automatically logs priors, chains, and artifacts to MLflow
tk.fn_60_setup_mlflow_tracking(df, experiment_name="Marketing_MMM_Q4")
```

### Reloading Saved Models Without Refitting
```python
# Instantly reload your model without re-running MCMC
loaded_mmm = tk.fn_55_load_model(df, path="./output/fitted_model.pkl")
loaded_roi = tk.fn_19_get_roi(df, loaded_mmm)
```

---

## 5. Viewing Generated Reports in Browser

To open the master report:
```bash
# Linux
xdg-open ./meridian_toolkit_output/master_report.html

# Or start a local lightweight web server:
python -m http.server 8000 --directory ./meridian_toolkit_output
# Then visit: http://localhost:8000/master_report.html
```
