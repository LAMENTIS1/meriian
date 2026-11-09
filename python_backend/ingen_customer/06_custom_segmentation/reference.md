# Custom Segmentation & Segment Comparison: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
**Custom Segmentation & Comparison** enables commercial teams to build ad-hoc cohorts using arbitrary predicate logic (`=`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not in`) and evaluate segment overlaps / differences across multiple datasets.

It delivers two components:
1. **Dynamic Predicate Filter Engine**: Converts JSON condition trees into high-performance Polars filter expressions.
2. **Segment Comparison Engine**: Performs multi-key joins and set-theoretic intersection/delta calculations between cohorts.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `file_path` | `Union[str, pl.DataFrame]` | *Required* | Path to primary data file or Polars DataFrame. |
| `segment_name` | `str` | `"Custom_Cohort"` | Label to assign to the filtered cohort. |
| `filter_groups` | `List[Dict[str, Any]]` | *Required* | List of filter groups containing predicate rules. |
| `top_level_logic` | `str` | `"AND"` | Inter-group operator (`"AND"` or `"OR"`). |
| `compare_with_file` | `Optional[Union[str, pl.DataFrame]]` | `None` | Secondary dataset to compare against (optional). |
| `primary_key` | `str` | `"customer"` | Join key in primary dataset. |
| `secondary_key` | `Optional[str]` | `None` | Join key in secondary dataset (defaults to `primary_key`). |

---

## 3. Mathematical & Predicate Formulas

### 3.1 Relational Operator Expressions
For column $X$, operator $\odot$, and operand $v$:
- Equality: $X = v \implies \text{pl.col}(X) == v$
- Inequality: $X \ne v \implies \text{pl.col}(X) \ne v$
- Inequalities: $X > v$, $X < v$, $X \ge v$, $X \le v$
- Inclusion: $X \in V \implies \text{pl.col}(X).\text{is\_in}(V)$
- Exclusion: $X \notin V \implies \sim\text{pl.col}(X).\text{is\_in}(V)$

### 3.2 Hierarchical Boolean Tree
Within each group $g \in \{1, \dots, G\}$ with operator $\diamond_g \in \{\land, \lor\}$:
$$\Phi_g(c) = \bigodot_{j=1}^{n_g} \left( c[X_j] \odot_j v_j \right)$$
Top-level evaluation:
$$\Phi_{\text{final}}(c) = \begin{cases}
\bigwedge_{g=1}^G \Phi_g(c), & \text{if top\_level\_logic} = \text{"AND"} \\
\bigvee_{g=1}^G \Phi_g(c), & \text{if top\_level\_logic} = \text{"OR"}
\end{cases}$$

### 3.3 Set Comparison Metrics
Given Cohort A ($C_A$) and Cohort B ($C_B$):
- **Intersection (Shared Accounts)**: $|C_A \cap C_B|$
- **Cohort A Unique**: $|C_A \setminus C_B|$
- **Cohort B Unique**: $|C_B \setminus C_A|$
- **Jaccard Similarity Index**:
  $$J(C_A, C_B) = \frac{|C_A \cap C_B|}{|C_A \cup C_B|}$$
