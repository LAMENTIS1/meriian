# The Story of Meridian — 15 Chapters, One Complete Picture

> *Imagine you run a large brand. You spend millions across TV, Search, Social, YouTube, Display, and Promotions every year. You have no idea which one actually works. You just guess. Meridian was built to end that guessing.*

---

## Chapter 1 — The Problem (Why Any of This Exists)

You are the CMO of a consumer brand. Every quarter someone asks:

> *"We spent ₹10 crore on ads last month. Which channel drove our sales?"*

You shrug. Your media agency says Search worked. Your YouTube partner says YouTube worked. Your TV agency says TV built brand. They are all right because they each measure themselves.

This is called **attribution bias** — everyone takes credit, nobody is wrong, and you are out of ₹10 crore with no real answer.

**Meridian solves this.** It is a statistical engine built by Google that looks at all your channels together — from the same bird's-eye view — and uses mathematics to separate what actually drove your KPI from what just happened at the same time.

---

## Chapter 2 — What Kind of Data You Need (Demo: `geo_all_channels.csv`)

Meridian does not use user-level data. No cookies. No tracking pixels. No GDPR risk.

It uses **aggregated panel data** — a simple table like this:

| geo    | time       | Channel0_impression | Channel0_spend | conversions | revenue_per_conversion | population |
|--------|------------|---------------------|----------------|-------------|------------------------|------------|
| Geo0   | 2021-01-25 | 280,668             | ₹2,058         | 1,954,576   | 0.02                   | 136,671    |
| Geo1   | 2021-01-25 | 310,100             | ₹2,400         | 2,100,000   | 0.021                  | 190,000    |

**One row = one region × one week.**

That is all Meridian needs. This data lives in `demo/geo_all_channels.csv` and has:
- **5 paid channels** (Channel 0–4): impressions + spend per geo per week
- **1 organic channel**: free impressions (social shares, SEO)
- **2 control variables**: competitor sales, sentiment score
- **1 treatment**: Promo column (whether a promotion ran that week)
- **KPI**: conversions and revenue per conversion

> **Key insight:** Because you have data across *multiple geos* and *multiple weeks*, Meridian can compare regions where you spent heavily vs lightly and isolate the real effect — this is the power of geo-level panel data.

---

## Chapter 3 — The Builder Pattern (Assembling Your Data)

The first thing Meridian does is take your messy DataFrame and build a clean, validated, multi-dimensional structure called `InputData`.

You use a **builder** — think of it like filling a form:

```python
# Skills reference: meridian_model_building/references/data_builder_template.md
builder = DataFrameInputDataBuilder(kpi_type='non_revenue')
builder = (
    builder
    .with_kpi(df)                           # ← your outcome column
    .with_revenue_per_kpi(df)              # ← how much each conversion is worth
    .with_population(df)                   # ← so Geo0 (1M people) ≠ Geo1 (100K)
    .with_controls(df, ["competitor_sales_control", "sentiment_score_control"])
    .with_non_media_treatments(df, ["Promo"])
    .with_organic_media(df, ["Organic_channel0_impression"])
    .with_media(df, ["Channel0_impression", ...])
    .with_media_spend(df, ["Channel0_spend", ...])
)
data = builder.build()
```

After `build()`, Meridian validates:
- ✓ Are all geos and time periods aligned?
- ✓ Are spend values non-negative?
- ✓ Do impression and spend columns match in shape?

If anything is wrong, it tells you exactly what before you waste hours fitting a broken model.

---

## Chapter 4 — Adstock: Ads Don't Die the Day You Run Them

Here is a truth every marketer knows intuitively but rarely models:

> A TV ad you ran in January still affects someone's purchase decision in March.

This "carry-over" effect is called **Adstock**. Meridian models it with a **geometric decay function** — the effect of your ad halves (or thirds) each week until it fades.

```
Week 0  →  100% effect (the week the ad ran)
Week 1  →  50% effect
Week 2  →  25% effect
Week 3  →  12.5% effect …
```

The decay rate `alpha` is **learned from your data** per channel. TV might have alpha=0.7 (long memory). Search might have alpha=0.1 (almost no carry-over). Meridian fits both simultaneously.

You configure this in `ModelSpec`:

```python
# From: skills/meridian_model_building/references/model_spec_template.md
alpha_m = tfd.Uniform(low=0.1, high=0.8)  # prior on how fast ads fade
max_lag = 8                                # maximum weeks of carry-over
```

