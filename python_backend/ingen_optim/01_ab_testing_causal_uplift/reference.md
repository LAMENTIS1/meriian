# A/B Testing & Causal Uplift Engine: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
The **A/B Testing & Causal Uplift Engine** conducts rigorous causal inference on commercial test-vs-control experiments (marketing campaigns, sales rep incentives, pricing promotions). It matches control subjects, runs an adaptive hypothesis-testing decision tree, computes **Double-Difference (Difference-in-Differences / DiD)** impact crosstabs, applies covariate-adjusted ANCOVA modeling, and derives financial campaign ROI.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame]` | *Required* | Transaction dataset path (`.csv`, `.parquet`, `.ipc`) or Polars DataFrame. |
| `customer_col` | `str` | `"customer"` | Account identifier column. |
| `sales_col` | `str` | `"sales"` | Outcome performance metric (revenue, volume, units). |
| `group_col` | `str` | `"group"` | Test vs Control flag column (`"test"` or `"control"`). |
| `period_col` | `str` | `"period"` | Pre vs Post period flag column (`"pre"` or `"post"`). |
| `covariate_cols` | `Optional[List[str]]` | `None` | Confounding promotion or regional variables for ANCOVA adjustment. |
| `sales_unit_multiplier` | `float` | `1.0` | Value per sales unit (e.g. price per unit). |
| `program_cost` | `float` | `0.0` | Campaign intervention / marketing program cost. |

---

## 3. Mathematical & Algorithmic Formulations

### 3.1 Control Matching (Euclidean Distance Metric)
For each test record $t$ and control candidate $c$ matching on exact categorical attributes:
$$d(t, c) = \sqrt{\sum_{j=1}^M (u_{c, j} - x_{t, j})^2}$$
The closest candidate $c^* = \arg\min_c d(t, c)$ is paired.

### 3.2 Adaptive Hypothesis Testing Decision Tree
Given post-period sample sizes $N_T$ and $N_C$:

1. **Large Sample ($N_T > 30$ and $N_C > 30$)**:
   Two-Sample Z-Test:
   $$Z = \frac{\bar{X}_T - \bar{X}_C}{\sqrt{\frac{s_T^2}{N_T} + \frac{s_C^2}{N_C}}}, \qquad p = 2 \cdot (1 - \Phi(|Z|))$$

2. **Small Sample ($N_T \le 30$ or $N_C \le 30$)**:
   - Check Normality via **Shapiro-Wilk** ($p_{\text{shapiro}} > 0.05$):
     - If both normal and homoscedastic ($0.5 \le \frac{s_T}{s_C} \le 2.0$): One-way ANOVA / Student's t-test.
     - If both normal and heteroscedastic: Welch's t-test (`equal_var=False`).
     - If non-normal: **Mann-Whitney U Test** (`alternative='two-sided'`).

3. **Production Hypothesis Labeling Rule**:
   - If $p \le 0.05$: `"Change of {sales_column} in Test and control group is statisticaly significant."`
   - If $p > 0.05$: `"Change of {sales_column} in Test and control group is due to random chance."`

### 3.3 Double-Difference (Difference-in-Differences / DiD) Crosstab
$$\bar{X}_{g, p} = \frac{1}{|I_{g, p}|} \sum_{i \in I_{g, p}} x_i, \quad g \in \{\text{test}, \text{control}\}, \quad p \in \{\text{pre}, \text{post}\}$$
$$\Delta_{\text{pre}} = \text{round}(\bar{X}_{\text{test}, \text{pre}} - \bar{X}_{\text{control}, \text{pre}}, 3)$$
$$\Delta_{\text{post}} = \text{round}(\bar{X}_{\text{test}, \text{post}} - \bar{X}_{\text{control}, \text{post}}, 3)$$
$$\text{Total Impact} = \text{round}(\Delta_{\text{post}} - \Delta_{\text{pre}}, 3)$$

### 3.4 ANCOVA Covariate Adjustment (Optional)
$$\text{sales}_i = \beta_0 + \beta_{\text{group}} \cdot \mathbb{I}(\text{group}_i = \text{"test"}) + \sum_{j=1}^k \beta_j Z_{j, i} + \epsilon_i$$
Adjusted group means evaluate each cohort at the mean of covariates:
$$\bar{Y}^*_{\text{control}} = \hat{\beta}_0 + \sum_{j=1}^k \hat{\beta}_j \bar{Z}_j$$
$$\bar{Y}^*_{\text{test}} = \hat{\beta}_0 + \hat{\beta}_{\text{group}} + \sum_{j=1}^k \hat{\beta}_j \bar{Z}_j$$

### 3.5 Financial ROI Formula
$$\text{Incremental Revenue} = \text{Total Impact} \times N_{\text{test}} \times \text{sales\_unit}$$
$$\text{ROI} = \text{round}\left( \frac{\text{Incremental Revenue} - \text{program\_cost}}{\text{program\_cost}}, 6 \right)$$
