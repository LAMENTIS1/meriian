# Combined Segmentation & Crosstab: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
**Combined Segmentation** constructs a dynamic 2D Cartesian intersection (cross-tabulation) between two independent segmentation runs (e.g. `Horizontal: Quartile Tier` $\times$ `Vertical: Trend Trajectory`).
It produces compound segments such as:
- `QUARTILE 4 - DECLINING TREND` (High revenue risk)
- `QUARTILE 1 - INCREASING TREND` (High growth opportunity)

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `horizontal_data` | `Union[str, pl.DataFrame]` | *Required* | File path or Polars DataFrame containing horizontal customer segment assignments. |
| `vertical_data` | `Union[str, pl.DataFrame]` | *Required* | File path or Polars DataFrame containing vertical customer segment assignments. |
| `customer_col` | `str` | `"customer"` | Column identifying the unique customer across both datasets. |
| `h_segment_col` | `str` | `"Segment"` | Column name of segment labels in horizontal dataset. |
| `v_segment_col` | `str` | `"Segment"` | Column name of segment labels in vertical dataset. |
| `h_name` | `str` | `"Horizontal"` | Dimension title for horizontal segmentation. |
| `v_name` | `str` | `"Vertical"` | Dimension title for vertical segmentation. |
| `fill_unmatched` | `bool` | `True` | Whether to preserve unmatched customers under `"Remaining Group"`. |

---

## 3. Mathematical & Cross-Tabulation Formulas

### 3.1 Cartesian Intersection Matrix
Let horizontal segment set be $\mathcal{S}_H = \{h_1, \dots, h_R\}$ and vertical segment set be $\mathcal{S}_V = \{v_1, \dots, v_C\}$.
For each customer $c \in C$, with assigned labels $\sigma_H(c)$ and $\sigma_V(c)$:

1. **Intersection Contingency Cell Count**:
   $$N_{ij} = \sum_{c \in C} \mathbb{I}\left( \sigma_H(c) = h_i \land \sigma_V(c) = v_j \right)$$

2. **Compound Segment Name Formulation**:
   $$\text{Compound Name}(h_i, v_j) = h_i + \text{" - "} + v_j$$

3. **Marginal Totals & Proportions**:
   - Total Customers: $M = \sum_{i, j} N_{ij}$
   - Cell Prevalence: $P_{ij} = \left( \frac{N_{ij}}{M} \right) \times 100$
   - Horizontal Margin: $N_{i\cdot} = \sum_{j} N_{ij}$
   - Vertical Margin: $N_{\cdot j} = \sum_{i} N_{ij}$

4. **Residual Group Handling**:
   - Customer present in Horizontal but missing in Vertical $\implies \sigma_V(c) = \text{"Remaining Vertical Group"}$.
   - Customer present in Vertical but missing in Horizontal $\implies \sigma_H(c) = \text{"Remaining Horizontal Group"}$.
