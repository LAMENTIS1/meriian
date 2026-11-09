import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Database,
  ArrowRight,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  Cpu,
  Table,
  Check,
  ChevronRight,
  Layers,
  FileSpreadsheet,
  Terminal,
  ExternalLink,
  ChevronDown
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }

export default function PipelineRecommendationModal({
  isOpen,
  onClose,
  dataset,
  onApplyRecommendations
}) {
  if (!isOpen || !dataset) return null

  // Active view tab in recommendation screen: 'overview' | 'readiness' | 'transformation'
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFormat, setSelectedFormat] = useState('Format 1') // Format 1 (Calendar Date), Format 2, Format 3, Format 4
  const [showCodeModeSnippet, setShowCodeModeSnippet] = useState(false)
  const [readinessFilter, setReadinessFilter] = useState('all') // 'all' | 'passed' | 'review' | 'blocked'
  const [expandedArea, setExpandedArea] = useState('area-1')

  // Pipeline A: 18 Areas / 96 Checks Mock Data (NUROVA Standard)
  const readinessSummary = {
    totalChecks: 96,
    passed: 85,
    needsDecision: 9,
    fixRequired: 1, // Blocker Check 1.9
    notChecked: 1,
    gateStatus: 'Blocked', // 'Cleared' | 'Blocked'
    blockerCheck: 'Check 1.9: Physician identifier mapping collision in secondary specialty taxonomy'
  }

  const readinessAreas = [
    {
      id: 'area-1',
      index: 1,
      name: 'Sources and assembly',
      description: 'Source completeness, duplicates, identifiers and schema mapping',
      passed: 6,
      total: 7,
      status: 'fix_required',
      checks: [
        { id: '1.1', title: 'Source file availability and checksum integrity', status: 'passed' },
        { id: '1.2', title: 'Source schema validation against registration contract', status: 'passed' },
        { id: '1.3', title: 'Primary key completeness and unique constraints', status: 'passed' },
        { id: '1.4', title: 'Deduplication across ingest transaction timestamps', status: 'passed' },
        { id: '1.9', title: 'Physician ID cross-taxonomy unicity check', status: 'fix_required', note: 'Unresolved blocker: 42 duplicate physician NPI cross-references found in secondary specialty taxonomy. Human review or authorized exception required.' }
      ]
    },
    {
      id: 'area-2',
      index: 2,
      name: 'Panel structure',
      description: 'Analytical panel grain consistency (Physician × Month)',
      passed: 6,
      total: 6,
      status: 'passed',
      checks: [
        { id: '2.1', title: 'Consistent physician-month balance across 24 historical periods', status: 'passed' },
        { id: '2.2', title: 'Zero imputation on unrecorded activity cells', status: 'passed' }
      ]
    },
    {
      id: 'area-3',
      index: 3,
      name: 'Value plausibility',
      description: 'Negative values, dynamic ranges, and market-share sanity',
      passed: 5,
      total: 5,
      status: 'passed',
      checks: [
        { id: '3.1', title: 'Non-negative quantity and TRx values verified', status: 'passed' },
        { id: '3.2', title: 'Sum of product shares within class <= 100.0%', status: 'passed' }
      ]
    },
    {
      id: 'area-4',
      index: 4,
      name: 'Prescribing logic',
      description: 'TRx, NRx, NBRx consistency and brand-switching business rules',
      passed: 4,
      total: 5,
      status: 'decision',
      checks: [
        { id: '4.1', title: 'NRx <= TRx per physician-month grain', status: 'passed' },
        { id: '4.2', title: 'NBRx new-to-brand conversion temporal lag check', status: 'decision', note: 'Decision: 14 physicians exhibit NBRx activity prior to first commercial touchpoint. Mark as organic or align window.' }
      ]
    },
    {
      id: 'area-5',
      index: 5,
      name: 'Cost and unit sanity',
      description: 'Average sales price, rebate deduction, and unit variance',
      passed: 4,
      total: 4,
      status: 'passed',
      checks: [
        { id: '5.1', title: 'Unit cost bounds within 3 standard deviations', status: 'passed' }
      ]
    },
    {
      id: 'area-6',
      index: 6,
      name: 'Does activity move enough?',
      description: 'Promotional activity variance and signal-to-noise ratio',
      passed: 5,
      total: 6,
      status: 'decision',
      checks: [
        { id: '6.1', title: 'Promotional call variance coefficient > 0.15', status: 'decision', note: 'Decision: 3 regional territories show low variation. Recommend territory clustering.' }
      ]
    },
    {
      id: 'area-7',
      index: 7,
      name: 'Quiet periods for carryover',
      description: 'Inactive periods to assess marketing fade-out / adstock half-life',
      passed: 5,
      total: 5,
      status: 'passed',
      checks: [
        { id: '7.1', title: 'Adstock quiet periods identified for carryover estimation', status: 'passed' }
      ]
    },
    {
      id: 'area-10',
      index: 10,
      name: 'Channels stepping on each other',
      description: 'Channel correlation and multicollinearity test (VIF < 5.0)',
      passed: 4,
      total: 5,
      status: 'decision',
      checks: [
        { id: '10.1', title: 'Field rep details vs Sample drops correlation (r = 0.82)', status: 'decision', note: 'High correlation between rep calls and sample drops. Consider joint synthetic channel.' }
      ]
    },
    {
      id: 'area-17',
      index: 17,
      name: 'Privacy and governance',
      description: 'HIPAA identifier suppression and k-anonymity compliance',
      passed: 5,
      total: 5,
      status: 'passed',
      checks: [
        { id: '17.1', title: 'Direct patient identifiers redacted', status: 'passed' }
      ]
    },
    {
      id: 'area-18',
      index: 18,
      name: 'Handoff contract',
      description: 'Schema lockdown and downstream modeling boundary clearance',
      passed: 4,
      total: 5,
      status: 'fix_required',
      checks: [
        { id: '18.1', title: 'Downstream Bayesian Causal Model contract specification', status: 'fix_required', note: 'Blocked pending resolution of Check 1.9' }
      ]
    }
  ]

  // Pipeline B: Detected Format & Transformation Subgraphs
  const detectedFormatDetails = {
    format: 'Format 1: Calendar Date',
    confidence: '99.4%',
    rulesetMatched: 'public.application_specific_data_ruleset',
    detectedRoles: [
      { field: 'customer_id', role: 'Customer / Physician Key', type: 'VARCHAR', status: 'Matched' },
      { field: 'product_id', role: 'Product / Brand Key', type: 'VARCHAR', status: 'Matched' },
      { field: 'order_date', role: 'Calendar Timestamp', type: 'DATE (YYYY-MM-DD)', status: 'Matched' },
      { field: 'quantity', role: 'Sales Volume Metric', type: 'INTEGER', status: 'Matched' },
      { field: 'revenue', role: 'Monetary Metric', type: 'FLOAT', status: 'Matched' }
    ],
    targetOutputs: [
      {
        table: 'trans_sales_data1',
        grain: 'Customer × Product',
        metrics: 'Weekly, monthly, quarterly, annual totals & lag metrics',
        downstream: 'Decile, Quartile, Volume Trend'
      },
      {
        table: 'trans_sales_data2',
        grain: 'Customer × Class',
        metrics: 'Category-level aggregate volumes & spend',
        downstream: 'Customer 360'
      },
      {
        table: 'trans_sales_data3',
        grain: 'Customer × Product × Class',
        metrics: 'Percentage market share within therapeutic class',
        downstream: 'Market Dominant, Share Trend'
      }
    ]
  }

  const formatOptions = [
    {
      id: 'Format 1',
      title: 'Subgraph 1 — Calendar Date',
      tag: 'Recommended (Detected 99.4%)',
      desc: 'Parses transaction dates (YYYY-MM-DD), extracts ISO week/month/quarter, pivots into time-series features.'
    },
    {
      id: 'Format 2',
      title: 'Subgraph 2 — Period Index / Name',
      tag: 'Alternative',
      desc: 'Parses month labels (Jan, Feb, Mar) or period counters into chronological index columns.'
    },
    {
      id: 'Format 3',
      title: 'Subgraph 3 — Time & Metric in Headers',
      tag: 'Alternative',
      desc: 'Tokenizes wide column headers (e.g. JAN04_QTY, FEB04_NRX) to extract month/year/metric.'
    },
    {
      id: 'Format 4',
      title: 'Subgraph 4 — Relative Periods',
      tag: 'Alternative',
      desc: 'Handles relative period sequences (units_month1, units_month2) without calendar dates.'
    }
  ]

  return (
    <div className="connector-modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={appleSpring}
        className="connector-modal-card pipeline-rec-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="connector-modal-header" style={{ paddingBottom: 16 }}>
          <div className="connector-modal-title-group">
            <div className="spark-ai-badge-icon">
              <Sparkles size={20} color="#7c3aed" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className="connector-modal-heading">Spark AI Pipeline Recommendations</h2>
                <span className="spark-ai-tag">IngenData Two-Pipeline Engine</span>
              </div>
              <p className="connector-modal-subheading">
                Automated structural detection & 96-check readiness analysis for <strong>{dataset.name}</strong> ({dataset.size || '24.8 MB'})
              </p>
            </div>
          </div>
          <button className="connector-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* TOP TAB SWITCHER: Overview vs Pipeline A vs Pipeline B */}
        <div className="pipeline-rec-tabs-bar">
          <button
            className={`rec-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Layers size={15} />
            <span>Executive Overview</span>
          </button>
          <button
            className={`rec-tab-btn ${activeTab === 'readiness' ? 'active' : ''}`}
            onClick={() => setActiveTab('readiness')}
          >
            <ShieldCheck size={15} />
            <span>Pipeline A — Data Readiness (96 Checks)</span>
            <span className="badge-blocker-pill">1 Blocker</span>
          </button>
          <button
            className={`rec-tab-btn ${activeTab === 'transformation' ? 'active' : ''}`}
            onClick={() => setActiveTab('transformation')}
          >
            <Cpu size={15} />
            <span>Pipeline B — Transformation Subgraphs</span>
            <span className="badge-detected-pill">Format 1 Detected</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="pipeline-modal-scrollable-body">
          {activeTab === 'overview' && (
            <div className="rec-overview-layout">
              {/* Dual Pipeline Architecture Banner */}
              <div className="two-pipeline-architecture-banner">
                <div className="pipeline-branch-card readiness">
                  <div className="branch-card-header">
                    <div className="branch-icon-pill readiness">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h4 className="branch-title">Pipeline A: Data Readiness</h4>
                      <p className="branch-sub">Quality, Governance & Modeling Eligibility</p>
                    </div>
                    <span className="status-tag-blocked">Modelling Gate Locked</span>
                  </div>
                  <div className="branch-kpi-row">
                    <div className="kpi-mini-box">
                      <span className="kpi-num green">{readinessSummary.passed}</span>
                      <span className="kpi-lbl">Passed</span>
                    </div>
                    <div className="kpi-mini-box">
                      <span className="kpi-num amber">{readinessSummary.needsDecision}</span>
                      <span className="kpi-lbl">Decisions</span>
                    </div>
                    <div className="kpi-mini-box">
                      <span className="kpi-num red">{readinessSummary.fixRequired}</span>
                      <span className="kpi-lbl">Blocker</span>
                    </div>
                    <div className="kpi-mini-box">
                      <span className="kpi-num gray">{readinessSummary.notChecked}</span>
                      <span className="kpi-lbl">Not Checked</span>
                    </div>
                  </div>
                  <p className="branch-desc">
                    18 validation areas evaluated. Requires clearance of <strong>Check 1.9</strong> before downstream Bayesian Causal Modeling handoff.
                  </p>
                </div>

                <div className="pipeline-branch-card transformation">
                  <div className="branch-card-header">
                    <div className="branch-icon-pill transformation">
                      <Cpu size={16} />
                    </div>
                    <div>
                      <h4 className="branch-title">Pipeline B: Data Transformation</h4>
                      <p className="branch-sub">Auto-Classification into 4 Subgraphs</p>
                    </div>
                    <span className="status-tag-ready">Format 1 Classified</span>
                  </div>
                  <div className="branch-kpi-row">
                    <div className="kpi-mini-box">
                      <span className="kpi-num purple">4</span>
                      <span className="kpi-lbl">Subgraphs</span>
                    </div>
                    <div className="kpi-mini-box">
                      <span className="kpi-num blue">3</span>
                      <span className="kpi-lbl">Parquet Tables</span>
                    </div>
                    <div className="kpi-mini-box">
                      <span className="kpi-num green">5/5</span>
                      <span className="kpi-lbl">Roles Matched</span>
                    </div>
                  </div>
                  <p className="branch-desc">
                    Matches <code>public.application_specific_data_ruleset</code>. Ready to generate <code>trans_sales_data1</code>, <code>trans_sales_data2</code>, <code>trans_sales_data3</code>.
                  </p>
                </div>
              </div>

              {/* Spark AI Recommendation Card */}
              <div className="spark-rec-alert-card">
                <div className="spark-rec-alert-icon">
                  <Sparkles size={22} color="#7c3aed" />
                </div>
                <div className="spark-rec-alert-content">
                  <h4 className="spark-rec-title">Spark AI Prescriptive Recommendation</h4>
                  <p className="spark-rec-text">
                    Execute <strong>Transformation Subgraph 1 (Calendar Date)</strong> immediately to materialize customer-level time-series Parquet tables. Simultaneously, dispatch an automated deduplication fix for <strong>Check 1.9</strong> to unlock the Bayesian Modeling Gate.
                  </p>
                  <div className="spark-rec-actions">
                    <button
                      className="btn-spark-primary"
                      onClick={() => setActiveTab('transformation')}
                    >
                      <Cpu size={14} /> Review Transformation Setup
                    </button>
                    <button
                      className="btn-spark-secondary"
                      onClick={() => setActiveTab('readiness')}
                    >
                      <ShieldCheck size={14} /> Inspect Blocker (Check 1.9)
                    </button>
                    <button
                      className="btn-spark-code"
                      onClick={() => setShowCodeModeSnippet(!showCodeModeSnippet)}
                    >
                      <Terminal size={14} /> View Code Mode Call
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Mode Snippet accordion */}
              {showCodeModeSnippet && (
                <div className="code-mode-preview-box">
                  <div className="code-mode-header">
                    <span className="code-mode-title">Spark AI Code Mode Invocation</span>
                    <span className="code-mode-badge">Python / Polars SDK</span>
                  </div>
                  <pre className="code-mode-pre">
{`# 1. Execute Transformation Subgraph 1 to build standardized Parquet outputs
trans_result = await call_tool("run_sales_transformation_polars", {
    "file_path": "${dataset.name}.parquet",
    "format_subgraph": "subgraph_1_calendar_date",
    "ruleset": "public.application_specific_data_ruleset"
})

# 2. Trigger 96-check readiness validation across 18 areas
readiness_result = await call_tool("run_data_readiness_pipeline", {
    "dataset_id": "${dataset.id}",
    "auto_resolve_exceptions": False
})

# 3. Print gate status
return {
    "parquet_tables": trans_result["generated_tables"],
    "modelling_gate": readiness_result["gate_status"]
}`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'readiness' && (
            <div className="readiness-tab-layout">
              {/* Header metrics */}
              <div className="readiness-status-banner">
                <div className="status-banner-left">
                  <div className="gate-locked-indicator">
                    <XCircle size={20} color="#ef4444" />
                    <div>
                      <span className="gate-locked-title">Modelling Gate Locked (1 Blocker Found)</span>
                      <span className="gate-locked-desc">
                        Server-side clearance blocked: {readinessSummary.blockerCheck}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="status-banner-pills">
                  <span className="pill green">✓ 85 Passed</span>
                  <span className="pill amber">⚠ 9 Decisions</span>
                  <span className="pill red">✕ 1 Fix Required</span>
                  <span className="pill gray">○ 1 Not Checked</span>
                </div>
              </div>

              {/* Filter Row */}
              <div className="readiness-filter-bar">
                <span className="filter-bar-label">Filter 18 Validation Areas:</span>
                {['all', 'blocked', 'decision', 'passed'].map((f) => (
                  <button
                    key={f}
                    className={`filter-btn ${readinessFilter === f ? 'active' : ''}`}
                    onClick={() => setReadinessFilter(f)}
                  >
                    {f === 'all' && 'All 18 Areas'}
                    {f === 'blocked' && 'Fix Required (Blockers)'}
                    {f === 'decision' && 'Human Decisions (9)'}
                    {f === 'passed' && 'Fully Cleared'}
                  </button>
                ))}
              </div>

              {/* 18 Areas List */}
              <div className="readiness-areas-accordion">
                {readinessAreas
                  .filter((area) => {
                    if (readinessFilter === 'blocked') return area.status === 'fix_required'
                    if (readinessFilter === 'decision') return area.status === 'decision'
                    if (readinessFilter === 'passed') return area.status === 'passed'
                    return true
                  })
                  .map((area) => (
                    <div
                      key={area.id}
                      className={`readiness-area-card ${area.status} ${
                        expandedArea === area.id ? 'expanded' : ''
                      }`}
                    >
                      <div
                        className="area-card-header"
                        onClick={() =>
                          setExpandedArea(expandedArea === area.id ? null : area.id)
                        }
                      >
                        <div className="area-title-col">
                          <span className="area-number-pill">Area {area.index}</span>
                          <span className="area-name">{area.name}</span>
                          <span className="area-desc">{area.description}</span>
                        </div>
                        <div className="area-meta-col">
                          <span className={`area-status-badge ${area.status}`}>
                            {area.status === 'fix_required' && '1 Blocker'}
                            {area.status === 'decision' && 'Requires Decision'}
                            {area.status === 'passed' && 'All Checks Passed'}
                          </span>
                          <span className="area-score">
                            {area.passed}/{area.total} checks
                          </span>
                          <ChevronDown
                            size={16}
                            className={`area-arrow ${expandedArea === area.id ? 'rotated' : ''}`}
                          />
                        </div>
                      </div>

                      {expandedArea === area.id && (
                        <div className="area-checks-body">
                          {area.checks.map((check) => (
                            <div key={check.id} className={`check-item-row ${check.status}`}>
                              <div className="check-icon-col">
                                {check.status === 'passed' && (
                                  <CheckCircle2 size={16} color="#10b981" />
                                )}
                                {check.status === 'decision' && (
                                  <AlertTriangle size={16} color="#f59e0b" />
                                )}
                                {check.status === 'fix_required' && (
                                  <XCircle size={16} color="#ef4444" />
                                )}
                              </div>
                              <div className="check-content-col">
                                <span className="check-id-title">
                                  <strong>Check {check.id}:</strong> {check.title}
                                </span>
                                {check.note && (
                                  <p className="check-note-alert">{check.note}</p>
                                )}
                              </div>
                              <div className="check-action-col">
                                {check.status === 'fix_required' && (
                                  <button
                                    className="btn-fix-action"
                                    onClick={() =>
                                      alert(
                                        `Spark AI Auto-Fix Triggered for ${check.id}: Applying automated deduplication & taxonomy unicity filter.`
                                      )
                                    }
                                  >
                                    Apply Spark Auto-Fix
                                  </button>
                                )}
                                {check.status === 'decision' && (
                                  <button
                                    className="btn-decision-action"
                                    onClick={() =>
                                      alert(`Accepted exception logged for ${check.id}.`)
                                    }
                                  >
                                    Accept Exception
                                  </button>
                                )}
                                {check.status === 'passed' && (
                                  <span className="check-passed-badge">Passed</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'transformation' && (
            <div className="transformation-tab-layout">
              {/* Subgraph Selection Card */}
              <div className="subgraphs-grid">
                {formatOptions.map((f) => (
                  <div
                    key={f.id}
                    className={`subgraph-card ${selectedFormat === f.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFormat(f.id)}
                  >
                    <div className="subgraph-card-header">
                      <span className="subgraph-card-title">{f.title}</span>
                      <span className={`subgraph-card-tag ${f.id === 'Format 1' ? 'detected' : ''}`}>
                        {f.tag}
                      </span>
                    </div>
                    <p className="subgraph-card-desc">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Detected Roles & Ruleset Inspection */}
              <div className="detected-roles-card">
                <div className="detected-roles-header">
                  <div>
                    <h4 className="detected-title">Automated Column Detection & Ruleset Matching</h4>
                    <span className="detected-sub">
                      Applied ruleset: <code>{detectedFormatDetails.rulesetMatched}</code>
                    </span>
                  </div>
                  <span className="detected-confidence-badge">Confidence: 99.4%</span>
                </div>

                <div className="detected-columns-table">
                  <div className="cols-table-head">
                    <span>Source Column</span>
                    <span>Resolved Analytical Role</span>
                    <span>Inferred Data Type</span>
                    <span>Status</span>
                  </div>
                  {detectedFormatDetails.detectedRoles.map((r, i) => (
                    <div key={i} className="cols-table-row">
                      <code className="col-name">{r.field}</code>
                      <span className="col-role">{r.role}</span>
                      <span className="col-type">{r.type}</span>
                      <span className="col-status-pill">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standardized Parquet Outputs */}
              <div className="parquet-outputs-card">
                <h4 className="parquet-card-title">Standardized Output Layer (3 Parquet Tables)</h4>
                <p className="parquet-card-sub">
                  Generated tables will be saved into S3 and registered in <code>public.user_file_upload.transformed_tablenames</code>
                </p>

                <div className="parquet-tables-grid">
                  {detectedFormatDetails.targetOutputs.map((out, idx) => (
                    <div key={idx} className="parquet-table-card">
                      <div className="parquet-card-top">
                        <Table size={15} color="#ea580c" />
                        <span className="parquet-tbl-name">{out.table}</span>
                      </div>
                      <div className="parquet-grain">Grain: <strong>{out.grain}</strong></div>
                      <p className="parquet-metrics">{out.metrics}</p>
                      <div className="parquet-consumers">
                        Downstream: <span>{out.downstream}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="connector-modal-footer">
          <div className="footer-left">
            <span className="footer-security-text">
              <ShieldCheck size={14} /> End-to-end governed pipeline with automated audit trail.
            </span>
          </div>
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Close
            </button>
            <button
              className="btn-save-conn"
              onClick={() => {
                if (onApplyRecommendations) {
                  onApplyRecommendations({
                    dataset,
                    selectedFormat,
                    status: 'Pipeline Cleared'
                  })
                }
                alert(
                  `Spark AI Pipeline Started: Executing Subgraph 1 (Calendar Date) transformation and generating 3 Parquet outputs.`
                )
                onClose()
              }}
            >
              <Sparkles size={14} /> Apply Spark AI Transformation Pipeline
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
