import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BarChart2,
  LayoutGrid,
  TrendingUp,
  Trophy,
  UserPlus,
  GitFork,
  Sliders,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  FileText,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  ChevronDown,
  Sparkles,
  Download,
  Users,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
const tapGesture = { scale: 0.98 }

export default function IngenCustomer() {
  const [activeDetailId, setActiveDetailId] = useState(null)
  const [selectedProject, setSelectedProject] = useState('First Project')
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

  // Segmentations section items (User specification)
  const segmentations = [
    {
      id: 'decile',
      title: 'Decile Segmentation',
      desc: 'Customers will be segmented into deciles (Decile 1 to Decile 10), each decile will consist of 10% of total sales.',
      icon: BarChart2,
      iconBg: '#fff7ed',
      iconColor: '#ea580c'
    },
    {
      id: 'quartile',
      title: 'Quartile Segmentation',
      desc: 'Customers will be segmented into quartiles (Quartile 1 to Quartile 4), each quartile will consist of 25% of total sales.',
      icon: LayoutGrid,
      iconBg: '#fff7ed',
      iconColor: '#ea580c'
    },
    {
      id: 'trend',
      title: 'Trend Segmentation',
      desc: 'Find trends in sales over the period at customer and product level: increasing, declining, flat or fluctuating.',
      icon: TrendingUp,
      iconBg: '#fff7ed',
      iconColor: '#ea580c'
    },
    {
      id: 'dominant',
      title: 'Dominant Segmentation',
      desc: 'Find out the dominance in a product as well as the spreaders.',
      icon: Trophy,
      iconBg: '#fff7ed',
      iconColor: '#ea580c'
    },
    {
      id: 'lookalike',
      title: 'Look-Alike Segmentation',
      desc: 'Identifies new customers similar to high-value existing customers using behavioral and similarity patterns.',
      icon: UserPlus,
      iconBg: '#fff7ed',
      iconColor: '#ea580c'
    }
  ]

  // Customer Analytics section items (User specification)
  const analytics = [
    {
      id: 'combine',
      title: 'Combine Segmentation',
      desc: 'Crosstab visualization across multiple segments.',
      icon: GitFork,
      iconBg: '#f0fdfa',
      iconColor: '#0d9488'
    },
    {
      id: 'custom',
      title: 'Custom Segmentation',
      desc: 'Select a segment from a performed segmentation and apply user defined filters to analyze it.',
      icon: Sliders,
      iconBg: '#f0fdfa',
      iconColor: '#0d9488'
    },
    {
      id: 'c360',
      title: 'Customer 360°',
      desc: 'A unified, holistic view of customers combining multiple data sources and segment outputs.',
      icon: UserCheck,
      iconBg: '#eff6ff',
      iconColor: '#1e3a8a'
    }
  ]

  // Sample data for Deciles
  const decilesData = [
    { decile: 'Decile 1', sales: '$125,000', salesShare: '10.0%', customerCount: 4, avgTicket: '$31,250' },
    { decile: 'Decile 2', sales: '$125,000', salesShare: '10.0%', customerCount: 8, avgTicket: '$15,625' },
    { decile: 'Decile 3', sales: '$125,000', salesShare: '10.0%', customerCount: 14, avgTicket: '$8,928' },
    { decile: 'Decile 4', sales: '$125,000', salesShare: '10.0%', customerCount: 22, avgTicket: '$5,681' },
    { decile: 'Decile 5', sales: '$125,000', salesShare: '10.0%', customerCount: 31, avgTicket: '$4,032' },
    { decile: 'Decile 6', sales: '$125,000', salesShare: '10.0%', customerCount: 45, avgTicket: '$2,777' },
    { decile: 'Decile 7', sales: '$125,000', salesShare: '10.0%', customerCount: 68, avgTicket: '$1,838' },
    { decile: 'Decile 8', sales: '$125,000', salesShare: '10.0%', customerCount: 96, avgTicket: '$1,302' },
    { decile: 'Decile 9', sales: '$125,000', salesShare: '10.0%', customerCount: 140, avgTicket: '$892' },
    { decile: 'Decile 10', sales: '$125,000', salesShare: '10.0%', customerCount: 284, avgTicket: '$440' }
  ]

  // Sample data for Trend Segmentation
  const trendData = [
    { customer: 'Northwind Global Corp', product: 'Cloud API Fabric', trend: 'Increasing', delta: '+34.2%', q4Sales: '$420,000' },
    { customer: 'Acme Systems Ltd', product: 'Enterprise Mesh', trend: 'Increasing', delta: '+22.8%', q4Sales: '$310,000' },
    { customer: 'Zenith Logistics', product: 'Data Connector Pro', trend: 'Flat', delta: '+0.4%', q4Sales: '$180,000' },
    { customer: 'Pacific Health Care', product: 'Telemetry Enclave', trend: 'Declining', delta: '-18.5%', q4Sales: '$94,000' },
    { customer: 'Helios Media Group', product: 'Cloud API Fabric', trend: 'Fluctuating', delta: '+4.1%', q4Sales: '$145,000' }
  ]

  // Sample data for Look-Alike
  const lookAlikeData = [
    { targetProspect: 'Aura Financial Solutions', matchScore: '96.4%', seedLookalike: 'Northwind Global', estLTV: '$280,000', affinity: 'High Token Usage, CDC Connector' },
    { targetProspect: 'Apex Capital Partners', matchScore: '93.8%', seedLookalike: 'Acme Systems', estLTV: '$240,000', affinity: 'Multi-Region Data Lake, SSO' },
    { targetProspect: 'Vanguard Biopharma', matchScore: '89.2%', seedLookalike: 'Pacific Health Care', estLTV: '$195,000', affinity: 'Compliance Mesh, SOC2' },
    { targetProspect: 'Terraform Retail Group', matchScore: '86.5%', seedLookalike: 'Zenith Logistics', estLTV: '$160,000', affinity: 'Real-time Webhook Streaming' }
  ]

  const allItems = [...segmentations, ...analytics]
  const currentDetailItem = allItems.find((item) => item.id === activeDetailId)

  return (
    <div className="ingen-customer-screen">
      {/* Top Breadcrumb Header: Projects / First Project */}
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
          <span className="ic-tag-pill">Ingen Customer</span>
        </div>
      </div>

      {/* Drill-down View or Main Hub View */}
      <AnimatePresence mode="wait">
        {currentDetailItem ? (
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={appleSpring}
            className="segmentation-detail-panel"
          >
            <div className="detail-top-nav">
              <button
                className="detail-back-button"
                onClick={() => setActiveDetailId(null)}
              >
                <ArrowLeft size={16} />
                <span>Back to Segmentations</span>
              </button>
            </div>

            <div className="detail-hero-box">
              <div
                className="detail-icon-large"
                style={{
                  backgroundColor: currentDetailItem.iconBg,
                  color: currentDetailItem.iconColor
                }}
              >
                <currentDetailItem.icon size={26} strokeWidth={1.8} />
              </div>
              <div className="detail-hero-text">
                <h2 className="detail-hero-title">{currentDetailItem.title}</h2>
                <p className="detail-hero-desc">{currentDetailItem.desc}</p>
              </div>
              <button
                className="run-segmentation-btn"
                onClick={() => alert(`Executed analysis for [${currentDetailItem.title}] in ${selectedProject}`)}
              >
                <RotateCw size={14} />
                <span>Execute Analysis</span>
              </button>
            </div>

            {/* 1. Decile Table */}
            {currentDetailItem.id === 'decile' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Decile Distribution (10% Sales Share per Tier)</span>
                  <span className="ic-table-meta">10 Deciles · 712 Accounts Analyzed</span>
                </div>
                <table className="ic-data-table">
                  <thead>
                    <tr>
                      <th>Decile Tier</th>
                      <th>Sales Total</th>
                      <th>Sales Share</th>
                      <th>Customer Count</th>
                      <th>Avg Sales / Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decilesData.map((d) => (
                      <tr key={d.decile}>
                        <td style={{ fontWeight: 600 }}>{d.decile}</td>
                        <td>{d.sales}</td>
                        <td>
                          <span className="ic-pct-badge">{d.salesShare}</span>
                        </td>
                        <td>{d.customerCount} customers</td>
                        <td>{d.avgTicket}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Quartile Cards */}
            {currentDetailItem.id === 'quartile' && (
              <div className="quartile-cards-preview">
                {[1, 2, 3, 4].map((q) => (
                  <div key={q} className="ic-q-card">
                    <span className="ic-q-label">Quartile {q}</span>
                    <h3 className="ic-q-sales">$312,500</h3>
                    <p className="ic-q-desc">25.0% of total sales contribution</p>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                      {q === 1 ? '12 Enterprise Accounts' : q === 2 ? '48 Growth Accounts' : q === 3 ? '134 Mid-Tier Accounts' : '518 Small Accounts'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Trend Segmentation */}
            {currentDetailItem.id === 'trend' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Sales Trend Analysis (Customer & Product Level)</span>
                  <span className="ic-table-meta">Increasing · Declining · Flat · Fluctuating</span>
                </div>
                <table className="ic-data-table">
                  <thead>
                    <tr>
                      <th>Customer Account</th>
                      <th>Product Line</th>
                      <th>Trend Status</th>
                      <th>Sales Delta</th>
                      <th>Q4 Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{t.customer}</td>
                        <td>{t.product}</td>
                        <td>
                          <span className={`ic-trend-badge ${t.trend.toLowerCase()}`}>
                            {t.trend}
                          </span>
                        </td>
                        <td style={{ color: t.delta.startsWith('+') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          {t.delta}
                        </td>
                        <td>{t.q4Sales}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Dominant Segmentation */}
            {currentDetailItem.id === 'dominant' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Product Dominance & Spreader Matrix</span>
                </div>
                <div style={{ padding: 20 }}>
                  <div className="dominance-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Trophy size={16} color="#ea580c" />
                        <strong style={{ fontSize: 14 }}>Dominant SKUs (High Concentration)</strong>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--apple-text-2)', marginBottom: 12 }}>
                        Top 2 products generate 72.4% of total ARR.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Cloud API Fabric:</span>
                          <strong>48.6% of sales</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Enterprise Mesh Connector:</span>
                          <strong>23.8% of sales</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Layers size={16} color="#0d9488" />
                        <strong style={{ fontSize: 14 }}>Spreaders (Diversified Accounts)</strong>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--apple-text-2)', marginBottom: 12 }}>
                        184 accounts purchase across 4+ product categories.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Avg SKUs per Spreader:</span>
                          <strong>4.3 SKUs</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Net Retention Rate (NRR):</span>
                          <strong>138%</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Look-Alike Segmentation */}
            {currentDetailItem.id === 'lookalike' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Look-Alike Prospects (Behavioral & Similarity Match)</span>
                  <span className="ic-table-meta">Derived from Top Decile Seed Accounts</span>
                </div>
                <table className="ic-data-table">
                  <thead>
                    <tr>
                      <th>Target Prospect</th>
                      <th>Similarity Score</th>
                      <th>Lookalike Seed</th>
                      <th>Est. Annual LTV</th>
                      <th>Key Affinity Attributes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lookAlikeData.map((l, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{l.targetProspect}</td>
                        <td>
                          <span className="ic-pct-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                            {l.matchScore} Match
                          </span>
                        </td>
                        <td>{l.seedLookalike}</td>
                        <td>{l.estLTV}</td>
                        <td style={{ fontSize: 12, color: 'var(--apple-text-2)' }}>{l.affinity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Combine Segmentation */}
            {currentDetailItem.id === 'combine' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Crosstab Visualization Across Multiple Segments</span>
                </div>
                <div style={{ padding: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginBottom: 16 }}>
                    Cross-tabulation comparing <strong>Decile Tiers</strong> against <strong>Trend Behavior</strong>:
                  </p>
                  <table className="ic-data-table">
                    <thead>
                      <tr>
                        <th>Decile Group</th>
                        <th>Increasing</th>
                        <th>Flat</th>
                        <th>Declining</th>
                        <th>Fluctuating</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Decile 1–2 (Top 20% Sales)</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>9 Accounts (75%)</td>
                        <td>2 Accounts</td>
                        <td style={{ color: '#dc2626' }}>1 Account</td>
                        <td>0 Accounts</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Decile 3–5 (Mid 30% Sales)</td>
                        <td style={{ color: '#16a34a' }}>42 Accounts</td>
                        <td>18 Accounts</td>
                        <td style={{ color: '#dc2626' }}>7 Accounts</td>
                        <td>0 Accounts</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Decile 6–10 (Tail 50% Sales)</td>
                        <td>120 Accounts</td>
                        <td>280 Accounts</td>
                        <td style={{ color: '#dc2626' }}>164 Accounts</td>
                        <td>25 Accounts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Custom Segmentation */}
            {currentDetailItem.id === 'custom' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Custom Segmentation & Filter Builder</span>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)', fontSize: 12.5 }}>
                      <strong>Filter:</strong> Sales &gt; $50,000
                    </div>
                    <div style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)', fontSize: 12.5 }}>
                      <strong>Region:</strong> North America &amp; EMEA
                    </div>
                    <div style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)', fontSize: 12.5 }}>
                      <strong>Contract:</strong> Annual Active
                    </div>
                    <button style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--apple-accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                      + Add Rule
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--apple-text-2)' }}>
                    Filtered Segment Audience: <strong>142 Customers</strong> ($1,840,000 total sales)
                  </p>
                </div>
              </div>
            )}

            {/* 8. Customer 360 */}
            {currentDetailItem.id === 'c360' && (
              <div className="detail-card-table-wrap">
                <div className="ic-table-header-title">
                  <span>Customer 360° Unified View</span>
                </div>
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)' }}>
                    <div style={{ fontSize: 12, color: 'var(--apple-text-3)', textTransform: 'uppercase' }}>Account Profile</div>
                    <h3 style={{ fontSize: 16, margin: '6px 0 2px' }}>Northwind Global Corp</h3>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Decile 1 · Top Contributor</div>
                    <div style={{ marginTop: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>ARR: <strong>$420,000</strong></div>
                      <div>Health Score: <strong style={{ color: '#16a34a' }}>98/100</strong></div>
                      <div>Trend: <strong style={{ color: '#16a34a' }}>+34.2% YoY</strong></div>
                    </div>
                  </div>

                  <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--apple-border)', background: 'var(--apple-surface)' }}>
                    <div style={{ fontSize: 12, color: 'var(--apple-text-3)', textTransform: 'uppercase' }}>Integrated Sources</div>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                      <div>✓ PostgreSQL Production Lake (Live CDC)</div>
                      <div>✓ Stripe Billing Invoices (Bi-directional)</div>
                      <div>✓ Salesforce CRM Pipelines (Synced)</div>
                      <div>✓ Zendesk Support Telemetry (Active)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* =========================================================
             EXACT SCREENSHOT LAYOUT
             ========================================================= */
          <motion.div
            key="hub-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={appleSpring}
            className="ingen-customer-hub"
          >
            {/* =========================================================
                SECTION 1: SEGMENTATIONS
                ========================================================= */}
            <div className="hub-section-card">
              <div className="hub-section-header">
                <div className="hub-section-icon-box orange">
                  <RotateCw size={18} strokeWidth={2.4} />
                </div>
                <div className="hub-section-titles">
                  <h2 className="hub-section-main-title">Segmentations</h2>
                  <p className="hub-section-main-subtitle">
                    Group customers by their sales contribution, trends and similarity
                  </p>
                </div>
              </div>

              <div className="hub-cards-grid">
                {segmentations.map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={tapGesture}
                      transition={appleSpring}
                      className="hub-card"
                      onClick={() => setActiveDetailId(item.id)}
                    >
                      <div className="hub-card-header">
                        <div
                          className="hub-card-icon-box"
                          style={{
                            backgroundColor: item.iconBg,
                            color: item.iconColor
                          }}
                        >
                          <Icon size={18} strokeWidth={1.8} />
                        </div>
                        <h3 className="hub-card-title">{item.title}</h3>
                      </div>
                      <p className="hub-card-desc">{item.desc}</p>
                      <div className="hub-card-footer">
                        <span>Analyze & Configure</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* =========================================================
                SECTION 2: CUSTOMER ANALYTICS
                ========================================================= */}
            <div className="hub-section-card" style={{ marginTop: 24 }}>
              <div className="hub-section-header">
                <div className="hub-section-icon-box teal">
                  <GitFork size={18} strokeWidth={2.4} />
                </div>
                <div className="hub-section-titles">
                  <h2 className="hub-section-main-title">Customer Analytics</h2>
                  <p className="hub-section-main-subtitle">
                    Analyze saved segmentations together, with filters or as a single customer view
                  </p>
                </div>
              </div>

              <div className="hub-cards-grid three-col">
                {analytics.map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={tapGesture}
                      transition={appleSpring}
                      className="hub-card"
                      onClick={() => setActiveDetailId(item.id)}
                    >
                      <div className="hub-card-header">
                        <div
                          className="hub-card-icon-box"
                          style={{
                            backgroundColor: item.iconBg,
                            color: item.iconColor
                          }}
                        >
                          <Icon size={18} strokeWidth={1.8} />
                        </div>
                        <h3 className="hub-card-title">{item.title}</h3>
                      </div>
                      <p className="hub-card-desc">{item.desc}</p>
                      <div className="hub-card-footer">
                        <span>Open Analytics</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
