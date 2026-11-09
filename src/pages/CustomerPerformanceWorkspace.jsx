import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  FileText,
  Files,
  Database,
  FolderArchive,
  CheckCircle2,
  Share2,
  MoreHorizontal,
  Play,
  RotateCcw,
  Sparkles,
  Paperclip,
  ArrowUp,
  Download,
  TrendingUp,
  Compass,
  MessageSquare,
  Copy,
  Plus,
  X,
  ChevronDown,
  Layers,
  BarChart2,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function CustomerPerformanceWorkspace() {
  const [activeTab, setActiveTab] = useState('notebook') // 'notebook' | 'files' | 'data' | 'assets'
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm-1',
      sender: 'user',
      time: '1:58 PM',
      text: 'Analyze the customer performance for Q4, show key metrics, trend and insights.'
    },
    {
      id: 'm-2',
      sender: 'agent',
      time: '1:58 PM',
      text: "I've analyzed the customer performance for Q4. Here are the key findings:",
      bullets: [
        'Loaded and processed customer sales data (1,200 customers)',
        'Calculated key performance metrics',
        'Analyzed sales trend and segment contribution',
        'Generated actionable insights'
      ],
      takeaways: {
        totalSales: '₹27.35 Cr (↑ +14.2% QoQ)',
        activeCustomers: '1,200 (↑ +6.8%)',
        retentionRate: '84.3% (↑ +3.1 pp)',
        topSegment: 'Hospital segment contributes the highest share (42.6%).',
        overall: 'Overall performance shows a positive growth trend in Q4.'
      },
      footerNote:
        'The detailed analysis, charts and data are added to the notebook on the left. Let me know if you\'d like a deeper drill-down (e.g., by region, product or customer group).'
    }
  ])

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = {
      id: `m-${Date.now()}`,
      sender: 'user',
      time: 'Just now',
      text: chatInput
    }

    setChatMessages((prev) => [...prev, userMsg])
    const currentInput = chatInput
    setChatInput('')

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: 'agent',
          time: 'Just now',
          text: `Analyzing: "${currentInput}". Updated notebook cells with filtered parameters.`,
          bullets: ['Re-indexed segment criteria', 'Recalculated margin variance and risk scores'],
          footerNote: 'Updated live in the left notebook canvas.'
        }
      ])
    }, 600)
  }

  return (
    <div className="cp-workspace-root">
      {/* =========================================================
          TOP BREADCRUMB / ACTION BAR
          ========================================================= */}
      <div className="cp-top-bar">
        <div className="cp-breadcrumbs">
          <span className="cp-crumb-root">Workspace</span>
          <span className="cp-crumb-arrow">›</span>
          <span className="cp-crumb-active">Customer Performance Analysis</span>
        </div>

        <div className="cp-top-actions">
          <button className="cp-action-btn" onClick={() => alert('Sharing workspace link...')}>
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button className="cp-icon-btn" onClick={() => alert('More options')}>
            <MoreHorizontal size={16} />
          </button>
          <button className="cp-run-all-btn" onClick={() => alert('Re-running all cells...')}>
            <Play size={13} fill="#ffffff" />
            <span>Run All</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TWO-COLUMN MAIN BODY: LEFT NOTEBOOK CANVAS & RIGHT AGENT CHAT
          ========================================================= */}
      <div className="cp-main-grid">
        {/* =========================================================
            LEFT COLUMN: NOTEBOOK CANVAS
            ========================================================= */}
        <div className="cp-notebook-canvas">
          {/* Sub Navigation Tabs */}
          <div className="cp-canvas-header">
            <div className="cp-canvas-tabs">
              <button
                className={`cp-canvas-tab ${activeTab === 'notebook' ? 'active' : ''}`}
                onClick={() => setActiveTab('notebook')}
              >
                <FileText size={15} />
                <span>Notebook</span>
              </button>
              <button
                className={`cp-canvas-tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                <Files size={15} />
                <span>Files</span>
              </button>
              <button
                className={`cp-canvas-tab ${activeTab === 'data' ? 'active' : ''}`}
                onClick={() => setActiveTab('data')}
              >
                <Database size={15} />
                <span>Data</span>
              </button>
              <button
                className={`cp-canvas-tab ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => setActiveTab('assets')}
              >
                <FolderArchive size={15} />
                <span>Assets</span>
              </button>
            </div>

            <div className="cp-status-pill">
              <span className="status-dot green" />
              <span>Running complete</span>
              <ChevronDown size={13} style={{ marginLeft: 3 }} />
            </div>
          </div>

          <div className="cp-canvas-scroll">
            {/* Title Header Card */}
            <div className="cp-doc-title-block">
              <div className="cp-doc-icon-wrap">
                <FileText size={22} color="#7c3aed" />
              </div>
              <div>
                <h1 className="cp-doc-title">Customer Performance Analysis</h1>
                <p className="cp-doc-meta">Created from your query · Nov 4, 2026, 1:58 PM</p>
              </div>
            </div>

            {/* In [1]: User Query Cell */}
            <div className="cp-cell-block">
              <div className="cp-cell-header">
                <div className="cp-cell-label">
                  <span className="in-tag">In [1]</span>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span className="cell-name">User Query</span>
                  <ChevronDown size={12} color="#94a3b8" />
                </div>
              </div>
              <div className="cp-query-bubble">
                Analyze the customer performance for Q4, show key metrics, trend and insights.
              </div>
            </div>

            {/* In [2]: Data Loading Python Code Cell */}
            <div className="cp-cell-block">
              <div className="cp-cell-header">
                <div className="cp-cell-label">
                  <span className="in-tag">In [2]</span>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span className="cell-name">Data Loading</span>
                  <ChevronDown size={12} color="#94a3b8" />
                </div>
                <div className="cp-cell-actions">
                  <Play size={13} className="cell-action-icon" />
                  <Plus size={13} className="cell-action-icon" />
                  <X size={13} className="cell-action-icon" />
                </div>
              </div>

              {/* Code Box */}
              <div className="cp-code-editor">
                <div className="code-line">
                  <span className="kw">import</span> pandas <span className="kw">as</span> pd
                </div>
                <div className="code-line">
                  df = pd.read_csv(<span className="str">"customer_sales_q4.csv"</span>)
                </div>
                <div className="code-line">df.head()</div>
              </div>

              <div className="cp-cell-footer-stat">
                <CheckCircle2 size={12} color="#16a34a" />
                <span>Executed · 0.8 s</span>
              </div>

              {/* Out [2]: Customer Data Preview Table */}
              <div className="cp-out-wrapper">
                <div className="cp-out-label-row">
                  <span className="out-tag">Out [2]</span>
                  <Database size={13} color="#64748b" />
                  <span className="out-name">Customer data (preview)</span>
                </div>

                <div className="cp-table-container">
                  <table className="cp-data-table">
                    <thead>
                      <tr>
                        <th>customer_id</th>
                        <th>customer_name</th>
                        <th>segment</th>
                        <th>sales</th>
                        <th>growth_%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>C001</td>
                        <td style={{ fontWeight: 600 }}>HealthPlus</td>
                        <td>Hospital</td>
                        <td>12,48,000</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>18.4</td>
                      </tr>
                      <tr>
                        <td>C002</td>
                        <td style={{ fontWeight: 600 }}>MediCare</td>
                        <td>Clinic</td>
                        <td>8,72,000</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>12.1</td>
                      </tr>
                      <tr>
                        <td>C003</td>
                        <td style={{ fontWeight: 600 }}>LifeWell</td>
                        <td>Pharmacy</td>
                        <td>6,15,000</td>
                        <td style={{ color: '#dc2626', fontWeight: 600 }}>-2.8</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="cp-table-footer">3 of 1,200 rows</div>
                </div>
              </div>
            </div>

            {/* In [3]: Performance Analysis Cell with Metrics & Charts */}
            <div className="cp-cell-block">
              <div className="cp-cell-header">
                <div className="cp-cell-label">
                  <span className="in-tag">In [3]</span>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span className="cell-name">Performance Analysis</span>
                  <ChevronDown size={12} color="#94a3b8" />
                </div>
                <div className="cp-cell-footer-stat" style={{ margin: 0 }}>
                  <CheckCircle2 size={12} color="#16a34a" />
                  <span>Executed · 2.3 s</span>
                </div>
              </div>

              {/* Out [3]: Key Metrics & Charts */}
              <div className="cp-out-wrapper">
                <div className="cp-out-label-row">
                  <span className="out-tag">Out [3]</span>
                  <BarChart2 size={13} color="#64748b" />
                  <span className="out-name">Key Metrics (Q4)</span>
                </div>

                {/* 4 Cards Grid exactly like screenshot */}
                <div className="cp-metrics-quad">
                  <div className="cp-metric-card">
                    <div className="cp-metric-top">
                      <div className="cp-metric-icon-box purple">
                        <Layers size={14} />
                      </div>
                      <span className="cp-metric-label">Total Sales</span>
                    </div>
                    <div className="cp-metric-value">₹27.35 Cr</div>
                    <span className="cp-metric-growth">↑ +14.2% QoQ</span>
                  </div>

                  <div className="cp-metric-card">
                    <div className="cp-metric-top">
                      <div className="cp-metric-icon-box blue">
                        <Users size={14} />
                      </div>
                      <span className="cp-metric-label">Active Customers</span>
                    </div>
                    <div className="cp-metric-value">1,200</div>
                    <span className="cp-metric-growth">↑ +6.8%</span>
                  </div>

                  <div className="cp-metric-card">
                    <div className="cp-metric-top">
                      <div className="cp-metric-icon-box green">
                        <BarChart2 size={14} />
                      </div>
                      <span className="cp-metric-label">Avg. Order Value</span>
                    </div>
                    <div className="cp-metric-value">₹2.28 L</div>
                    <span className="cp-metric-growth">↑ +7.9%</span>
                  </div>

                  <div className="cp-metric-card">
                    <div className="cp-metric-top">
                      <div className="cp-metric-icon-box orange">
                        <Activity size={14} />
                      </div>
                      <span className="cp-metric-label">Retention Rate</span>
                    </div>
                    <div className="cp-metric-value">84.3%</div>
                    <span className="cp-metric-growth">↑ +3.1 pp</span>
                  </div>
                </div>

                {/* Charts Duo: Sales Trend & Sales by Segment */}
                <div className="cp-charts-duo">
                  {/* Chart 1: Sales Trend */}
                  <div className="cp-chart-card">
                    <div className="cp-chart-header">
                      <span className="cp-chart-title">Sales Trend</span>
                    </div>

                    <div className="cp-chart-body">
                      {/* SVG Line Graph matching screenshot */}
                      <svg viewBox="0 0 320 120" className="cp-svg-trend">
                        <defs>
                          <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="40" y1="15" x2="310" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="45" x2="310" y2="45" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="75" x2="310" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="40" y1="105" x2="310" y2="105" stroke="#f1f5f9" strokeWidth="1" />

                        {/* Y-axis labels */}
                        <text x="10" y="20" fill="#94a3b8" fontSize="9">8 Cr</text>
                        <text x="10" y="50" fill="#94a3b8" fontSize="9">6 Cr</text>
                        <text x="10" y="80" fill="#94a3b8" fontSize="9">4 Cr</text>
                        <text x="10" y="108" fill="#94a3b8" fontSize="9">2 Cr</text>

                        {/* Area Fill */}
                        <path
                          d="M 50 96 C 90 92, 130 84, 180 78 C 220 72, 260 62, 300 46 L 300 110 L 50 110 Z"
                          fill="url(#trendGrad)"
                        />

                        {/* Line */}
                        <path
                          d="M 50 96 C 90 92, 130 84, 180 78 C 220 72, 260 62, 300 46"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Points */}
                        <circle cx="50" cy="96" r="3.5" fill="#6366f1" />
                        <circle cx="100" cy="90" r="3.5" fill="#6366f1" />
                        <circle cx="150" cy="82" r="3.5" fill="#6366f1" />
                        <circle cx="200" cy="74" r="3.5" fill="#6366f1" />
                        <circle cx="250" cy="65" r="3.5" fill="#6366f1" />
                        <circle cx="300" cy="46" r="3.5" fill="#6366f1" />

                        {/* X-axis labels */}
                        <text x="44" y="118" fill="#94a3b8" fontSize="9">Jul</text>
                        <text x="92" y="118" fill="#94a3b8" fontSize="9">Aug</text>
                        <text x="142" y="118" fill="#94a3b8" fontSize="9">Sep</text>
                        <text x="192" y="118" fill="#94a3b8" fontSize="9">Oct</text>
                        <text x="242" y="118" fill="#94a3b8" fontSize="9">Nov</text>
                        <text x="292" y="118" fill="#94a3b8" fontSize="9">Dec</text>
                      </svg>
                    </div>
                  </div>

                  {/* Chart 2: Sales by Segment Donut Chart */}
                  <div className="cp-chart-card">
                    <div className="cp-chart-header">
                      <span className="cp-chart-title">Sales by Segment</span>
                    </div>

                    <div className="cp-donut-wrapper">
                      <div className="cp-donut-graphic">
                        {/* CSS Conic Gradient Donut matching exact colors */}
                        <div className="cp-donut-circle">
                          <div className="cp-donut-hole">
                            <span className="cp-donut-center-val">₹27.35 Cr</span>
                            <span className="cp-donut-center-sub">Total Sales</span>
                          </div>
                        </div>
                      </div>

                      {/* Donut Legend */}
                      <div className="cp-donut-legend">
                        <div className="legend-row">
                          <span className="legend-dot" style={{ background: '#3b82f6' }} />
                          <span className="legend-label">Hospital</span>
                          <span className="legend-pct">42.6%</span>
                        </div>
                        <div className="legend-row">
                          <span className="legend-dot" style={{ background: '#8b5cf6' }} />
                          <span className="legend-label">Clinic</span>
                          <span className="legend-pct">28.9%</span>
                        </div>
                        <div className="legend-row">
                          <span className="legend-dot" style={{ background: '#f59e0b' }} />
                          <span className="legend-label">Pharmacy</span>
                          <span className="legend-pct">17.4%</span>
                        </div>
                        <div className="legend-row">
                          <span className="legend-dot" style={{ background: '#94a3b8' }} />
                          <span className="legend-label">Other</span>
                          <span className="legend-pct">11.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: AGENT CHAT
            ========================================================= */}
        <div className="cp-agent-chat-panel">
          {/* Header */}
          <div className="cp-chat-header">
            <div className="cp-chat-header-left">
              <div className="cp-chat-icon-box">
                <MessageSquare size={16} color="#7c3aed" />
              </div>
              <div>
                <h3 className="cp-chat-title">Agent Chat</h3>
                <p className="cp-chat-subtitle">Discuss, refine and explore the analysis</p>
              </div>
            </div>
            <div className="cp-chat-header-actions">
              <button className="cp-icon-btn-subtle" title="Docking">
                <Layers size={14} />
              </button>
              <button className="cp-icon-btn-subtle" title="Options">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="cp-chat-scroll">
            {chatMessages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="cp-msg-user-wrap">
                    <div className="cp-msg-user-meta">
                      <span className="cp-sender-tag">You</span>
                      <span className="cp-time-tag">{msg.time}</span>
                      <div className="cp-avatar-mini">SD</div>
                    </div>
                    <div className="cp-msg-user-bubble">{msg.text}</div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className="cp-msg-agent-wrap">
                  <div className="cp-msg-agent-meta">
                    <Sparkles size={14} color="#ea580c" />
                    <span className="cp-sender-tag" style={{ color: '#0f172a' }}>
                      IngenSpark Agent
                    </span>
                    <span className="cp-time-tag">{msg.time}</span>
                  </div>

                  <div className="cp-msg-agent-body">
                    <p className="agent-lead-text">{msg.text}</p>

                    {msg.bullets && (
                      <ul className="agent-bullets-list">
                        {msg.bullets.map((b, i) => (
                          <li key={i}>
                            <CheckCircle2 size={13} color="#16a34a" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {msg.takeaways && (
                      <div className="agent-takeaways-block">
                        <div className="takeaways-heading">
                          <BarChart2 size={14} color="#7c3aed" />
                          <span>Key Takeaways</span>
                        </div>
                        <ul className="takeaways-list">
                          <li>
                            Total sales: <strong>{msg.takeaways.totalSales}</strong>
                          </li>
                          <li>
                            Active customers: <strong>{msg.takeaways.activeCustomers}</strong>
                          </li>
                          <li>
                            Retention rate: <strong>{msg.takeaways.retentionRate}</strong>
                          </li>
                          <li>{msg.takeaways.topSegment}</li>
                          <li>{msg.takeaways.overall}</li>
                        </ul>
                      </div>
                    )}

                    {msg.footerNote && <p className="agent-footer-note">{msg.footerNote}</p>}

                    {/* Quick Suggestion Chips */}
                    <div className="agent-action-chips">
                      <button
                        className="agent-chip-btn"
                        onClick={() => setChatInput('Drill down by region')}
                      >
                        <Compass size={12} color="#7c3aed" />
                        <span>Drill down by region</span>
                      </button>
                      <button
                        className="agent-chip-btn"
                        onClick={() => setChatInput('Top growing customers')}
                      >
                        <TrendingUp size={12} color="#7c3aed" />
                        <span>Top growing customers</span>
                      </button>
                      <button
                        className="agent-chip-btn"
                        onClick={() => alert('Exporting report as PDF/CSV...')}
                      >
                        <Download size={12} color="#7c3aed" />
                        <span>Export report</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Input */}
          <form className="cp-chat-input-bar" onSubmit={handleSendChat}>
            <button type="button" className="chat-attach-btn" title="Attach file">
              <Paperclip size={15} color="#94a3b8" />
            </button>
            <input
              type="text"
              placeholder="Ask a follow-up question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-text-input"
            />
            <button
              type="submit"
              className={`chat-submit-btn ${chatInput.trim() ? 'active' : ''}`}
              disabled={!chatInput.trim()}
            >
              <ArrowUp size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
