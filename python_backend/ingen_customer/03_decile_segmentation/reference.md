# Decile Segmentation: Mathematical Formulation & Polars Pipeline Architecture

## 1. Executive Summary & Business Objective
**Decile Segmentation** partitions accounts based on the **Pareto Principle (80/20 Rule)**. Top-volume accounts contributing to the first 10% of total sales volume are placed in **DECILE 10**, followed by Decile 9 (next 10%), through Decile 1 (final 10%), with accounts having zero sales segregated into `Zero Sales Decile Segment`.

Supports:
- **Product-Level Deciling**: Focuses on sales of a single brand/product.
- **Class-Level Deciling**: Focuses on aggregated volume across all products in a therapeutic class/category.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame, pl.LazyFrame]` | *Required* | Raw transaction file path (`.csv`, `.parquet`, `.ipc`) or Polars DataFrame. |
| `customer_col` | `str` | `"customer"` | Column identifying the unique customer / doctor / account. |
| `product_col` | `str` | `"product"` | Column identifying the product / drug name. |
| `sales_col` | `str` | `"sales"` | Sales volume, units, or revenue column. |
| `date_col` | `Optional[str]` | `None` | Transaction date column for time-period evaluation. |
| `start_date` | `Optional[str]` | `None` | Start date string (`YYYY-MM-DD`). |
| `end_date` | `Optional[str]` | `None` | End date string (`YYYY-MM-DD`). |
| `time_period_mode` | `str` | `"auto"` | `"auto"` (evaluates latest year in data), `"date_range"`, or `"all"`. |
| `scope` | `str` | `"product"` | `"product"` (deciling for specific brand) or `"class"` (deciling across category). |
| `target_entity` | `Optional[str]` | `None` | Specific product name (if scope='product') or class name (if scope='class'). |
| `class_col` | `Optional[str]` | `None` | Column identifying product category/class (required if scope='class'). |

---

## 3. Mathematical Formulation & Deciling Boundaries

### 3.1 Population Splitting
For all customers $c \in C$:
$$C_{\text{active}} = \{c \in C \mid v(c) > 0\}, \qquad C_{\text{zero}} = \{c \in C \mid v(c) = 0\}$$
All $c \in C_{\text{zero}}$ are assigned to:
$$\text{Segment}(c) = \text{"Zero Sales Decile Segment"}$$

### 3.2 Running Cumulative Volume & Percentage
Sort $C_{\text{active}}$ in descending order:
$$v(c_{(1)}) \ge v(c_{(2)}) \ge \dots \ge v(c_{(M_{\text{active}})})$$
$$V_{\text{total}} = \sum_{i=1}^{M_{\text{active}}} v(c_{(i)})$$
Running cumulative percentage for rank $k$:
$$R_k = \sum_{j=1}^k v(c_{(j)}), \qquad \Pi_k = \left( \frac{R_k}{V_{\text{total}}} \right) \times 100$$

### 3.3 Decile Tier Decision Rules (with +0.5% precision tolerance)

| Tier | Output Segment Label | Cumulative Condition | Commercial Interpretation |
| :---: | :---: | :---: | :---: |
| **10** | `Decile 10 (90-100%)` | $\Pi_k \le 10.5\%$ | **Key Opinion Leaders (Top 10% volume)** |
| **9** | `Decile 9 (80-90%)` | $10.5\% < \Pi_k \le 20.5\%$ | **Tier 1 High-Volume Prescribers** |
| **8** | `Decile 8 (70-80%)` | $20.5\% < \Pi_k \le 30.5\%$ | **Tier 2 Established Prescribers** |
| **7** | `Decile 7 (60-70%)` | $30.5\% < \Pi_k \le 40.5\%$ | **Core Volume Accounts** |
| **6** | `Decile 6 (50-60%)` | $40.5\% < \Pi_k \le 50.5\%$ | **Mid-Tier Accounts** |
| **5** | `Decile 5 (40-50%)` | $50.5\% < \Pi_k \le 60.5\%$ | **Moderate Accounts** |
| **4** | `Decile 4 (30-40%)` | $60.5\% < \Pi_k \le 70.5\%$ | **Developing Accounts** |
| **3** | `Decile 3 (20-30%)` | $70.5\% < \Pi_k \le 80.5\%$ | **Low-Volume Accounts** |
| **2** | `Decile 2 (10-20%)` | $80.5\% < \Pi_k \le 90.5\%$ | **Occasional Prescribers** |
| **1** | `Decile 1 (0-10%)` | $90.5\% < \Pi_k \le 100.0\%$ | **Tail Prescribers (Final 10% volume)** |
| **0** | `Zero Sales Decile Segment` | $v(c) = 0$ | **Cold Accounts / Non-Prescribers** |

---

### 3.4 Summary Table KPI Metrics
For each segment $d \in \{0, 1, \dots, 10\}$:
- **Customer Count**: $N_d = |\{c \mid \text{Decile}(c) = d\}|$
- **Segment Sales Total**: $V_d = \sum_{c \in S_d} v(c)$
- **Percentage of Total Sales (`PCT <Entity>`)**:
  $$\text{PCT}_d = \left( \frac{V_d}{\sum V} \right) \times 100$$
- **Average Sales per Customer**:
  $$\bar{V}_d = \frac{V_d}{N_d}$$
