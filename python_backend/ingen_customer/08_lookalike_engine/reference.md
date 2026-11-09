# Look-Alike Segmentation Engine: Mathematical Formulation & Polars Pipeline Architecture

## 1. Overview & Business Objective
**Look-Alike Segmentation (Audience Modeling & Inference)** is a supervised machine-learning capability. It identifies high-value accounts from an existing segmentation (e.g. `DECILE 10`, `PRD1 DOMINANT`, or `INCREASING TREND`) as a positive seed class ($y=1$), trains a predictive model on behavioral/demographic attributes, and scores unsegmented prospects to uncover look-alike candidates with predicted probability $P(y=1) \in [0, 1]$.

Key Outputs:
- **Look-Alike Target Audience**: Accounts meeting classification threshold ($P \ge 0.50$).
- **High-Confidence Look-Alikes**: Accounts with $\ge 80\%$ predicted probability.

---

## 2. All Required Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `train_file_path` | `Union[str, pl.DataFrame]` | *Required* | Training dataset containing features and customer identifiers. |
| `segment_label_path` | `Union[str, pl.DataFrame]` | *Required* | Upstream segmentation output containing `customer` and `Segment`. |
| `positive_class` | `str` | *Required* | Target seed label to replicate (e.g. `"Decile 10 (90-100%)"`). |
| `feature_cols` | `Optional[List[str]]` | `None` | Independent feature columns. If None, auto-selects numeric columns. |
| `customer_col` | `str` | `"customer"` | Unique customer identifier. |
| `prospect_file_path` | `Optional[Union[str, pl.DataFrame]]` | `None` | Unsegmented prospect dataset to score (Stage 2 inference). |
| `confidence_threshold` | `float` | `0.80` | Probability cutoff for high-confidence look-alike flag. |

---

## 3. Mathematical & Modeling Formulas

### 3.1 Binary Target Formulation
For customer $c$ and assigned segment $\sigma(c)$:
$$y_c = \begin{cases}
1, & \text{if } \sigma(c) = \text{positive\_class} \\
0, & \text{otherwise}
\end{cases}$$

### 3.2 Preprocessing & Feature Hygiene
1. **Multicollinearity Removal**: Drop feature $j$ if $|r_{jk}| \ge 0.80$.
2. **MinMax Normalization**:
   $$x_{c, j}^{\text{scaled}} = \frac{x_{c, j} - \min(X_j)}{\max(X_j) - \min(X_j)}$$
3. **Balanced Class Weighting**:
   $$w_k = \frac{M}{2 \cdot |\{c \mid y_c = k\}|}, \quad k \in \{0, 1\}$$

### 3.3 Supervised Modeling & Scoring
Evaluates models optimizing for **ROC-AUC**:
$$\text{AUC} = \int_0^1 \text{TPR}(\tau) \, d(\text{FPR}(\tau))$$
- Predicts continuous score: $\hat{p}_i = P(y_i = 1 \mid \mathbf{x}_i) \in [0.0, 1.0]$.
- Standard Look-Alike: $\hat{p}_i \ge 0.50$.
- High-Confidence Look-Alike: $\hat{p}_i \ge 0.80$.

### 3.4 Inference KPI Metrics
$$\text{Look-Alike Rate} = \left( \frac{\sum \mathbb{I}(\hat{p}_i \ge 0.50)}{N_{\text{prospects}}} \right) \times 100$$
$$\text{High-Confidence Count} = \sum \mathbb{I}(\hat{p}_i \ge 0.80)$$