---

## Chapter 5 — Hill Curves: Why More Spend Doesn't Always Mean More Sales

The second transformation Meridian applies is **diminishing returns** — modelled by the Hill function.

The idea: your first ₹1 lakh on Search ads is very powerful. Your 100th ₹1 lakh is reaching the same people again and again. The marginal value drops.

The Hill curve captures this S-shape:

```
Spend       →    Response
  ₹0        →    0%
  ₹10L      →    40%   ← steepest gain
  ₹20L      →    65%
  ₹50L      →    85%   ← flattening out
  ₹200L     →    97%   ← near saturation
```

Meridian models this per-channel with two parameters:
- **`ec`** (half-saturation point): spend at which you get 50% of max response
- **`slope`**: how steep or gradual the curve is

Both are learned from data. You can visualise them after fitting with `MediaEffects.plot_response_curves()`.

---

## Chapter 6 — Bayesian Priors: Injecting What You Already Know

This is where Meridian is fundamentally different from a standard regression.

A normal regression starts completely blind — it treats every channel as equally unknown. Meridian uses **Bayesian priors** — you can tell the model what you already believe before it even sees the data.

Example: You know from past experience that your Search ROI is usually between 2× and 5×. You set:

```python
# From: skills/meridian_model_building/references/model_spec_template.md
from meridian import backend
tfd = backend.tfd

prior = PriorDistribution(
    roi_m = tfd.LogNormal(loc=0.2, scale=0.5),  # most likely ROI ~1.2× to 4×
    alpha_m = tfd.Uniform(low=0.1, high=0.8),   # adstock decay range
    ec_m = tfd.TruncatedNormal(loc=0.5, scale=0.2, low=0.1, high=10.0),
)
```

The model starts from your belief and **updates it with data**. If the data strongly contradicts your prior, the posterior will shift. If the data is noisy, your prior protects the model from going to crazy values.

> **Business impact:** This is why Meridian handles channels with sparse data (e.g. TV only ran for 4 weeks) much better than OLS regression — the prior anchors the estimate.

---

## Chapter 7 — Calibration: Using Your Own Experiments as Ground Truth

This is the most powerful feature in `demo/Meridian_Prior_Calibration_JAX.ipynb`.

Suppose your team ran a **geo-lift experiment** (or bought an incrementality test from Meta/Google) for Channel0 last year. You found that Channel0 drives a true ROI of 2.3×.

You can inject that into the model as a Bayesian prior constraint using `CalibrationBuilder`:

```python
# Case A: Direct GeoX experiment
calibration_builder = CalibrationBuilder(input_data)
calibration_builder.with_meridian_geox_experiment_result(
    channel="Channel0",
    experiment_result=geox_result,     # ROI = 2.3x from your experiment
)

# Case B: Manual incrementality test result
calibration_builder.with_incrementality_experiment_result(
    channel="Channel1",
    roi_lower=1.5, roi_upper=3.0,
)

# Case C: Mixed — both GeoX and generic experiment for same channel
calibration_builder.with_meridian_geox_experiment_result(channel="Channel2", ...)
calibration_builder.with_incrementality_experiment_result(channel="Channel2", ...)
```

The model blends all three inputs mathematically and produces posteriors that are anchored to real-world ground truth — not just model assumptions.

---

## Chapter 8 — MCMC Sampling: The Engine That Does the Math

This is what actually "fits" the model. Meridian uses **No-U-Turn Sampler (NUTS)** — an advanced MCMC algorithm that explores the entire probability distribution of every parameter simultaneously.

```python
mmm.sample_prior(500)         # 1st — check what your priors imply
mmm.sample_posterior(          # 2nd — the real fitting
    n_chains=10,
    n_adapt=1000,
    n_burnin=500,
    n_keep=1000,
)
```

What comes out is not a single number for ROI. It is a **distribution of 10,000 possible ROI values** — a full picture of uncertainty.

> **For fast testing:** 2 chains, 100 adapt, 100 burnin, 200 keep (~10 min on CPU)
> **For production:** 10 chains, 1000 adapt, 500 burnin, 1000 keep (needs GPU, ~25 min)

The GPU acceleration (CUDA) is why Meridian runs 10–50× faster on a T4/V100 than on CPU.

---

## Chapter 9 — Health Review: Before You Trust Any Number

After fitting, you don't immediately jump to ROI. You first ask: **did the model converge correctly?**

