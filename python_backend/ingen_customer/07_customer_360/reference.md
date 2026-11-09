# Customer 360 Segmentation: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
**Customer 360 Segmentation** is an enterprise unification engine that consolidates disparate analytical segmentations (Dominant, Trend, Decile, Quartile, Custom Cohorts) across multiple datasets into a **Single Master Customer Intelligence Table**.

Features:
- Sequential full-outer-joins across arbitrary segmentation runs on the primary `customer` key.
- Custom column alias renaming per segmentation output.
- Column header sanitization (truncation to $\le 63$ characters and bracket replacement).
- Null-fill handling for customers not present in specific evaluation runs.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `segment_sources` | `List[Union[str, pl.DataFrame, Dict[str, Any]]]` | *Required* | List of segmentation output tables or config dicts (`{'data': path_or_df, 'alias': 'Col_Name', 'seg_col': 'Segment'}`). |
| `customer_col` | `str` | `"customer"` | Unique primary customer ID column. |
| `default_fill_value` | `Optional[str]` | `"Not Evaluated"` | Fill value for accounts absent in specific runs. |
| `sanitize_headers` | `bool` | `True` | Enforces SQL compatibility ($\le 63$ chars, replace `(` with `[`). |

---

## 3. Mathematical & Unification Formulas

### 3.1 Sequential Full Outer Join
Let $\mathcal{T} = \{T_1, T_2, \dots, T_P\}$ be $P$ segmentation label tables.
Each table contains accounts $C_k$ and assigned segment $\sigma_k(c)$:
$$T_k = \{(c, \sigma_k(c)) \mid c \in C_k\}$$

Iterative outer join:
$$M_1 = T_1$$
$$M_k = M_{k-1} \ \text{FULL OUTER JOIN}\ T_k \ \text{ON}\ c, \quad k = 2, \dots, P$$

Unified population:
$$C_{\text{unified}} = \bigcup_{k=1}^P C_k$$

### 3.2 Column Header Sanitization Formula
$$\text{col}_{\text{sanitized}} = \text{col.replace}('(', '[').\text{replace}(')', ']')[:63]$$
