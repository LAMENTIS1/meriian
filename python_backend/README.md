# Spark AI Platform: Master Architecture & Function Reference Guide

This comprehensive reference manual documents every module, function, mathematical equation, parameter contract, and return structure implemented within `spark_ai/ingen_customer` and `spark_ai/ingen_optim`.

---

# SECTION 1: INGEN CUSTOMER SUITE (`spark_ai/ingen_customer`)

The **Ingen Customer** suite delivers 8 discrete customer segmentation, profiling, and targeting engines built with Polars.

---

## 1. Market Dominant Segmentation (`01_market_dominant`)

### Primary File:
- [`spark_ai/ingen_customer/01_market_dominant/dominant_segmentation_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/01_market_dominant/dominant_segmentation_polars.py)
- Reference: [`01_market_dominant/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/01_market_dominant/reference.md)

### Function: `run_dominant_segmentation_polars`
```python
def run_dominant_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame],
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto",
    class_col: Optional[str] = None,
    selected_class: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, int, str, List[str]]]
```

#### Detailed Description:
Classifies customer purchasing behavior within a category into brand preference segments: Single-Product Dominant (`<Product> DOMINANT`), Multi-Product Dominant (`<P1>-<P2> DOMINANT`), Spreader (`SPREADER`), or Outlier (`OUTLIER`). It uses 2D PCA, automated cluster tendency optimization, Weighted K-Means vs Gaussian Mixture Models (evaluated via $S\_Dbw$), followed by domain business rules.

#### Parameter Specifications:
- `file_path`: Path to transaction file (`.csv`, `.parquet`, `.ipc`) or Polars DataFrame / LazyFrame.
- `customer_col`: Unique customer ID column name (default `"customer"`).
- `product_col`: Product name column name (default `"product"`).
- `sales_col`: Sales volume, units, or revenue column name (default `"sales"`).
- `date_col`: Transaction timestamp/date column for period filtering (optional).
- `start_date`: Start date filter `YYYY-MM-DD` when `time_period_mode='date_range'`.
- `end_date`: End date filter `YYYY-MM-DD` when `time_period_mode='date_range'`.
- `time_period_mode`:
  - `"auto"`: Evaluates the latest year present in the dataset ($\max \text{Year}(\text{Date})$).
  - `"date_range"`: Restricts records to `[start_date, end_date]`.
  - `"all"`: Utilizes the complete dataset history.
- `class_col`: Product class / category column (optional).
- `selected_class`: Specific category to evaluate. If `None`, defaults to the first available category.

#### Mathematical Formulation & Logic:
1. **Customer Product Share %**:
   $$s_{c, p_i} = \left( \frac{\text{Sales}_{c, p_i}}{\sum_{j=1}^N \text{Sales}_{c, p_j}} \right) \times 100$$
2. **Outlier Detection**: Accounts with $|Z_{c, j}| = \left|\frac{s_{c, j} - \mu_j}{\sigma_j}\right| \ge 3$ are tagged as `cluster_no = 99` (`OUTLIER`).
3. **Cluster Count ($K^*$)**:
   $$K^* = \text{int}\left( \text{mean}(k_{CH}^*, k_{DB}^*) \right)$$
   using Calinski-Harabasz and Davies-Bouldin consensus.
4. **Model Selection**:
   $$\arg\min_{m \in \{\text{KMeans}, \text{GMM}\}} S\_Dbw(m)$$
5. **Decision Boundaries**:
   - Single Dominance: $\text{Share}_{k, p} > 50\%$.
   - Multi-Product ($N \ge 5$): $\text{Share}_{k, p} > 0.9 \times \left(\frac{100}{N}\right) \times \left\lfloor \frac{N}{\lfloor N / 2 \rfloor} \right\rfloor$.
   - Multi-Product ($N \in \{3, 4\}$): 1 product $\le 15\%$ and 2 products $> 35\%$.
   - Spreader: All products in $[0.8 \times \frac{100}{N}, \; 1.2 \times \frac{100}{N}]$.