Meridian's `ModelReviewer` runs 9 diagnostic checks automatically:

| Check | What It Catches |
|---|---|
| **R-hat (Gelman-Rubin)** | Did all chains converge to the same answer? R-hat < 1.05 = ✓ |
| **Bayesian p-value** | Does the model's simulated data look like real data? |
| **R² / MAPE / wMAPE** | Does the model fit the actual observed KPI well? |
| **Negative baseline probability** | Is the baseline KPI (without any marketing) sensibly positive? |
| **Prior-to-posterior shift** | Did any parameter ignore the data entirely? |
| **Implausible ROI** | Is any channel showing ROI > 100× (a red flag for model error)? |
| **High variance ROI** | Is uncertainty too wide to be useful? |
| **Control correlation bias** | Are your control variables masking true media effects? |
| **ROI consistency** | Are ROI results consistent across geo subsets? |

It outputs a **Health Score (0–100)** and a PASS / REVIEW / FAIL status per check — and generates a standalone `model_health_card.html`.

```python
reviewer = ModelReviewer(mmm)
summary = reviewer.run()
print(summary.health_score)        # e.g. 94.5
summary.output_model_health_card("health.html")
```

---

## Chapter 10 — ROI, mROI, and CPIK (The Numbers That Matter)

Now the business answers. From `demo/ROI_mROI_Response_Curves.ipynb`:

**ROI** (Return on Investment):
> "For every ₹1 spent on Search, we got ₹3.2 back in revenue."

