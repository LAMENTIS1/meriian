# Quantile / Quartile Segmentation: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
**Quantile (Quartile) Segmentation** divides active commercial customer volume into **4 macro quadrants (25% volume tranches)**, plus a dedicated `Zero Sales Quartile Segment` for non-purchasing accounts.
- **Quartile 4 (75-100%)**: Top 25% cumulative volume (Key Accounts).
- **Quartile 3 (50-75%)**: Next 25% cumulative volume.
- **Quartile 2 (25-50%)**: Moderate 25% volume segment.
- **Quartile 1 (0-25%)**: Tail 25% volume segment.
- **Zero Sales Quartile Segment**: Zero sales volume.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame, pl.LazyFrame]` | *Required* | Raw transaction file path (`.csv`, `.parquet`, `.ipc`) or Polars DataFrame. |
| `customer_col` | `str` | `"customer"` | Column identifying unique customer / physician ID. |
| `product_col` | `str` | `"product"` | Column identifying the product / brand name. |
| `sales_col` | `str` | `"sales"` | Column containing sales volume, units, or revenue. |
| `date_col` | `Optional[str]` | `None` | Transaction timestamp / date column. |
| `start_date` | `Optional[str]` | `None` | Lower bound date filter (YYYY-MM-DD). |
| `end_date` | `Optional[str]` | `None` | Upper bound date filter (YYYY-MM-DD). |
| `time_period_mode` | `str` | `"auto"` | `"auto"` (latest year in data), `"date_range"`, or `"all"`. |
| `scope` | `str` | `"product"` | `"product"` (brand quartile) or `"class"` (category quartile). |
| `target_entity` | `Optional[str]` | `None` | Specific product name or class name to analyze. |
| `class_col` | `Optional[str]` | `None` | Column identifying class/category (required when scope='class'). |

---

## 3. Mathematical & Algorithmic Formulations

### 3.1 Population Splitting & Cumulative Calculation
Active population:
$$C_{\text{active}} = \{c \in C \mid v(c) > 0\}, \qquad C_{\text{zero}} = \{c \in C \mid v(c) = 0\}$$

For sorted active customers $v(c_{(1)}) \ge v(c_{(2)}) \ge \dots$:
$$\Pi_k = \left( \frac{\sum_{j=1}^k v(c_{(j)})}{\sum_{i=1}^{M_{\text{active}}} v(c_{(i)})} \right) \times 100$$

### 3.2 Quartile Decision Boundaries (with +0.5% offset)

| Assigned Quartile | Segment Label | Cumulative Condition ($\Pi_k$) | Commercial Significance |
| :---: | :---: | :---: | :---: |
| **4** | `Quartile 4 (75-100%)` | $\Pi_k \le 25.5\%$ | **Top Tier Mega Accounts (Top 25% volume)** |
| **3** | `Quartile 3 (50-75%)` | $25.5\% < \Pi_k \le 50.5\%$ | **High-Volume Core Accounts (25-50% cumulative)** |
| **2** | `Quartile 2 (25-50%)` | $50.5\% < \Pi_k \le 75.5\%$ | **Moderate Accounts (50-75% cumulative)** |
| **1** | `Quartile 1 (0-25%)` | $75.5\% < \Pi_k \le 100.0\%$ | **Tail Accounts (Final 25% volume)** |
| **0** | `Zero Sales Quartile Segment` | $v(c) = 0$ | **Inactive / Cold Accounts** |

---

### 3.3 Summary KPI Metrics
- **Customer Count**: $N_q = |\{c \mid \text{Quartile}(c) = q\}|$
- **Quartile Volume**: $V_q = \sum_{c \in S_q} v(c)$
- **Contribution % (`PCT <Entity>`)**: $\text{PCT}_q = \left(\frac{V_q}{\sum V}\right) \times 100$
- **Customer Average**: $\bar{V}_q = \frac{V_q}{N_q}$
