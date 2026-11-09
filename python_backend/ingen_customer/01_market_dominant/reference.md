# Market Dominant Segmentation Pipeline (Polars Architecture)

## 1. Overview & Execution Workflow
The Dominant Segmentation pipeline classifies customers based on which pharmaceutical product (or portfolio of products) accounts for their volume within a therapeutic class/market over a specified evaluation time period.

```
Raw File (CSV / Parquet / IPC) 
   │
   ▼ (Polars Scan / Lazy Read)
Filter Date Range [start_date, end_date] OR Select Latest Year / Evaluation Period
   │
   ▼ (Polars Aggregations)
Group by [Customer, Product] ──► Calculate Sales Volume & Product Shares (%)
   │
   ▼ (Polars Pivot)
Customer-by-Product Share Matrix [s_{c, p1}, s_{c, p2}, ..., s_{c, pN}] & Class Total
   │
   ▼ (Z-Score Outlier Detection: Polars Expressions)
|Z_{c, j}| >= 3 ──► Outliers tagged as cluster_no = 99 ("OUTLIER")
   │
   ▼ (StandardScaler + 2D PCA)
Project clean customer shares to 2 Principal Components (pc1, pc2)
   │
   ▼ (Cluster Tendency & Count Selection: K*)
Consensus between Calinski-Harabasz & Davies-Bouldin: K* = int(mean(K_CH, K_DB))
   │
   ▼ (Multi-Model Competition)
Weighted K-Means (weighted by class_total) vs. GMM ──► Evaluated via S_Dbw validity
   │
   ▼ (Commercial Rule Decision Tree)
Apply Single Dominant (>50%), Multi-Dominant (N>=5 or N in [3,4]), Spreader (equi-band), Outlier
   │
   ▼ (Polars Segment Consolidation & Metrics)
Aggregate duplicate segment names ──► Compute Customer Count, pct contribution, Avg, Share %
```

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `str` / `pl.DataFrame` / `pl.LazyFrame` | *Required* | Path to input file (`.csv`, `.parquet`, `.ipc`) or existing Polars DataFrame / LazyFrame. |
| `customer_col` | `str` | `"customer"` | Column identifying the unique customer / doctor / account. |
| `product_col` | `str` | `"product"` | Column identifying the product / drug name. |
| `sales_col` | `str` | `"sales"` | Column containing sales quantity, volume, units, or revenue. |
| `date_col` | `Optional[str]` | `None` | Column containing the transaction date or year for time-period calculations. |
| `start_date` | `Optional[str]` | `None` | Lower bound date filter (e.g., `'2023-01-01'`). |
| `end_date` | `Optional[str]` | `None` | Upper bound date filter (e.g., `'2023-12-31'`). |
| `time_period_mode` | `str` | `"auto"` | `"auto"` (selects latest year in data), `"date_range"` (filters between `start_date` and `end_date`), or `"all"`. |
| `class_col` | `Optional[str]` | `None` | Column identifying the product class, market, or category. |
| `selected_class` | `Optional[str]` | `None` | Specific class to analyze. If `None`, defaults to the first available class or overall. |

---

## 3. Mathematical & Business Formulas

### 3.1 Time-Period Selection & Aggregation
1. **Date-Range Filtering**:
   $$\mathcal{D}_{\text{filtered}} = \{r \in \mathcal{D} \mid \text{start\_date} \le \text{date}_r \le \text{end\_date}\}$$

2. **Latest Year Selection (`time_period_mode='auto'`)**:
   $$\text{Latest Year } T^* = \max_{r \in \mathcal{D}} \left( \text{Year}(\text{date}_r) \right)$$
   $$\mathcal{D}_{\text{filtered}} = \{r \in \mathcal{D} \mid \text{Year}(\text{date}_r) = T^*\}$$

3. **Customer Class Total**:
   $$\text{Class Total}_c = \sum_{j=1}^N \text{Sales}_{c, p_j, T}$$

4. **Customer Product Share Percentage**:
   $$s_{c, p_i} = \left( \frac{\text{Sales}_{c, p_i, T}}{\text{Class Total}_c} \right) \times 100 \quad \text{such that} \quad \sum_{i=1}^N s_{c, p_i} = 100$$

---