**mROI** (Marginal ROI):
> "If we spend ₹1 more on Search right now, we get ₹1.8 back."
> (Lower than ROI because you're already past the steepest part of the response curve.)

**CPIK** (Cost per Incremental KPI):
> "It costs ₹480 to generate one additional conversion from Social."

**Credible Intervals** (Bayesian uncertainty):
> "We are 90% confident Search ROI is between 2.1× and 4.5×."

```python
ana = Analyzer(mmm)
roi   = ana.roi()          # posterior distribution per channel
mroi  = ana.marginal_roi() # marginal return at current spend level
cpik  = ana.cpik()         # cost per incremental KPI
```

This is **not a point estimate** — it is a full distribution. You can ask: *"What is the probability that Search ROI > 1?"* (i.e. is Search profitable at all?)

---

## Chapter 11 — Reach & Frequency: YouTube Is Different From Search

Demo: `Meridian_RF_Demo.ipynb`

Search works on impressions (did someone see your ad?). YouTube works differently — it has:
- **Reach**: how many unique people saw the ad at least once
- **Frequency**: how many times each person saw it on average

The relationship between frequency and outcome is non-linear:
- 1 view → some effect
- 3 views → peak effect (the "optimal frequency")
- 10 views → diminishing returns, possible annoyance

Meridian handles RF channels separately with dedicated math and finds the **optimal frequency** for your brand automatically.

```python
rf_data = builder.with_reach(df, ["yt_reach"]).with_frequency(df, ["yt_freq"])
# After fitting:
chart = ReachAndFrequency(mmm).plot_optimal_frequency()
```

---

## Chapter 12 — Full-Funnel Modeling: Brand → Awareness → Sales

Demo: `Meridian_Full_Funnel.ipynb`

Some channels (like YouTube awareness video) don't directly drive sales. They build **brand equity** (measured by branded Google search volume, brand recall scores, etc.) which then drives sales later.

Meridian supports a **two-stage model**:

```
Stage 1:  AwarenessVideo + Display  →  Branded Google Query Volume (bGQV)
Stage 2:  bGQV + PerformanceAds     →  Conversions / Revenue
```

This correctly attributes the full value of brand advertising — including the indirect path through brand equity — something a single-stage model completely misses.

```python
# Stage 1: Brand model
mmm_brand = Meridian(input_data=brand_data, model_spec=brand_spec)
mmm_brand.sample_posterior(...)

# Stage 2: Sales model (uses brand output as input control)
mmm_sales = Meridian(input_data=sales_data, model_spec=sales_spec)
mmm_sales.sample_posterior(...)

# Full-funnel combined attribution
full_funnel_analyzer = AnalyzerFullFunnel(mmm_brand, mmm_sales)
full_roi = full_funnel_analyzer.roi()   # includes indirect brand effect
```

---

## Chapter 13 — Budget Optimizer: "Where Should We Spend Next Quarter?"

Demo: `Meridian_Scenario_Planner_Beta.ipynb`, skill: `meridian_budget_optimization`

After you know the ROI and response curves of each channel, the next question is:

> *"If we have ₹50 crore next quarter, how should we split it?"*

Meridian's `BudgetOptimizer` solves this mathematically:

```python
opt = BudgetOptimizer(mmm)

# Mode 1: Fixed budget — reallocate same total spend to maximise KPI
result = opt.optimize(
    fixed_budget=True,
    budget=50_000_000,            # ₹5 crore total
    spend_constraint_lower=0.5,  # no channel gets less than 50% of its current spend
    spend_constraint_upper=1.5,  # no channel gets more than 150%
)

# Mode 2: Flexible budget — find minimum spend to hit ROI target
result = opt.optimize(
    fixed_budget=False,
    target_roi=3.0,   # What budget do we need to achieve 3× overall ROI?
)

# Mode 3: RF frequency optimisation (find optimal YouTube frequency)
result = opt.optimize(use_optimal_frequency=True, max_frequency=4.0)

print(result.optimal_spend)   # Channel-by-channel allocation
result.output_optimization_summary("optimization.html")
```

The optimiser respects your business constraints — you can't move 100% of budget to one channel overnight. The bounds simulate real-world feasibility.

---

## Chapter 14 — Scenario Planner & Looker Studio Dashboard

After optimisation, your analysts and CMO need an interactive tool — not a Python notebook.

Meridian exports to **Google Sheets → Looker Studio** via its Scenario Planner:

```python
# Generate the spend grid (pre-compute many budget scenarios)
grid = opt.create_optimization_grid(
    budget=total_spend,
    spend_constraint_lower=0.5,
    spend_constraint_upper=1.5,
)

# Export to Google Sheets → powers Looker Studio dashboard
scenario_planner.export_to_sheets(grid)
```

The resulting Looker Studio dashboard lets a non-technical CMO:
- Slide a "Total Budget" bar and instantly see optimal channel allocation
- Compare current vs optimised spend side by side
- View projected KPI uplift under different scenarios

---

## Chapter 15 — MLflow + Protobuf: Enterprise Production Integration

Demo: `Meridian_MLflow_Demo.ipynb`

Meridian is not just a research tool. It has enterprise-grade integrations:

### MLflow (Experiment Tracking)
```python
import mlflow
from meridian.mlflow import autolog

autolog()   # one line — logs everything automatically

with mlflow.start_run(run_name="Q4_MMM_v3"):
    mmm.sample_prior(500)
    mmm.sample_posterior(n_chains=4, ...)
    # MLflow automatically records:
    # - All prior hyperparameters
    # - MCMC diagnostics (R-hat, ESS)
    # - R², MAPE, wMAPE
    # - ROI per channel
    # - Fitted model artifact
```

Every model run is tracked, compared, and reproducible. Your team can compare Q1 vs Q4 models side by side.

### Protocol Buffer (Versioned Schema)
```python
from meridian.schema import mmm_proto_generator

proto = mmm_proto_generator.MmmProtoGenerator(mmm).generate()
```

This exports the model to a versioned binary format (``.binpb``) that is forward-compatible across Meridian versions — unlike pickle files that can break when the library updates.

---

## The Complete Picture — What Meridian Does End to End

```
Your CSV / DataFrame
        │
        ▼
  [Chapter 3]  Validate & structure data  →  InputData
        │
        ▼
  [Chapter 4,5]  Configure Adstock + Hill curves  →  ModelSpec
        │
        ▼
  [Chapter 6,7]  Set Bayesian priors + calibrate with experiments
        │
        ▼
  [Chapter 8]  Run MCMC (NUTS) on GPU/CPU  →  Posterior distributions
        │
        ▼
  [Chapter 9]  Review convergence health  →  HTML health card
        │
        ▼
  [Chapter 10,11]  Compute ROI, mROI, CPIK, response curves
        │
        ▼
  [Chapter 12]  Optional: Full-funnel brand + performance model
        │
        ▼
  [Chapter 13]  Optimise budget allocation  →  Optimal spend per channel
        │
        ▼
  [Chapter 14]  Export to Looker Studio dashboard  →  CMO self-serve
        │
        ▼
  [Chapter 15]  Log to MLflow + export protobuf  →  Production system
```

> **The bottom line:** Meridian replaces gut feeling, vendor-biased reports, and broken cookie-based attribution with a single, privacy-safe, mathematically rigorous source of truth for how your marketing budget actually drives your business.
