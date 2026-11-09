import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Split,
  PieChart,
  Gauge,
  ArrowRight,
  ArrowLeft,
  FileText,
  RotateCw,
  FolderOpen,
  ChevronDown,
  CheckCircle2,
  UploadCloud,
  Check,
  TrendingUp,
  Sparkles,
  Layers,
  Sliders,
  DollarSign,
  Download,
  AlertCircle
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
const tapGesture = { scale: 0.98 }

export default function IngenOptim() {
  const [selectedProject, setSelectedProject] = useState('First Project')
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('ab-testing') // 'ab-testing' | 'mmm' | 'drivers'

  // A/B Testing Workflow State
  const [abStep, setAbStep] = useState(1) // 1: Setup, 2: Control Selection, 3: Analysis, 4: Report
  const [campaignName, setCampaignName] = useState('Q4 Checkout Lift & Friction Experiment')
  const [hasSingleFile, setHasSingleFile] = useState('YES') // 'YES' | 'NO'
  const [uploadedFileName, setUploadedFileName] = useState('q4_checkout_consolidated_sample.csv')

  const steps = [
    { num: 1, name: 'Setup' },
    { num: 2, name: 'Control Selection' },
    { num: 3, name: 'Analysis' },
    { num: 4, name: 'Report' }
  ]

  return (
    <div className="ingen-customer-screen">
      {/* Top Breadcrumb: Projects / First Project */}
      <div className="ic-breadcrumb-bar">
        <div className="ic-breadcrumb-left">
          <span className="ic-breadcrumb-root">Projects</span>
          <span className="ic-breadcrumb-slash">/</span>
          <div className="ic-project-pill-wrap">
            <button
              className="ic-project-pill"
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            >
              <FolderOpen size={14} color="#ea580c" />
              <span className="ic-project-pill-text">{selectedProject}</span>
              <ChevronDown size={12} color="#64748b" />
            </button>

            {projectMenuOpen && (
              <div className="ic-project-menu">
                {['First Project', 'Customer 360 Graph', 'Q4 Growth Experiment', 'Retail Omnichannel'].map((p) => (
                  <button
                    key={p}
                    className={`ic-project-menu-item ${selectedProject === p ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProject(p)
                      setProjectMenuOpen(false)
                    }}
                  >
                    <span>{p}</span>
                    {selectedProject === p && <CheckCircle2 size={13} color="#ea580c" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ic-breadcrumb-right">
          <span className="ic-tag-pill">Ingen Optim</span>
        </div>
      </div>

      {/* Main Feature Navigation Tabs: A/B Testing | Marketing Mix | Performance Drivers */}
      <div className="optim-tabs-bar" style={{ display: 'flex', gap: 10, margin: '20px 0 24px' }}>
        <button
          className={`optim-tab-btn ${activeTab === 'ab-testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ab-testing')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: activeTab === 'ab-testing' ? '1.5px solid #ea580c' : '1px solid var(--apple-border)',
            background: activeTab === 'ab-testing' ? 'rgba(234, 88, 12, 0.08)' : 'var(--apple-surface)',
            color: activeTab === 'ab-testing' ? '#ea580c' : 'var(--apple-text-1)',
            fontWeight: activeTab === 'ab-testing' ? 600 : 500,
            fontSize: 13.5,
            cursor: 'pointer'
          }}
        >
          <Split size={16} />
          <span>A/B Testing</span>
        </button>

        <button
          className={`optim-tab-btn ${activeTab === 'mmm' ? 'active' : ''}`}
          onClick={() => setActiveTab('mmm')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: activeTab === 'mmm' ? '1.5px solid #2563eb' : '1px solid var(--apple-border)',
            background: activeTab === 'mmm' ? 'rgba(37, 99, 235, 0.08)' : 'var(--apple-surface)',
            color: activeTab === 'mmm' ? '#2563eb' : 'var(--apple-text-1)',
            fontWeight: activeTab === 'mmm' ? 600 : 500,
            fontSize: 13.5,
            cursor: 'pointer'
          }}
        >
          <PieChart size={16} />
          <span>Marketing Mix</span>
        </button>

        <button
          className={`optim-tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: activeTab === 'drivers' ? '1.5px solid #16a34a' : '1px solid var(--apple-border)',
            background: activeTab === 'drivers' ? 'rgba(22, 163, 74, 0.08)' : 'var(--apple-surface)',
            color: activeTab === 'drivers' ? '#16a34a' : 'var(--apple-text-1)',
            fontWeight: activeTab === 'drivers' ? 600 : 500,
            fontSize: 13.5,
            cursor: 'pointer'
          }}
        >
          <Gauge size={16} />
          <span>Performance Drivers</span>
        </button>
      </div>

      {/* =========================================================
          TAB 1: A/B TESTING WITH EXACT STEPPER
          Setup -> Control Selection -> Analysis -> Report
          ========================================================= */}
      {activeTab === 'ab-testing' && (
        <div className="ab-testing-container">
          {/* Stepper Navigation */}
          <div
            className="ab-stepper-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderRadius: 12,
              background: 'var(--apple-surface)',
              border: '1px solid var(--apple-border)',
              marginBottom: 24
            }}
          >
            {steps.map((st, idx) => {
              const isActive = abStep === st.num
              const isPast = abStep > st.num
              return (
                <React.Fragment key={st.num}>
                  <button
                    onClick={() => setAbStep(st.num)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isActive ? '#ea580c' : isPast ? '#16a34a' : 'var(--apple-text-3)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 13.5
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: isActive
                          ? '#ea580c'
                          : isPast
                          ? '#16a34a'
                          : 'var(--apple-hover)',
                        color: isActive || isPast ? '#ffffff' : 'var(--apple-text-2)'
                      }}
                    >
                      {isPast ? <Check size={13} strokeWidth={3} /> : st.num}
                    </span>
                    <span>{st.name}</span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        margin: '0 12px',
                        backgroundColor: isPast ? '#16a34a' : 'var(--apple-border)'
                      }}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* STEP 1: SETUP */}
          {abStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={appleSpring}
              className="ab-step-card"
              style={{
                background: 'var(--apple-surface)',
                border: '1px solid var(--apple-border)',
                borderRadius: 16,
                padding: '28px 32px'
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)', marginBottom: 20 }}>
                Input Selection
              </h2>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: 'var(--apple-text-1)'
                  }}
                >
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name (e.g. Q4 Checkout Lift)"
                  style={{
                    width: '100%',
                    maxWidth: 540,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--apple-border)',
                    background: 'var(--apple-bg)',
                    color: 'var(--apple-text-1)',
                    fontSize: 13.5,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 10,
                    color: 'var(--apple-text-1)'
                  }}
                >
                  Do you have test and universe/control data in one file:
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['YES', 'NO'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setHasSingleFile(option)}
                      style={{
                        padding: '8px 24px',
                        borderRadius: 8,
                        border: hasSingleFile === option ? '2px solid #ea580c' : '1px solid var(--apple-border)',
                        background: hasSingleFile === option ? 'rgba(234, 88, 12, 0.1)' : 'var(--apple-surface)',
                        color: hasSingleFile === option ? '#ea580c' : 'var(--apple-text-1)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic File Upload based on YES / NO selection */}
              <div style={{ marginBottom: 28 }}>
                {hasSingleFile === 'YES' ? (
                  <div
                    style={{
                      border: '2px dashed var(--apple-border)',
                      borderRadius: 12,
                      padding: '24px 20px',
                      textAlign: 'center',
                      background: 'var(--apple-bg)',
                      maxWidth: 540
                    }}
                  >
                    <UploadCloud size={28} color="#ea580c" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--apple-text-1)' }}>
                      {uploadedFileName ? uploadedFileName : 'Upload Consolidated Test & Universe File'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--apple-text-3)', marginTop: 4 }}>
                      File contains both Treatment flag &amp; Control cohort (.csv, .xlsx, .parquet)
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 640 }}>
                    <div
                      style={{
                        border: '2px dashed var(--apple-border)',
                        borderRadius: 12,
                        padding: '20px',
                        textAlign: 'center',
                        background: 'var(--apple-bg)'
                      }}
                    >
                      <UploadCloud size={24} color="#ea580c" style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Test Group File</div>
                      <div style={{ fontSize: 11.5, color: 'var(--apple-text-3)' }}>Accounts in test treatment</div>
                    </div>

                    <div
                      style={{
                        border: '2px dashed var(--apple-border)',
                        borderRadius: 12,
                        padding: '20px',
                        textAlign: 'center',
                        background: 'var(--apple-bg)'
                      }}
                    >
                      <UploadCloud size={24} color="#2563eb" style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Universe / Control File</div>
                      <div style={{ fontSize: 11.5, color: 'var(--apple-text-3)' }}>Baseline pool for matching</div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAbStep(2)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#ea580c',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>Continue to Control Selection</span>
                <ArrowRight size={15} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: CONTROL SELECTION */}
          {abStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={appleSpring}
              className="ab-step-card"
              style={{
                background: 'var(--apple-surface)',
                border: '1px solid var(--apple-border)',
                borderRadius: 16,
                padding: '28px 32px'
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)', marginBottom: 8 }}>
                Control Selection (Propensity Score Matching)
              </h2>
              <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginBottom: 20 }}>
                Synthetically balance test and control cohorts across historical covariates to remove bias.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Test Group Size</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ea580c', marginTop: 4 }}>1,450 Accounts</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Eligible Universe</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)', marginTop: 4 }}>18,200 Accounts</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Matched Control Pool</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>1,450 Accounts (1:1)</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setAbStep(1)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid var(--apple-border)',
                    background: 'var(--apple-surface)',
                    color: 'var(--apple-text-1)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setAbStep(3)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#ea580c',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>Run Matching &amp; Proceed to Analysis</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ANALYSIS */}
          {abStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={appleSpring}
              className="ab-step-card"
              style={{
                background: 'var(--apple-surface)',
                border: '1px solid var(--apple-border)',
                borderRadius: 16,
                padding: '28px 32px'
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)', marginBottom: 8 }}>
                Statistical Uplift Analysis
              </h2>
              <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginBottom: 20 }}>
                Campaign: <strong>{campaignName}</strong> · Difference-in-Differences (DiD) Model
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Observed Lift</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>+18.4%</div>
                  <div style={{ fontSize: 11.5, color: '#16a34a', marginTop: 2 }}>Statistically Significant</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Confidence Level</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--apple-text-1)', marginTop: 4 }}>99.4%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--apple-text-3)', marginTop: 2 }}>p-value: 0.0006</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Incremental Revenue</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ea580c', marginTop: 4 }}>+$142,000 / mo</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setAbStep(2)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid var(--apple-border)',
                    background: 'var(--apple-surface)',
                    color: 'var(--apple-text-1)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setAbStep(4)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#ea580c',
                    color: '#ffffff',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>Generate Final Report</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: REPORT */}
          {abStep === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={appleSpring}
              className="ab-step-card"
              style={{
                background: 'var(--apple-surface)',
                border: '1px solid var(--apple-border)',
                borderRadius: 16,
                padding: '28px 32px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)' }}>
                    Executive A/B Experiment Report
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--apple-text-2)' }}>{campaignName}</p>
                </div>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--apple-border)',
                    background: 'var(--apple-surface)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => alert('Exporting PDF & Slide Deck...')}
                >
                  <Download size={14} />
                  <span>Export Report</span>
                </button>
              </div>

              <div style={{ padding: 18, borderRadius: 12, background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.3)', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#15803d', fontSize: 14 }}>
                  <CheckCircle2 size={16} />
                  <span>WINNER DECLARED: Variant Approach</span>
                </div>
                <p style={{ fontSize: 13, color: '#166534', marginTop: 6, lineHeight: 1.5 }}>
                  The treatment group demonstrated an 18.4% conversion uplift over the matched control cohort, yielding approximately $142,000 in monthly incremental ARR with a 99.4% confidence score.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAbStep(1)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--apple-border)',
                  background: 'var(--apple-surface)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Setup New Experiment
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 2: MARKETING MIX (MMM)
          ========================================================= */}
      {activeTab === 'mmm' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={appleSpring}
          style={{
            background: 'var(--apple-surface)',
            border: '1px solid var(--apple-border)',
            borderRadius: 16,
            padding: '28px 32px'
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)', marginBottom: 6 }}>
            Marketing Mix Modeling (MMM)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginBottom: 20 }}>
            Analyze channel contributions, measure marketing effectiveness and optimize budget allocation.
          </p>

          <table className="ic-data-table">
            <thead>
              <tr>
                <th>Marketing Channel</th>
                <th>Monthly Budget</th>
                <th>Revenue Contribution</th>
                <th>ROAS</th>
                <th>AI Optimization Recommendation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Paid Search (Google Ads)</td>
                <td>$180,000</td>
                <td>38.4%</td>
                <td><strong>4.8x</strong></td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>Increase spend +15%</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Paid Social (Meta Ads)</td>
                <td>$140,000</td>
                <td>26.2%</td>
                <td><strong>3.6x</strong></td>
                <td>Maintain budget</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Organic &amp; SEO</td>
                <td>$45,000</td>
                <td>18.9%</td>
                <td><strong>7.2x</strong></td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>Expand content ops</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Partner Affiliates</td>
                <td>$60,000</td>
                <td>12.1%</td>
                <td><strong>2.9x</strong></td>
                <td style={{ color: '#dc2626' }}>Renegotiate commissions</td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* =========================================================
          TAB 3: PERFORMANCE DRIVERS
          ========================================================= */}
      {activeTab === 'drivers' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={appleSpring}
          style={{
            background: 'var(--apple-surface)',
            border: '1px solid var(--apple-border)',
            borderRadius: 16,
            padding: '28px 32px'
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-text-1)', marginBottom: 6 }}>
            Performance Drivers
          </h2>
          <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginBottom: 20 }}>
            Identify and analyze key factors influencing business performance, customer outcomes and optimization opportunities.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>Top Positive Driver</div>
              <h3 style={{ fontSize: 16, margin: '6px 0 4px' }}>Multi-Product Adoption (2+ SKUs)</h3>
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>+48.0% ARR Correlation</div>
              <p style={{ fontSize: 12, color: 'var(--apple-text-2)', marginTop: 8 }}>
                Accounts using 2 or more products have 3.2x higher lifetime retention and lower support costs.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>Velocity Driver</div>
              <h3 style={{ fontSize: 16, margin: '6px 0 4px' }}>Onboarding Time (&lt;24h)</h3>
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>+34.2% LTV Impact</div>
              <p style={{ fontSize: 12, color: 'var(--apple-text-2)', marginTop: 8 }}>
                Fast CDC data connection during week 1 reduces 90-day churn likelihood by 42%.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-bg)' }}>
              <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, textTransform: 'uppercase' }}>Risk Factor</div>
              <h3 style={{ fontSize: 16, margin: '6px 0 4px' }}>Support Ticket Latency (&gt;4h)</h3>
              <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>-28.6% NPS Drag</div>
              <p style={{ fontSize: 12, color: 'var(--apple-text-2)', marginTop: 8 }}>
                Delayed issue resolutions on connector timeouts represent the primary driver of tier downgrades.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
