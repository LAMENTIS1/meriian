# Marketing Mix Modeling (MMM) & Budget Optimization Engine: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
The **Marketing Mix Modeling (MMM) & Budget Optimization Engine** quantifies media channel saturation, decay dynamics (adstock carryover), and executes constrained econometric budget allocations across marketing channels.

It supports two primary capabilities:
1. **Geometric Recursive Adstock Modeling**: Optimizes carryover retention decay $\beta \in [0.1, 0.9]$ per channel.
2. **Constrained Budget Optimization**:
   - `MaxProfit`: Independent marginal search where $\text{MROI} \to 1.0$.
   - `Optimal_Budget_Reallocation`: Multi-channel greedy incremental optimization honoring Hold-Constant channels, mandatory minimum spends, maximum spend caps, and efficiency thresholds ($\text{MROI} \ge \tau_m$, $\text{ROI} \ge \tau_r$).

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame]` | *Required* | Marketing mix dataset path or Polars DataFrame. |
| `date_col` | `str` | `"date"` | Time series date/period column. |
| `sales_col` | `str` | `"sales"` | Target outcome metric (sales revenue or volume). |
| `media_channels` | `List[str]` | *Required* | List of media spend / activity columns. |
| `optimization_mode` | `str` | `"Optimal_Budget_Reallocation"` | `"Optimal_Budget_Reallocation"` or `"MaxProfit"`. |
| `total_budget` | `Optional[float]` | `None` | Total budget to reallocate. If `None`, uses sum of historical channel spends. |
| `hold_constant_channels`| `Optional[List[str]]` | `None` | Channels whose spend is locked at 100% of base spend. |
| `channel_min_budgets` | `Optional[Dict[str, float]]` | `None` | Mandatory minimum budget floor per channel. |
| `channel_max_budgets` | `Optional[Dict[str, float]]` | `None` | Maximum allowable budget ceiling per channel. |
| `min_mroi` | `float` | `1.0` | Universal marginal ROI efficiency floor ($\tau_m$). |
| `min_roi` | `float` | `1.0` | Universal cumulative ROI efficiency floor ($\tau_r$). |
| `unit_price` | `float` | `1.0` | Monetary value per unit of sales. |

---

## 3. Mathematical & Algorithmic Formulations

### 3.1 Geometric Recursive Adstock
For channel $m$ and date $t \in \{1, \dots, T\}$ with decay factor $\beta \in [0.1, 0.9]$:
$$x_{m, t}^{(\beta)} = v_{m, t} + \beta \cdot x_{m, t-1}^{(\beta)}, \quad x_{m, 0}^{(\beta)} = 0$$
Parameter $\beta_m^*$ is chosen via grid-search maximizing $R^2$ with sales:
$$\beta_m^* = \arg\max_{\beta \in \{0.1, \dots, 0.9\}} R^2\left(\hat{y}_t = \alpha + \gamma x_{m, t}^{(\beta)}\right)$$

### 3.2 Discrete S-Curve Response Generation
Each channel's spend is scaled in 200 discrete integer percentage steps:
$$s_{m, k} = k \times 0.01 \times \text{BaseSpend}_m, \quad k \in \{1, \dots, 200\}$$
Incremental changes:
$$\Delta s_{m, k} = s_{m, k} - s_{m, k-1}, \qquad \Delta \text{Sales}_{m, k} = \text{Sales}_{m, k} - \text{Sales}_{m, k-1}$$
$$\text{ROI}_{m, k} = \frac{\text{Sales}_{m, k} \times \text{unit\_price}}{s_{m, k}}, \qquad \text{MROI}_{m, k} = \frac{\Delta \text{Sales}_{m, k} \times \text{unit\_price}}{\Delta s_{m, k}}$$

### 3.3 Optimization Algorithm 1: MaxProfit
For each active unconstrained channel:
$$k^* = \arg\min_{k \text{ with MROI} \ge 1.0} |\text{MROI}_{m, k} - 1.0|$$
Cumulative sales and ROI are evaluated at point $k^*$. If total spend exceeds budget $B$, channels are prioritized by descending MROI.

### 3.4 Optimization Algorithm 2: Optimal_Budget_Reallocation (Greedy Multi-Channel)
1. **Available Budget**:
   $$B_{\text{opt}} = B_{\text{total}} - \sum_{h \in \text{HoldConstant}} \text{BaseSpend}_h$$
2. **Sequential Validity Filter**:
   Step $k$ is valid if:
   $$\text{MROI}_{m, k} \ge \tau_m \land \text{ROI}_{m, k} \ge \tau_r \land s_{m, k} \le \text{MaxBudget}_m$$
   *Sequential Cutoff Rule*: If step $k$ fails any condition, all subsequent steps $k' > k$ are disqualified.
3. **Mandatory Min Spends**:
   Allocate minimum mandatory budget increments first: $s_{m, k_{\text{min}}}$.
4. **Greedy Residual Allocation**:
   Sort all eligible increments across channels in strictly **descending order of MROI**:
   $$\text{MROI}_{(1)} \ge \text{MROI}_{(2)} \ge \dots \ge \text{MROI}_{(P)}$$
   Allocate increments until cumulative allocated budget reaches $B_{\text{opt}}$.
