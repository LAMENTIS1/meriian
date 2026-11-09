# Trend Segmentation: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
**Trend Segmentation** tracks the temporal trajectory and velocity of customer purchasing or prescribing behavior across consecutive observation periods (e.g., quarterly or monthly). It uncovers whether an account is growing, decaying, maintaining steady baseline demand, or fluctuating erratically.

It provides two distinct modalities:
1. **Share Trend Segmentation**: Tracks a product's market share percentage over time within its class ($s_{c, t_k} \in [0, 100]$).
2. **Volume Trend Segmentation**: Tracks absolute unit or dollar volume over time with **Exponential Moving Average (EMA)** smoothing ($\alpha = 0.5$).

Both modalities assign customers to four canonical segments:
- `INCREASING TREND`
- `DECLINING TREND`
- `FLAT TREND`
- `FLUCTUATING TREND`

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame, pl.LazyFrame]` | *Required* | Raw transaction file path (`.csv`, `.parquet`, `.ipc`) or Polars DataFrame. |
| `customer_col` | `str` | `"customer"` | Column identifying unique customer / doctor IDs. |
| `product_col` | `str` | `"product"` | Column identifying the product / drug name. |
| `sales_col` | `str` | `"sales"` | Column containing sales volume, units, or revenue. |
| `date_col` | `str` | `"date"` | Transaction timestamp / date column. |
| `time_granularity` | `str` | `"quarter"` | Aggregation cadence: `"quarter"`, `"month"`, or `"year"`. |
| `trend_type` | `str` | `"share"` | `"share"` (market share trend within class) or `"volume"` (EMA-smoothed unit/dollar trend). |
| `class_col` | `Optional[str]` | `None` | Product category/class column (mandatory for `trend_type="share"`). |
| `selected_product` | `Optional[str]` | `None` | Specific product to evaluate. If `None`, processes the top product or first found. |
| `start_date` | `Optional[str]` | `None` | Lower bound date filter (e.g. `'2023-01-01'`). |
| `end_date` | `Optional[str]` | `None` | Upper bound date filter (e.g. `'2023-12-31'`). |

---

## 3. Mathematical & Algorithmic Formulations

Let $T = \{t_1, t_2, \dots, t_K\}$ ($K \ge 2$) be the sorted sequence of consecutive time periods.

### 3.1 Modality 1: Share Trend Segmentation Formulas
For customer $c$, product $p$, and time period $t_k$:
$$s_{c, t_k} = \left( \frac{\text{Sales}_{c, p, t_k}}{\sum_{j=1}^N \text{Sales}_{c, p_j, t_k}} \right) \times 100$$
$$\mathbf{s}_c = [s_{c, t_1}, s_{c, t_2}, \dots, s_{c, t_K}]$$

1. **Customer Temporal Mean Share**:
   $$\mu_c = \frac{1}{K} \sum_{k=1}^K s_{c, t_k}$$

2. **Flat Trend (Stability Criterion)**:
   Every observed share falls within a $\pm 5\%$ band around the customer's mean:
   $$\text{is\_flat}_c = \bigwedge_{k=1}^K \left( \mu_c - 5 \le s_{c, t_k} < \mu_c + 5 \right) \implies \text{"FLAT TREND"}$$

3. **Increasing Trend (Monotonic Growth)**:
   $$\text{diff}_k = s_{c, t_{k+1}} - s_{c, t_k}$$
   $$\left( \forall k, \, \text{diff}_k > 0 \right) \land \left( \sum_{k=1}^K \mathbb{I}(s_{c, t_k} = 0) < 2 \right) \land \left( |\text{unique}(\mathbf{s}_c)| = K \right) \implies \text{"INCREASING TREND"}$$

4. **Declining Trend (Monotonic Decay)**:
   $$\left( \forall k, \, \text{diff}_k < 0 \right) \land \left( \sum_{k=1}^K \mathbb{I}(s_{c, t_k} = 0) < 2 \right) \land \left( |\text{unique}(\mathbf{s}_c)| = K \right) \implies \text{"DECLINING TREND"}$$

5. **Fluctuating Trend (Erratic / Seasonal)**:
   $$\text{Fallback} \implies \text{"FLUCTUATING TREND"}$$

---

### 3.2 Modality 2: Volume Trend Segmentation Formulas
Let $\mathbf{v}_c = [v_{c, t_1}, \dots, v_{c, t_K}]$ be the raw volume series.

1. **Exponential Smoothing ($\alpha = 0.5$)**:
   $$\tilde{v}_{c, t_1} = v_{c, t_1}$$
   $$\tilde{v}_{c, t_k} = 0.5 \cdot v_{c, t_k} + 0.5 \cdot \tilde{v}_{c, t_{k-1}}, \quad k = 2, \dots, K$$

2. **Tolerance Bounds**:
   $$S_c = \sum_{k=1}^K \tilde{v}_{c, t_k}, \qquad \bar{v}_c = \lfloor S_c / K \rfloor$$
   $$\text{Lower Bound}_c = \bar{v}_c - 0.05 \cdot S_c, \qquad \text{Upper Bound}_c = \bar{v}_c + 0.05 \cdot S_c$$

3. **Volume Trend Classification**:
   - **Flat**: $\bigwedge_{k=1}^K \left( \text{Lower Bound}_c \le \tilde{v}_{c, t_k} < \text{Upper Bound}_c \right) \implies \text{"FLAT TREND"}$
   - **Increasing**: $\tilde{\mathbf{v}}_c = \text{sort\_asc}(\tilde{\mathbf{v}}_c) \land |\text{unique}(\tilde{\mathbf{v}}_c)| > 1 \land |\text{unique}(\tilde{\mathbf{v}}_c)| \ge \lfloor K/2 \rfloor \implies \text{"INCREASING TREND"}$
   - **Declining**: $\tilde{\mathbf{v}}_c = \text{sort\_desc}(\tilde{\mathbf{v}}_c) \land |\text{unique}(\tilde{\mathbf{v}}_c)| > 1 \land |\text{unique}(\tilde{\mathbf{v}}_c)| \ge \lfloor K/2 \rfloor \implies \text{"DECLINING TREND"}$
   - **Fluctuating**: Fallback for non-monotonic patterns.

---

### 3.3 Output Summary Table KPIs
- **Customer Count**: Total accounts per segment.
- **Period Mean Metric**: Average volume/share for period $t_k$:
  $$\overline{\text{Metric}}_{s, t_k} = \frac{1}{|S_s|} \sum_{c \in S_s} m_{c, t_k}$$