#### Return Dictionary Structure:
- `summary_table`: `pl.DataFrame` containing `Segment`, `Customer count`, `pct <Product>`, `<Product> Avg`, `<Product> share`.
- `customer_labels`: `pl.DataFrame` containing `customer`, assigned `Segment`, and product shares.
- `optimal_clusters`: `int` optimal cluster count selected.
- `best_algorithm`: `str` (`"kmeans"` or `"gmm"`).
- `products`: `List[str]` of analyzed products.
- `time_period_used`: `str` applied period label.

---

## 2. Trend Segmentation (`02_trend_segmentation`)

### Primary File:
- [`spark_ai/ingen_customer/02_trend_segmentation/trend_segmentation_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/02_trend_segmentation/trend_segmentation_polars.py)
- Reference: [`02_trend_segmentation/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/02_trend_segmentation/reference.md)

### Function: `run_trend_segmentation_polars`
```python
def run_trend_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame],
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: str = "date",
    time_granularity: str = "quarter",
    trend_type: str = "share",
    class_col: Optional[str] = None,
    selected_product: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, str, List[str]]]
```

#### Detailed Description:
Evaluates temporal trajectory across consecutive periods ($K \ge 2$), classifying accounts into: `INCREASING TREND`, `DECLINING TREND`, `FLAT TREND`, or `FLUCTUATING TREND`. Supports **Share Trend** (proportional category adoption) and **Volume Trend** (absolute demand smoothed via Exponential Moving Average with $\alpha = 0.5$).

#### Parameter Specifications:
- `file_path`: Transaction dataset path or Polars DataFrame.
- `customer_col`: Unique account ID column (default `"customer"`).
- `product_col`: Product name column (default `"product"`).
- `sales_col`: Sales/revenue volume column (default `"sales"`).
- `date_col`: Date column (default `"date"`).
- `time_granularity`: Aggregation level: `"quarter"`, `"month"`, or `"year"`.
- `trend_type`: `"share"` (market share trend) or `"volume"` (EMA volume trend).
- `class_col`: Therapeutic class/category column (required if `trend_type="share"`).
- `selected_product`: Specific product to evaluate (defaults to highest-volume product).
- `start_date`, `end_date`: Date range bounds (`YYYY-MM-DD`).

#### Mathematical Formulation & Logic:
- **Share Trend (Strict Monotonicity & Variance Band)**:
  - Flat: All periods $s_{c, t_k} \in [\mu_c - 5, \mu_c + 5]$.
  - Increasing: Diffs $\Delta s_k > 0$, zeroes count $< 2$, and unique count $= K$.
  - Declining: Diffs $\Delta s_k < 0$, zeroes count $< 2$, and unique count $= K$.
  - Fluctuating: Fallback for all other series.
- **Volume Trend (EMA $\alpha = 0.5$)**:
  $$\tilde{v}_{c, t_k} = 0.5 \cdot v_{c, t_k} + 0.5 \cdot \tilde{v}_{c, t_{k-1}}$$
  Bounds: $\text{Mean} \pm 5\%$ of sum volume.

#### Return Dictionary Structure:
- `summary_table`: `pl.DataFrame` with segment customer counts and period-by-period mean metrics.
- `customer_labels`: `pl.DataFrame` with each customer's period values and assigned `Segment`.
- `trend_type`: Evaluated modality (`"share"` or `"volume"`).
- `product`: Evaluated product.
- `periods`: Chronologically ordered list of evaluated periods.

---

## 3. Decile Segmentation (`03_decile_segmentation`)

### Primary File:
- [`spark_ai/ingen_customer/03_decile_segmentation/decile_segmentation_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/03_decile_segmentation/decile_segmentation_polars.py)
- Reference: [`03_decile_segmentation/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/03_decile_segmentation/reference.md)

### Function: `run_decile_segmentation_polars`
```python
def run_decile_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame],
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto",
    scope: str = "product",
    target_entity: Optional[str] = None,
    class_col: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, str]]
```