### 3.2 Outlier Detection (Polars Z-Score Expression)
For each product column $j$:
$$\mu_j = \frac{1}{M} \sum_{c=1}^M s_{c, j}, \qquad \sigma_j = \sqrt{\frac{1}{M-1} \sum_{c=1}^M (s_{c, j} - \mu_j)^2}$$
$$Z_{c, j} = \left| \frac{s_{c, j} - \mu_j}{\sigma_j} \right|$$
- **Condition**: If $\exists j \text{ such that } Z_{c, j} \ge 3$, the customer is tagged as an **`OUTLIER`** (`cluster_no = 99`).
- Clean subset: $\mathcal{C}_{\text{clean}} = \{c \mid \forall j, \; Z_{c, j} < 3\}$.

---

### 3.3 Standardization & 2D PCA Projection
- **Z-Standardization**:
  $$z_{c, j} = \frac{s_{c, j} - \bar{s}_j}{\text{std}(s_j)}$$
- **Orthogonal 2D Projection**:
  $$\mathbf{y}_c = \mathbf{W}_2^T \mathbf{z}_c = \begin{bmatrix} pc_{1, c} \\ pc_{2, c} \end{bmatrix}$$

---

### 3.4 Optimal Cluster Count ($K^*$) & Multi-Model Selection
- **Calinski-Harabasz Index**:
  $$CH(k) = \frac{\text{Tr}(\mathbf{B}_k) / (k - 1)}{\text{Tr}(\mathbf{W}_k) / (M - k)}$$
- **Davies-Bouldin Index**:
  $$DB(k) = \frac{1}{k} \sum_{i=1}^k \max_{j \neq i} \left( \frac{\bar{d}_i + \bar{d}_j}{d(c_i, c_j)} \right)$$
- **Consensus Optimal Clusters**:
  $$K^* = \text{int}\left( \text{mean}(k_{CH}^*, k_{DB}^*) \right)$$
- **Model Evaluation ($S\_Dbw$)**:
  $$S\_Dbw = \text{Scat}(K^*) + \text{Dens\_bw}(K^*)$$
  $$\text{Winning Model} = \arg\min_{m \in \{\text{kmeans}, \text{gmm}\}} S\_Dbw(m)$$

---

### 3.5 Segment Labeling Decision Boundaries
Let $N = \text{number of products in class}$, and $\text{Share}_{k, p} = \frac{\sum_{c \in S_k} \text{Sales}_{c, p}}{\sum_{c \in S_k} \text{Class Total}_c} \times 100$:

1. **Single-Product Dominant**:
   $$\text{Share}_{k, p} > 50\% \implies \text{Segment}_k = p + \text{" DOMINANT"}$$

2. **Multi-Product Dominant ($N \ge 5$)**:
   $$\text{Threshold}_{\text{multi}} = \left( \frac{100}{N} \right) \times \left\lfloor \frac{N}{\lfloor N / 2 \rfloor} \right\rfloor$$
   $$\text{Min Threshold} = 0.9 \times \text{Threshold}_{\text{multi}}$$
   Any product where $\text{Share}_{k, p} > \text{Min Threshold}$ is joined:
   $$\text{Segment}_k = p_1 \text{ } p_2 \dots + \text{ " DOMINANT"}$$

3. **Multi-Product Dominant ($N \in \{3, 4\}$)**:
   $$\text{If } (\exists! \, p \text{ with Share} \le 15\%) \text{ and } (\exists 2 \, \text{products with Share} > 35\%) \implies p_1\text{-}p_2\text{ DOMINANT}$$

4. **Spreader Segment (Portfolio Prescribers)**:
   $$\text{Spreader Min} = \left(\frac{100}{N}\right) \times 0.8, \qquad \text{Spreader Max} = \left(\frac{100}{N}\right) \times 1.2$$
   $$\forall p \in P, \quad \text{Spreader Min} \le \text{Share}_{k, p} \le \text{Spreader Max} \implies \text{Segment}_k = \text{"SPREADER"}$$
   *(Any unassigned cluster defaults to `"SPREADER"`)*.

5. **Outlier Segment**:
   $$\text{cluster\_no} = 99 \implies \text{Segment} = \text{"OUTLIER"}$$

---

### 3.6 Segment Consolidation & Summary Metrics
Clusters with identical segment names are combined:
- **Product Volume Contribution % (`pct <Product>`)**:
  $$\text{pct}_{s, p} = \left( \frac{\text{Sales}_{s, p}}{\sum_{\text{all segments}} \text{Sales}_p} \right) \times 100$$
- **Product Customer Average (`<Product> Avg`)**:
  $$\text{Avg}_{s, p} = \frac{\text{Sales}_{s, p}}{\text{Customer Count}_s}$$
