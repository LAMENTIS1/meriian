# IngenSpark Meridian Toolkit 🚀

A comprehensive, production-grade Marketing Mix Modeling (MMM) engine built on top of **Google Meridian** and powered by **Polars**.

---

## 📁 Package Contents

```text
ingenspark_meridian_toolkit/
├── demo/                            # Complete copy of official Meridian demo notebooks
│   ├── Meridian_Full_Funnel.ipynb
│   ├── Meridian_Getting_Started.ipynb
│   ├── Meridian_Getting_Started_Tf.ipynb
│   ├── Meridian_MLflow_Demo.ipynb
│   ├── Meridian_Prior_Calibration_JAX.ipynb
│   ├── Meridian_RF_Demo.ipynb
│   ├── Meridian_Scenario_Planner_Beta.ipynb
│   ├── RF_Data_Simulation_for_Meridian.ipynb
│   └── ROI_mROI_Response_Curves.ipynb
├── skills/                          # Specialized Meridian skills and assistants
│   ├── meridian_budget_optimization/
│   ├── meridian_doc_consultant/
│   ├── meridian_model_building/
│   ├── meridian_result_visualization/
│   └── meridian_scenario_planner/
├── meridian_complete_toolkit.py     # Unified engine: 61 modular functions (Polars native)
├── demo_marketing_data.csv          # Realistic 5-Geo x 104-Week synthetic dataset
├── requirements.txt                 # Exact dependencies and pinned versions
├── RUN.md                           # Step-by-step execution guide
├── MERIDIAN_ANALYSIS_GUIDE.md       # Technical architecture, math & evaluation framework
├── MERIDIAN_STORY.html              # 15-chapter intuitive story & executive guide
├── MERIDIAN_STORY.md                # Story guide in Markdown format
├── meridian_workflow_guide.html     # Interactive dark-mode workflow documentation
├── meridian_workflow_features.txt   # Stage-by-stage feature inventory
├── meridian_complete_inventory.txt  # Full function inventory
└── meridian_toolkit_output/         # Generated reports, models & HTML dashboards
    ├── master_report.html           # Unified interactive tabbed dashboard
    ├── model_health_card.html       # Convergence & MCMC diagnostics
    ├── results_summary.html         # Attribution & ROI curves
    ├── fitted_model.pkl             # Serialized Bayesian model
    ├── mmm_schema_export.pb         # Looker Studio Protobuf export
    └── charts/                      # Standalone interactive Vega-Lite charts
```

---

## ⚡ Quick Start

### 1. Set Up Environment
```bash
cd /home/srivatsav/Downloads/meridian
source .venv/bin/activate
# or install dependencies:
pip install -r ingenspark_meridian_toolkit/requirements.txt
```

### 2. Run Complete Pipeline
```bash
cd ingenspark_meridian_toolkit
python meridian_complete_toolkit.py
```

### 3. Open All-in-One Dashboard
Launch `meridian_toolkit_output/master_report.html` in your browser to inspect model health, spend response curves, channel ROI, and budget scenarios.

---

## 🛠️ Key Capabilities
1. **Zero-Copy Polars Data Processing**: Seamlessly ingests large marketing datasets.
2. **Bayesian Adstock & Saturation**: Fits Hill curves and carryover with JAX/TFP.
3. **GeoX Prior Infusion**: Calibrates priors directly from incrementality test results.
4. **Interactive Scenario Planner**: Pre-computes optimization grids and exports to Looker Studio.
5. **Full-Funnel Attribution**: Directly connects upper-funnel brand metrics with bottom-funnel sales.