#### Detailed Description:
Partitions active customers into **10 cumulative volume deciles** (10% volume tranches) based on the **Pareto Principle (80/20 Rule)**, with top prescribers in Decile 10 down to Decile 1, plus a dedicated `Zero Sales Decile Segment` for non-purchasing accounts. Supports brand-level or category-level deciling.

#### Parameter Specifications:
- `file_path`: Transaction data path or Polars DataFrame.
- `customer_col`, `product_col`, `sales_col`, `date_col`: Standard column names.
- `time_period_mode`: `"auto"` (latest year), `"date_range"`, or `"all"`.
- `scope`: `"product"` (deciling for single brand) or `"class"` (deciling across category).
- `target_entity`: Target brand or category name.
- `class_col`: Class column (required when `scope='class'`).

#### Mathematical Formulation & Logic:
- Active vs Zero split: $C_{\text{active}} = \{c \mid v(c) > 0\}$, $C_{\text{zero}} = \{c \mid v(c) = 0\}$.
- Running Cumulative % on active accounts sorted descending:
  $$\Pi_k = \left( \frac{\sum_{j=1}^k v(c_{(j)})}{V_{\text{total}}} \right) \times 100$$
- Decision Rules:
  - Decile 10: $\Pi_k \le 10.5\%$
  - Decile 9: $10.5\% < \Pi_k \le 20.5\%$
  - ...
  - Decile 1: $90.5\% < \Pi_k \le 100.0\%$
  - Zero Sales: $v(c) = 0$.

#### Return Dictionary Structure:
- `summary_table`: `pl.DataFrame` containing `Segment`, `customer count`, `<entity> sales total`, `PCT <entity>`, `<entity> Avg`.
- `customer_labels`: `pl.DataFrame` customer mapping with volume and assigned decile tier.
- `target_entity`: Evaluated entity.
- `time_period_used`: Period label.

---

## 4. Quantile / Quartile Segmentation (`04_quantile_quartile`)

### Primary File:
- [`spark_ai/ingen_customer/04_quantile_quartile/quantile_quartile_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/04_quantile_quartile/quantile_quartile_polars.py)
- Reference: [`04_quantile_quartile/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/04_quantile_quartile/reference.md)

### Function: `run_quartile_segmentation_polars`
```python
def run_quartile_segmentation_polars(
    file_path: Union[str, pl.DataFrame, pl.LazyFrame],
    customer_col: str = "customer",
    product_col: str = "product",
    sales_col: str = "sales",
    date_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    time_period_mode: str = "auto",
    scope: str = "product",
    target_entity: Optional[str] = None,
    class_col: Optional[str] = None
) -> Dict[str, Union[pl.DataFrame, str]]
```

#### Detailed Description:
Divides active customer volume into **4 macro quadrants (25% volume tranches)**: Quartile 4 (top 25% key accounts), Quartile 3 (25–50%), Quartile 2 (50–75%), Quartile 1 (bottom 25%), and a dedicated `Zero Sales Quartile Segment`.

#### Parameter Specifications:
- Same parameters as Decile Segmentation (`scope='product'` or `'class'`, `time_period_mode='auto'|'date_range'|'all'`).

#### Mathematical Formulation & Logic:
- Quartile 4 (75-100%): $\Pi_k \le 25.5\%$
- Quartile 3 (50-75%): $25.5\% < \Pi_k \le 50.5\%$
- Quartile 2 (25-50%): $50.5\% < \Pi_k \le 75.5\%$
- Quartile 1 (0-25%): $75.5\% < \Pi_k \le 100.0\%$
- Zero Sales: $v(c) = 0$.

#### Return Dictionary Structure:
- `summary_table`: `pl.DataFrame` with `customer count`, sales total, `PCT`, and averages per quartile.
- `customer_labels`: `pl.DataFrame` customer mappings.

---

## 5. Combined Segmentation & Crosstab (`05_combined_crosstab`)

### Primary File:
- [`spark_ai/ingen_customer/05_combined_crosstab/combined_crosstab_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/05_combined_crosstab/combined_crosstab_polars.py)
- Reference: [`05_combined_crosstab/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/05_combined_crosstab/reference.md)

