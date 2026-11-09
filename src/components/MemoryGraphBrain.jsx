import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Brain,
  Sparkles,
  Search,
  Filter,
  Plus,
  Zap,
  Layers,
  Database,
  FileText,
  Bot,
  Activity,
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
  CheckCircle2,
  HelpCircle,
  Tag,
  Key
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function MemoryGraphBrain() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'entity', 'concept', 'decision', 'rule'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeViewMode, setActiveViewMode] = useState('2d') // '2d' | 'list'

  // Semantic Memory Knowledge Graph Nodes
  const nodes = [
    {
      id: 'node-core',
      label: 'Ingen Core Brain',
      type: 'core',
      x: 380,
      y: 220,
      color: '#ea580c',
      radius: 34,
      connections: ['node-c360', 'node-auth', 'node-pricing', 'node-retention', 'node-agent-router', 'node-snow'],
      description: 'Central associative memory layer connecting tenant entities, decision policies, and semantic embeddings.',
      recallConfidence: 99.8,
      lastReinforced: '3 mins ago'
    },
    {
      id: 'node-c360',
      label: 'Customer 360 Entity',
      type: 'entity',
      x: 180,
      y: 110,
      color: '#2563eb',
      radius: 26,
      connections: ['node-core', 'node-retention', 'node-snow'],
      description: 'Persistent schema representing cross-platform user identity, churn risk vectors, and LTV tiers.',
      recallConfidence: 96.4,
      lastReinforced: '12 mins ago'
    },
    {
      id: 'node-retention',
      label: 'Churn Risk Heuristic',
      type: 'rule',
      x: 120,
      y: 290,
      color: '#dc2626',
      radius: 24,
      connections: ['node-core', 'node-c360', 'node-pricing'],
      description: 'Decision heuristic: Accounts with >28% drop in API calls over 14 days auto-trigger high-priority CSM outreach.',
      recallConfidence: 94.2,
      lastReinforced: '45 mins ago'
    },
    {
      id: 'node-pricing',
      label: 'Decile Pricing Model',
      type: 'concept',
      x: 260,
      y: 370,
      color: '#16a34a',
      radius: 24,
      connections: ['node-core', 'node-retention'],
      description: 'Strict 10-tier partition policy enforcing minimum contract sizes and renewal margin floors.',
      recallConfidence: 91.5,
      lastReinforced: '2 hours ago'
    },
    {
      id: 'node-snow',
      label: 'Snowflake Schema Map',
      type: 'entity',
      x: 580,
      y: 110,
      color: '#0284c7',
      radius: 24,
      connections: ['node-core', 'node-c360', 'node-agent-router'],
      description: 'Semantic mapping of FACT_SALES and DIM_IDENTITY tables with clustering key rules for sub-second lookups.',
      recallConfidence: 98.1,
      lastReinforced: 'Yesterday'
    },
    {
      id: 'node-agent-router',
      label: 'Autonomous Agent Router',
      type: 'decision',
      x: 610,
      y: 280,
      color: '#9333ea',
      radius: 26,
      connections: ['node-core', 'node-snow', 'node-auth'],
      description: 'Task decomposition policy routing analytical queries to Ingen Optim and compliance queries to Ingen Tracker.',
      recallConfidence: 97.5,
      lastReinforced: '25 mins ago'
    },
    {
      id: 'node-auth',
      label: 'Multi-Tenant Zero-Trust Vault',
      type: 'rule',
      x: 480,
      y: 390,
      color: '#d97706',
      radius: 22,
      connections: ['node-core', 'node-agent-router'],
      description: 'Row-level security enforcement preventing cross-tenant vector contamination with AES-256 token hashing.',
      recallConfidence: 100,
      lastReinforced: 'Just now'
    }
  ]

  // Filter nodes
  const filteredNodes = nodes.filter((n) => {
    const matchesType = filterType === 'all' || n.type === filterType
    const matchesSearch =
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  // Selected node or default to core
  const activeNode = selectedNode || nodes[0]

  return (
    <div className="memory-graph-brain-container">
      {/* Top Brain Control Bar */}
      <div className="brain-control-bar">
        <div className="brain-title-group">
          <div className="brain-icon-box">
            <Brain size={20} color="#ea580c" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="brain-title">Memory Graph Brain</h2>
              <span className="brain-live-badge">
                <span className="brain-live-pulse" />
                Live Semantic Associative Memory
              </span>
            </div>
            <p className="brain-subtitle">
              Persistent cross-project knowledge graph connecting learned concepts, decision rules, and entity memories.
            </p>
          </div>
        </div>

        <div className="brain-actions-group">
          <div className="segmented-control">
            <button
              className={`segmented-btn ${activeViewMode === '2d' ? 'active' : ''}`}
              onClick={() => setActiveViewMode('2d')}
            >
              Interactive Graph (2D)
            </button>
            <button
              className={`segmented-btn ${activeViewMode === 'list' ? 'active' : ''}`}
              onClick={() => setActiveViewMode('list')}
            >
              Memory Ledger
            </button>
          </div>
          <button
            className="apple-button-secondary"
            onClick={() => alert('Memory Graph synchronized with all active project copilots')}
            title="Sync graph"
          >
            <RefreshCw size={13} />
            <span>Re-Index Brain</span>
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="brain-filter-strip">
        <div className="brain-filter-pills">
          {[
            { id: 'all', label: `All Memories (${nodes.length})` },
            { id: 'entity', label: 'Entities (2)' },
            { id: 'concept', label: 'Concepts (1)' },
            { id: 'decision', label: 'Decision Logic (1)' },
            { id: 'rule', label: 'Security & Rules (2)' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`brain-pill-btn ${filterType === tab.id ? 'active' : ''}`}
              onClick={() => setFilterType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-wrap" style={{ maxWidth: 260 }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search brain memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="apple-search-input"
          />
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="brain-main-stage">
        {activeViewMode === '2d' ? (
          <div className="brain-canvas-wrapper">
            {/* SVG Visual Neural Mesh */}
            <svg className="brain-svg-canvas" viewBox="0 0 760 480">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.15" />
                </linearGradient>
                <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background ambient neural glow */}
              <circle cx="380" cy="220" r="240" fill="url(#brainGlow)" />

              {/* Connections (Edges) */}
              {nodes.map((node) =>
                node.connections.map((targetId) => {
                  const target = nodes.find((n) => n.id === targetId)
                  if (!target || node.id > target.id) return null // avoid duplicate edges

                  const isConnectedToActive =
                    activeNode &&
                    (activeNode.id === node.id || activeNode.id === target.id)

                  return (
                    <line
                      key={`${node.id}-${target.id}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isConnectedToActive ? '#ea580c' : '#cbd5e1'}
                      strokeWidth={isConnectedToActive ? 2.2 : 1.2}
                      strokeDasharray={isConnectedToActive ? 'none' : '4,4'}
                      strokeOpacity={isConnectedToActive ? 0.85 : 0.6}
                      className={isConnectedToActive ? 'active-synapse' : ''}
                    />
                  )
                })
              )}

              {/* Nodes (Vertices) */}
              {filteredNodes.map((n) => {
                const isSelected = activeNode?.id === n.id
                return (
                  <g
                    key={n.id}
                    className="brain-node-group"
                    onClick={() => setSelectedNode(n)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Selected halo */}
                    {isSelected && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={n.radius + 8}
                        fill="none"
                        stroke={n.color}
                        strokeWidth="2"
                        strokeDasharray="3,3"
                        className="spinning"
                      />
                    )}

                    {/* Outer circle */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.radius}
                      fill="#ffffff"
                      stroke={isSelected ? n.color : '#cbd5e1'}
                      strokeWidth={isSelected ? 3 : 2}
                      filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))"
                    />

                    {/* Inner color center */}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.radius - 8}
                      fill={n.color}
                      fillOpacity={isSelected ? 0.9 : 0.18}
                    />

                    {/* Node icon / initials */}
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : n.color}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="var(--font-text)"
                    >
                      {n.type === 'core' ? '🧠' : n.type === 'rule' ? '🔒' : n.type === 'entity' ? '📦' : '⚡'}
                    </text>

                    {/* Node Text Label below */}
                    <text
                      x={n.x}
                      y={n.y + n.radius + 14}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="11.5"
                      fontWeight={isSelected ? '700' : '500'}
                      fontFamily="var(--font-text)"
                    >
                      {n.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            <div className="canvas-instruction-hint">
              <span>Click any neural node to inspect associative memory & decision pathways</span>
            </div>
          </div>
        ) : (
          /* List Mode */
          <div className="brain-memory-table">
            <div className="brain-table-header">
              <span>Memory Concept</span>
              <span>Category</span>
              <span>Recall Confidence</span>
              <span>Synaptic Links</span>
              <span>Last Reinforced</span>
            </div>
            {filteredNodes.map((n) => (
              <div
                key={n.id}
                className={`brain-table-row ${activeNode?.id === n.id ? 'active' : ''}`}
                onClick={() => setSelectedNode(n)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: n.color
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{n.label}</span>
                </div>
                <span className="brain-tag-pill">{n.type.toUpperCase()}</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>{n.recallConfidence}%</span>
                <span>{n.connections.length} nodes</span>
                <span style={{ color: '#64748b' }}>{n.lastReinforced}</span>
              </div>
            ))}
          </div>
        )}

        {/* Right Memory Inspector Drawer */}
        <div className="brain-inspector-panel">
          <div className="inspector-header">
            <div className="inspector-badge-row">
              <span
                className="brain-tag-pill"
                style={{ backgroundColor: `${activeNode.color}15`, color: activeNode.color }}
              >
                {activeNode.type.toUpperCase()} MEMORY
              </span>
              <span className="recall-confidence-badge">
                <CheckCircle2 size={12} color="#16a34a" />
                {activeNode.recallConfidence}% Confidence
              </span>
            </div>
            <h3 className="inspector-title">{activeNode.label}</h3>
          </div>

          <div className="inspector-body">
            <div className="inspector-field">
              <label className="inspector-label">Associative Memory Description</label>
              <p className="inspector-text">{activeNode.description}</p>
            </div>

            <div className="inspector-field">
              <label className="inspector-label">Connected Neural Synapses ({activeNode.connections.length})</label>
              <div className="synapse-pill-list">
                {activeNode.connections.map((cId) => {
                  const target = nodes.find((n) => n.id === cId)
                  if (!target) return null
                  return (
                    <button
                      key={cId}
                      className="synapse-pill-btn"
                      onClick={() => setSelectedNode(target)}
                    >
                      <span className="synapse-dot" style={{ backgroundColor: target.color }} />
                      <span>{target.label}</span>
                      <ArrowRight size={11} color="#64748b" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="inspector-field">
              <label className="inspector-label">Reinforcement Telemetry</label>
              <div className="telemetry-stat-row">
                <div className="stat-box">
                  <span className="stat-val">{activeNode.recallConfidence}%</span>
                  <span className="stat-lbl">Recall Score</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val">{activeNode.connections.length}</span>
                  <span className="stat-lbl">Synaptic Edges</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val">AES-256</span>
                  <span className="stat-lbl">Vector Masking</span>
                </div>
              </div>
            </div>

            <div className="inspector-note-box">
              <Zap size={14} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                This memory node is dynamically consulted whenever you execute slash commands (<code>/ingendata</code>, <code>/optim</code>, <code>/customer</code>) or run agent prompts.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
