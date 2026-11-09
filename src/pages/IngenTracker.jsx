import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  BarChart2,
  LineChart as LineChartIcon,
  PieChart,
  Activity,
  Plus,
  Save,
  Trash2,
  FolderOpen,
  ChevronDown,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
const tapGesture = { scale: 0.98 }

export default function IngenTracker() {
  const [selectedProject, setSelectedProject] = useState('First Project')
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

  // Dashboards list
  const [dashboards, setDashboards] = useState([
    { id: 'dash-1', name: 'Executive Summary & Revenue' },
    { id: 'dash-2', name: 'Customer Decile & Segmentations' },
    { id: 'dash-3', name: 'A/B Experiment & MMM Uplift' }
  ])
  const [activeDashboardId, setActiveDashboardId] = useState('dash-1')

  // Charts stored per dashboard
  const [charts, setCharts] = useState([
    {
      id: 'chart-1',
      dashboardId: 'dash-1',
      title: 'Decile Sales Contribution (Top 10 Deciles)',
      type: 'bar',
      source: 'Ingen Customer',
      color: '#ea580c',
      data: [
        { label: 'D1', value: 125, share: '10%' },
        { label: 'D2', value: 125, share: '10%' },
        { label: 'D3', value: 125, share: '10%' },
        { label: 'D4', value: 125, share: '10%' },
        { label: 'D5', value: 125, share: '10%' },
        { label: 'D6', value: 125, share: '10%' },
        { label: 'D7', value: 125, share: '10%' },
        { label: 'D8', value: 125, share: '10%' },
        { label: 'D9', value: 125, share: '10%' },
        { label: 'D10', value: 125, share: '10%' }
      ]
    },
    {
      id: 'chart-2',
      dashboardId: 'dash-1',
      title: 'Monthly Recurring Revenue Trend (MRR)',
      type: 'line',
      source: 'Customer 360',
      color: '#2563eb',
      data: [
        { label: 'Jan', value: 180 },
        { label: 'Feb', value: 210 },
        { label: 'Mar', value: 245 },
        { label: 'Apr', value: 290 },
        { label: 'May', value: 340 },
        { label: 'Jun', value: 420 }
      ]
    },
    {
      id: 'chart-3',
      dashboardId: 'dash-1',
      title: 'Marketing Mix Budget Share (MMM)',
      type: 'donut',
      source: 'Ingen Optim',
      color: '#16a34a',
      data: [
        { label: 'Paid Search (Google)', value: 38.4, color: '#ea580c' },
        { label: 'Paid Social (Meta)', value: 26.2, color: '#2563eb' },
        { label: 'Organic & SEO', value: 18.9, color: '#16a34a' },
        { label: 'Partner Affiliates', value: 12.1, color: '#8b5cf6' },
        { label: 'Direct & Other', value: 4.4, color: '#64748b' }
      ]
    },
    {
      id: 'chart-4',
      dashboardId: 'dash-1',
      title: 'A/B Test Conversion Lift',
      type: 'metric',
      source: 'Ingen Optim A/B',
      color: '#ea580c',
      metricValue: '+18.4%',
      metricSub: 'Statistically Significant (p < 0.001)',
      impact: '+$142,000 / mo incremental ARR'
    }
  ])

  // Chart Creator Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [newChartTitle, setNewChartTitle] = useState('New Custom Metric Chart')
  const [newChartType, setNewChartType] = useState('bar') // 'bar' | 'line' | 'donut' | 'metric'
  const [newChartSource, setNewChartSource] = useState('Ingen Customer')
  const [newChartColor, setNewChartColor] = useState('#ea580c')
  const [saveToast, setSaveToast] = useState(false)

  const activeCharts = charts.filter((c) => c.dashboardId === activeDashboardId)

  const handleSaveDashboard = () => {
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2400)
  }

  const handleAddChart = (e) => {
    e.preventDefault()
    const newWidget = {
      id: `chart-${Date.now()}`,
      dashboardId: activeDashboardId,
      title: newChartTitle || 'Custom Chart',
      type: newChartType,
      source: newChartSource,
      color: newChartColor,
      data:
        newChartType === 'donut'
          ? [
              { label: 'Segment Alpha', value: 45, color: newChartColor },
              { label: 'Segment Beta', value: 35, color: '#2563eb' },
              { label: 'Segment Gamma', value: 20, color: '#16a34a' }
            ]
          : [
              { label: 'Q1', value: 120 },
              { label: 'Q2', value: 190 },
              { label: 'Q3', value: 280 },
              { label: 'Q4', value: 360 }
            ],
      metricValue: newChartType === 'metric' ? '+24.6%' : undefined,
      metricSub: newChartType === 'metric' ? 'Measured across active accounts' : undefined
    }

    setCharts((prev) => [...prev, newWidget])
    setModalOpen(false)
    setNewChartTitle('New Custom Metric Chart')
  }

  const handleDeleteChart = (chartId) => {
    setCharts((prev) => prev.filter((c) => c.id !== chartId))
  }

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
          <span className="ic-tag-pill" style={{ background: '#fef2f2', color: '#ea580c' }}>
            Chart &amp; Dashboard Creator
          </span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '20px 0 20px',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--apple-text-1)', marginBottom: 4 }}>
            Chart &amp; Dashboard Creator
          </h1>
          <p style={{ fontSize: 13, color: 'var(--apple-text-2)' }}>
            Build, customize, and save custom analytics visualizations and metric dashboards.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            whileTap={tapGesture}
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#ea580c',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>Create Chart</span>
          </motion.button>

          <motion.button
            whileTap={tapGesture}
            onClick={handleSaveDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid var(--apple-border)',
              background: 'var(--apple-surface)',
              color: 'var(--apple-text-1)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Save size={14} />
            <span>Save Dashboard</span>
          </motion.button>
        </div>
      </div>

      {/* Save Notification Toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              color: '#15803d',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16
            }}
          >
            <CheckCircle2 size={16} color="#16a34a" />
            <span>Dashboard layout and charts successfully saved to project!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Tabs Selector */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--apple-border)', paddingBottom: 10, marginBottom: 24 }}>
        {dashboards.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDashboardId(d.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeDashboardId === d.id ? 'var(--apple-text-1)' : 'transparent',
              color: activeDashboardId === d.id ? '#ffffff' : 'var(--apple-text-2)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Grid of Interactive Chart Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        {activeCharts.map((ch) => (
          <motion.div
            key={ch.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={appleSpring}
            style={{
              borderRadius: 16,
              border: '1px solid var(--apple-border)',
              background: 'var(--apple-surface)',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Chart Card Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--apple-text-3)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {ch.source} · {ch.type.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--apple-text-1)', marginTop: 3 }}>
                    {ch.title}
                  </h3>
                </div>
                <button
                  onClick={() => handleDeleteChart(ch.id)}
                  title="Remove chart"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Chart Visualizations */}
              {ch.type === 'bar' && (
                <div style={{ margin: '18px 0 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: 130, gap: 8, paddingBottom: 6 }}>
                    {ch.data?.map((b, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${(b.value / 140) * 100}%`,
                            backgroundColor: ch.color,
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease'
                          }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--apple-text-3)', marginTop: 6 }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ch.type === 'line' && (
                <div style={{ margin: '18px 0 10px' }}>
                  <svg width="100%" height="120" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={ch.color}
                      strokeWidth="3"
                      points="10,80 60,65 120,50 180,38 240,25 290,10"
                    />
                    {[
                      { x: 10, y: 80 },
                      { x: 60, y: 65 },
                      { x: 120, y: 50 },
                      { x: 180, y: 38 },
                      { x: 240, y: 25 },
                      { x: 290, y: 10 }
                    ].map((pt, idx) => (
                      <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke={ch.color} strokeWidth="2.5" />
                    ))}
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--apple-text-3)', marginTop: 6 }}>
                    {ch.data?.map((d, i) => <span key={i}>{d.label}</span>)}
                  </div>
                </div>
              )}

              {ch.type === 'donut' && (
                <div style={{ margin: '16px 0 10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ch.data?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color }} />
                          <span style={{ color: 'var(--apple-text-1)' }}>{item.label}</span>
                        </div>
                        <strong style={{ color: 'var(--apple-text-1)' }}>{item.value}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ch.type === 'metric' && (
                <div style={{ margin: '20px 0 14px' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#16a34a' }}>
                    {ch.metricValue}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--apple-text-1)', marginTop: 4 }}>
                    {ch.metricSub}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--apple-text-3)', marginTop: 2 }}>
                    {ch.impact}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: 10, marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--apple-text-3)' }}>
              <span>Live Synced · Auto-update</span>
              <span style={{ color: '#ea580c', fontWeight: 600 }}>Interactive</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CREATE CHART MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={appleSpring}
              style={{
                width: '100%',
                maxWidth: 500,
                borderRadius: 18,
                background: 'var(--apple-surface-card)',
                border: '1px solid var(--apple-border)',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-popover)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-text-1)' }}>
                  Create New Chart Widget
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apple-text-3)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddChart} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                    Chart Title *
                  </label>
                  <input
                    type="text"
                    value={newChartTitle}
                    onChange={(e) => setNewChartTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--apple-border)',
                      background: 'var(--apple-bg)',
                      color: 'var(--apple-text-1)',
                      fontSize: 13
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                    Chart Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { id: 'bar', label: 'Bar', icon: BarChart2 },
                      { id: 'line', label: 'Line', icon: LineChartIcon },
                      { id: 'donut', label: 'Donut', icon: PieChart },
                      { id: 'metric', label: 'KPI', icon: Activity }
                    ].map((t) => {
                      const Icon = t.icon
                      const isSelected = newChartType === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewChartType(t.id)}
                          style={{
                            padding: '8px',
                            borderRadius: 8,
                            border: isSelected ? '2px solid #ea580c' : '1px solid var(--apple-border)',
                            background: isSelected ? 'rgba(234, 88, 12, 0.08)' : 'var(--apple-bg)',
                            color: isSelected ? '#ea580c' : 'var(--apple-text-1)',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Icon size={16} />
                          <span>{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                    Data Source
                  </label>
                  <select
                    value={newChartSource}
                    onChange={(e) => setNewChartSource(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--apple-border)',
                      background: 'var(--apple-bg)',
                      color: 'var(--apple-text-1)',
                      fontSize: 13
                    }}
                  >
                    <option value="Ingen Customer">Ingen Customer (Deciles &amp; Segments)</option>
                    <option value="Ingen Optim">Ingen Optim (A/B Tests &amp; MMM)</option>
                    <option value="Customer 360">Customer 360 Graph</option>
                    <option value="Ingen Connect">Ingen Connect (Live CDC)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                    Color Palette
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['#ea580c', '#2563eb', '#16a34a', '#8b5cf6'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewChartColor(c)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: newChartColor === c ? '3px solid #ffffff' : 'none',
                          boxShadow: newChartColor === c ? '0 0 0 2px #ea580c' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--apple-border)',
                      background: 'transparent',
                      color: 'var(--apple-text-2)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#ea580c',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Add to Dashboard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