### Function: `run_combined_crosstab_polars`
```python
def run_combined_crosstab_polars(
    horizontal_data: Union[str, pl.DataFrame],
    vertical_data: Union[str, pl.DataFrame],
    customer_col: str = "customer",
    h_segment_col: str = "Segment",
    v_segment_col: str = "Segment",
    h_name: str = "Horizontal",
    v_name: str = "Vertical",
    fill_unmatched: bool = True
) -> Dict[str, Any]
```

#### Detailed Description:
Computes the 2D Cartesian intersection (contingency cross-tabulation) between two independent segmentation runs (e.g. `Quartile` $\times$ `Trend`), generating compound segment names (e.g. `QUARTILE 4 - DECLINING TREND`) and formatting nested JSON for frontend heatmap visualizations.

#### Parameter Specifications:
- `horizontal_data`, `vertical_data`: Input files or DataFrames for each dimension.
- `customer_col`: Common account ID.
- `h_segment_col`, `v_segment_col`: Segment column name in each input.
- `h_name`, `v_name`: Titles for dimensions.
- `fill_unmatched`: If `True`, fills unmapped accounts with `"Remaining Group"`.

#### Mathematical Formulation & Logic:
- Intersection Count Matrix: $N_{ij} = \sum_{c \in C} \mathbb{I}(\sigma_H(c) = h_i \land \sigma_V(c) = v_j)$.
- Compound Name: $h_i + \text{" - "} + v_j$.

#### Return Dictionary Structure:
- `crosstab_matrix`: `pl.DataFrame` 2D contingency table.
- `customer_labels`: `pl.DataFrame` customer records with `Combined_Segment`.
- `summary_table`: `pl.DataFrame` compound segment counts and % of universe.
- `crosstab_json`: Nested dictionary ready for UI heatmaps.

---

## 6. Custom Segmentation & Comparison (`06_custom_segmentation`)

### Primary File:
- [`spark_ai/ingen_customer/06_custom_segmentation/custom_segmentation_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/06_custom_segmentation/custom_segmentation_polars.py)
- Reference: [`06_custom_segmentation/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/06_custom_segmentation/reference.md)

### Function: `run_custom_segmentation_polars`
```python
def run_custom_segmentation_polars(
    file_path: Union[str, pl.DataFrame],
    segment_name: str = "Custom_Cohort",
    filter_groups: Optional[List[Dict[str, Any]]] = None,
    top_level_logic: str = "AND",
    primary_key: str = "customer",
    compare_with_file: Optional[Union[str, pl.DataFrame]] = None,
    secondary_key: Optional[str] = None
) -> Dict[str, Any]
```

