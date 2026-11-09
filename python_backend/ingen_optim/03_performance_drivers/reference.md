# Performance Drivers & Shapley Attribution Engine: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
The **Performance Drivers & Shapley Attribution Engine** identifies the underlying drivers of business KPI movements (sales, conversions, margin). It automates feature hygiene (removing multicollinear and rank-deficient predictors), ranks feature influence using Relative Weights, and calculates directional SHAP/TreeExplainer attributions to explain positive tailwinds vs negative headwinds.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame]` | *Required* | Dataset path or Polars DataFrame containing predictors and target. |
| `target_col` | `str` | `"sales"` | Dependent KPI column to explain. |
| `feature_cols` | `Optional[List[str]]` | `None` | Candidate predictor column names. If None, auto-selects numeric columns. |
| `compulsory_features` | `Optional[List[str]]` | `None` | Features protected from collinearity pruning. |
| `correlation_threshold`| `float` | `0.75` | Maximum allowable pairwise Pearson correlation before pruning. |
| `min_relative_importance` | `float` | `1.0` | Minimum normalized importance threshold percentage to retain. |

---

## 3. Mathematical & Algorithmic Formulations

### 3.1 Pairwise Multicollinearity Pruning
For independent features $X_1, \dots, X_M$ and target $Y$:
$$r_{i, j} = \frac{\sum (X_i - \bar{X}_i)(X_j - \bar{X}_j)}{\sqrt{\sum(X_i - \bar{X}_i)^2 \sum(X_j - \bar{X}_j)^2}}$$
- When $|r_{i, j}| > \text{threshold}$:
  - If neither feature is in `compulsory_features`: Drop $\arg\min (|r(X_i, Y)|, |r(X_j, Y)|)$.
  - If $X_i \in \text{compulsory}$ and $X_j \notin \text{compulsory}$: Drop $X_j$.
  - If both are compulsory and $|r_{i, j}| > 0.95$: Raises high correlation exception.

### 3.2 QR Matrix Column Pivoting for Rank Deficiency
For design matrix $\mathbf{X} \in \mathbb{R}^{N \times P}$:
$$\mathbf{X} \mathbf{P} = \mathbf{Q} \mathbf{R}$$
where permutation $\mathbf{P}$ orders diagonal $|R_{11}| \ge |R_{22}| \ge \dots \ge |R_{PP}|$.
If $\text{rank}(\mathbf{X}) = R < P$, features indexed beyond $R$ are identified as linearly dependent and pruned.

### 3.3 Feature Importance & Filtering
$$\text{normRelaImpt}_j = 100 \times \frac{\text{rawRelaImpt}_j}{\sum_k \text{rawRelaImpt}_k}$$
Retains features where $\text{normRelaImpt}_j \ge 1.0\%$.

### 3.4 Directional SHAP Attribution Formulation
For SHAP impact matrix $\Phi \in \mathbb{R}^{N \times P}$:
1. **Absolute Mean Attribution**:
   $$\overline{\Phi}_j = \frac{1}{N} \sum_{i=1}^N |\Phi_{i, j}|$$
2. **Directional Impact Coding**:
   $$\text{Direction}_j = \begin{cases}
   \text{"Positive Tailwind (Green)"}, & \text{if } \text{corr}(|\Phi_j|, X_j) \ge 0 \\
   \text{"Negative Headwind (Red)"}, & \text{if } \text{corr}(|\Phi_j|, X_j) < 0
   \end{cases}$$
3. **Relative Percentage Contribution**:
   $$\text{Percentage}_j = \text{round}\left(100 \times \frac{\overline{\Phi}_j}{\sum_k \overline{\Phi}_k}, 2\right)$$