#### Detailed Description:
Dynamic predicate filter engine converting nested JSON condition trees into vectorized Polars expressions (`=`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not in`, `contains`), tagging matching cohorts, and optionally performing set-theoretic comparisons (intersections, unique differentials, Jaccard similarity) against secondary cohorts.

#### Parameter Specifications:
- `file_path`: Primary dataset.
- `segment_name`: Name for the filtered cohort.
- `filter_groups`: List of dicts specifying `variables` and `group_logic`.
- `top_level_logic`: `"AND"` or `"OR"` combining groups.
- `compare_with_file`: Optional secondary dataset for set overlap analysis.

#### Return Dictionary Structure:
- `cohort_data`: `pl.DataFrame` matching cohort records.
- `customer_labels`: `pl.DataFrame` with cohort vs `Outside_Cohort` tags.
- `summary`: Counts and coverage percentage.
- `comparison`: (If requested) Overlap counts and Jaccard similarity index.

---

## 7. Customer 360 Segmentation (`07_customer_360`)

### Primary File:
- [`spark_ai/ingen_customer/07_customer_360/customer_360_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/07_customer_360/customer_360_polars.py)
- Reference: [`07_customer_360/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/07_customer_360/reference.md)

### Function: `run_customer_360_polars`
```python
def run_customer_360_polars(
    segment_sources: List[Union[str, pl.DataFrame, Dict[str, Any]]],
    customer_col: str = "customer",
    default_fill_value: Optional[str] = "Not Evaluated",
    sanitize_headers: bool = True
) -> Dict[str, Any]
```

#### Detailed Description:
Consolidates multiple independent segmentation outputs into a **Single Master Customer 360 Table** using sequential full outer joins in Polars. Automatically enforces PostgreSQL/BI-safe column sanitization ($\le 63$ characters, bracket conversions) and fills nulls for unmeasured customers.

#### Parameter Specifications:
- `segment_sources`: List of file paths, DataFrames, or config dicts `[{'data': ..., 'alias': 'Col_Name', 'seg_col': 'Segment'}]`.
- `customer_col`: Common customer ID.
- `default_fill_value`: Null-fill string (default `"Not Evaluated"`).
- `sanitize_headers`: Enforces SQL header standards ($\le 63$ chars).

#### Return Dictionary Structure:
- `customer_360_master`: `pl.DataFrame` wide unified master table.
- `total_unique_customers`: Count of distinct accounts in universe.
- `dimensions`: List of sanitized dimension headers.
- `dimension_summaries`: Value counts per dimension.

---

## 8. Lookalike Engine (`08_lookalike_engine`)

### Primary File:
- [`spark_ai/ingen_customer/08_lookalike_engine/lookalike_engine_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/08_lookalike_engine/lookalike_engine_polars.py)
- Reference: [`08_lookalike_engine/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_customer/08_lookalike_engine/reference.md)

### Function: `run_lookalike_engine_polars`
```python
def run_lookalike_engine_polars(
    train_file_path: Union[str, pl.DataFrame],
    segment_label_path: Union[str, pl.DataFrame],
    positive_class: str,
    feature_cols: Optional[List[str]] = None,
    customer_col: str = "customer",
    prospect_file_path: Optional[Union[str, pl.DataFrame]] = None,
    confidence_threshold: float = 0.80
) -> Dict[str, Any]
```

#### Detailed Description:
Two-stage supervised machine learning engine:
1. **Modeling**: Binarizes an existing segment seed (e.g. `Decile 10 (90-100%)`), removes multicollinear/zero-variance features, balances class weights, and trains models optimized for ROC-AUC.
2. **Inference**: Scores new, unsegmented prospects, predicting probability $P(y=1) \in [0, 1]$, and categorizing into `Look-Alike Target Audience` ($P \ge 0.50$) and `High-Confidence Look-Alikes` ($P \ge 0.80$).

#### Parameter Specifications:
- `train_file_path`: Customer feature matrix.
- `segment_label_path`: Customer segmentation labels.
- `positive_class`: Target segment label to replicate.
- `prospect_file_path`: Optional prospect dataset for inference scoring.
- `confidence_threshold`: High confidence cutoff (default `0.80`).

#### Return Dictionary Structure:
- `model_metrics`: Winning algorithm, validation ROC-AUC, and feature importances.
- `scored_prospects`: `pl.DataFrame` with predicted probabilities and look-alike tags.
- `inference_kpis`: Look-alike rate %, high-confidence count, total prospects.

---

# SECTION 2: INGEN OPTIM SUITE (`spark_ai/ingen_optim`)

The **Ingen Optim** suite delivers 3 advanced econometric, causal inference, and mathematical optimization engines.

---

## 9. A/B Testing & Causal Uplift Engine (`01_ab_testing_causal_uplift`)

### Primary File:
- [`spark_ai/ingen_optim/01_ab_testing_causal_uplift/ab_testing_causal_uplift_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_optim/01_ab_testing_causal_uplift/ab_testing_causal_uplift_polars.py)
- Reference: [`01_ab_testing_causal_uplift/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_optim/01_ab_testing_causal_uplift/reference.md)

### Function: `run_ab_testing_causal_uplift_polars`
```python
def run_ab_testing_causal_uplift_polars(
    file_path: Union[str, pl.DataFrame],
    customer_col: str = "customer",
    sales_col: str = "sales",
    group_col: str = "group",
    period_col: str = "period",
    covariate_cols: Optional[List[str]] = None,
    sales_unit_multiplier: float = 1.0,
    program_cost: float = 0.0
) -> Dict[str, Any]
```

#### Detailed Description:
Conducts causal inference on commercial test-vs-control experiments. Matches control subjects, runs an adaptive hypothesis-testing decision tree (Z-test, Shapiro-Wilk, Welch's t-test, Mann-Whitney U), computes a Double-Difference (Difference-in-Differences / DiD) 2x2 impact crosstab, applies optional ANCOVA covariate adjustments, and derives financial campaign ROI.

#### Parameter Specifications:
- `file_path`: Experiment dataset path or Polars DataFrame.
- `customer_col`, `sales_col`: Standard identifiers.
- `group_col`: Test vs Control indicator (`"test"` or `"control"`).
- `period_col`: Pre vs Post indicator (`"pre"` or `"post"`).
- `covariate_cols`: Confounding promotion or regional variables.
- `sales_unit_multiplier`: Monetary value per sales unit (price).
- `program_cost`: Cost of marketing intervention.

#### Mathematical Formulation & Logic:
- **DiD Total Impact**:
  $$\text{Total Impact} = (\bar{X}_{\text{test}, \text{post}} - \bar{X}_{\text{control}, \text{post}}) - (\bar{X}_{\text{test}, \text{pre}} - \bar{X}_{\text{control}, \text{pre}})$$
- **Hypothesis Testing**:
  - $N > 30$ on both: Two-sample Z-test.
  - $N \le 30$: Shapiro-Wilk test. If normal and homoscedastic $\implies$ ANOVA; if heteroscedastic $\implies$ Welch t-test; if non-normal $\implies$ Mann-Whitney U test.
- **Financial ROI**:
  $$\text{ROI} = \frac{(\text{Total Impact} \times N_{\text{test}} \times \text{sales\_unit}) - \text{program\_cost}}{\text{program\_cost}}$$

#### Return Dictionary Structure:
- `did_crosstab`: `pl.DataFrame` 2x2 DiD table with pre/post group means and differences.
- `total_impact`: Float net double-difference impact per customer.
- `hypothesis_test`: Test name, p-value, significance flag, and exact production verdict string.
- `financial_roi`: Gross incremental revenue, program cost, and ROI ratio.

---

## 10. MMM & Budget Optimization Engine (`02_mmm_budget_optimization`)

### Primary File:
- [`spark_ai/ingen_optim/02_mmm_budget_optimization/mmm_budget_optimization_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_optim/02_mmm_budget_optimization/mmm_budget_optimization_polars.py)
- Reference: [`02_mmm_budget_optimization/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_optim/02_mmm_budget_optimization/reference.md)

### Function: `run_budget_optimization_polars`
```python
def run_budget_optimization_polars(
    file_path: Union[str, pl.DataFrame],
    media_channels: List[str],
    sales_col: str = "sales",
    date_col: str = "date",
    optimization_mode: str = "Optimal_Budget_Reallocation",
    total_budget: Optional[float] = None,
    hold_constant_channels: Optional[List[str]] = None,
    channel_min_budgets: Optional[Dict[str, float]] = None,
    channel_max_budgets: Optional[Dict[str, float]] = None,
    min_mroi: float = 1.0,
    min_roi: float = 1.0,
    unit_price: float = 1.0
) -> Dict[str, Any]
```

#### Detailed Description:
Quantifies media channel decay dynamics via recursive geometric adstock optimization ($\beta \in [0.1, 0.9]$), constructs 200-step discrete diminishing-return response curves, and executes constrained mathematical budget allocation across marketing channels.

#### Parameter Specifications:
- `file_path`: Time series dataset path or Polars DataFrame.
- `media_channels`: List of media spend column names.
- `sales_col`: Target sales revenue / volume column.
- `date_col`: Chronological period column.
- `optimization_mode`:
  - `"Optimal_Budget_Reallocation"`: Constrained multi-channel greedy allocation honoring Hold-Constant, mandatory min budgets, max budget caps, and sequential MROI/ROI cutoffs.
  - `"MaxProfit"`: Unconstrained search finding operating points where $\text{MROI} \to 1.0$.
- `total_budget`: Target budget to allocate (defaults to historical sum).
- `hold_constant_channels`: Channels locked at 100% of base spend.
- `channel_min_budgets`, `channel_max_budgets`: Lower floors and upper caps per channel.
- `min_mroi`, `min_roi`: Universal efficiency floors.
- `unit_price`: Value per sales unit.

#### Mathematical Formulation & Logic:
- Adstock carryover: $x_{m, t} = v_{m, t} + \beta \cdot x_{m, t-1}$.
- Discrete S-Curve: 200 steps ($s_k = k \times 0.01 \times \text{BaseSpend}$).
- Greedy Allocation: Sorts eligible increments in strictly descending order of MROI ($\text{MROI}_{(1)} \ge \text{MROI}_{(2)} \ge \dots$) until budget is exhausted.

#### Return Dictionary Structure:
- `reallocation_summary`: `pl.DataFrame` with historical spend, optimized spend, spend delta %, predicted sales, final ROI, final MROI, and adstock decay beta per channel.
- `portfolio_kpi`: Total historical vs optimized spend, total predicted sales, and portfolio-level ROI.
- `adstock_parameters`: Optimal decay beta per channel.

---

## 11. Performance Drivers & Attribution Engine (`03_performance_drivers`)

### Primary File:
- [`spark_ai/ingen_optim/03_performance_drivers/performance_drivers_polars.py`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_optim/03_performance_drivers/performance_drivers_polars.py)
- Reference: [`03_performance_drivers/reference.md`](file:///home/srivatsav/Downloads/ingenspark-pythoncode-File-Upload-APIs-Revamp%20(1)/ingenspark-pythoncode-File-Upload-APIs-Revamp/spark_ai/ingen_optim/03_performance_drivers/reference.md)

### Function: `run_performance_drivers_polars`
```python
def run_performance_drivers_polars(
    file_path: Union[str, pl.DataFrame],
    target_col: str = "sales",
    feature_cols: Optional[List[str]] = None,
    compulsory_features: Optional[List[str]] = None,
    correlation_threshold: float = 0.75,
    min_relative_importance: float = 1.0
) -> Dict[str, Any]
```

#### Detailed Description:
Explains business KPI variance by identifying dominant performance drivers. Automates feature hygiene by pruning multicollinear pairs ($|r| > \text{threshold}$) and rank-deficient predictors (QR decomposition with column pivoting), calculates normalized Relative Importance weights, and determines directional impact (Positive Tailwind [Green] vs Negative Headwind [Red]).

#### Parameter Specifications:
- `file_path`: Dataset path or Polars DataFrame.
- `target_col`: Dependent KPI to explain.
- `feature_cols`: Candidate predictors (None = auto-select numeric).
- `compulsory_features`: Protected features exempt from collinearity pruning.
- `correlation_threshold`: Pearson cutoff for pruning (default `0.75`).
- `min_relative_importance`: Minimum normalized percentage importance to retain (default `1.0%`).

#### Mathematical Formulation & Logic:
- Collinearity Pruning: Drops predictor with lower correlation to target unless marked compulsory.
- QR Column Pivoting: Decomposes $\mathbf{X} \mathbf{P} = \mathbf{Q} \mathbf{R}$ to eliminate linearly dependent columns beyond matrix rank $R$.
- Directional Coding:
  $$\text{Direction} = \begin{cases} \text{Positive Tailwind (Green)}, & \text{if } \text{corr}(X_j, Y) \ge 0 \\ \text{Negative Headwind (Red)}, & \text{if } \text{corr}(X_j, Y) < 0 \end{cases}$$

#### Return Dictionary Structure:
- `driver_summary`: `pl.DataFrame` sorted by relative importance % with driver variable names, importance %, directional impacts, and correlations with target.
- `pruned_features`: List of features dropped due to collinearity.
- `model_r2_score`: Overall driver model fit $R^2$.
- `retained_features_count`: Count of active retained predictors.
