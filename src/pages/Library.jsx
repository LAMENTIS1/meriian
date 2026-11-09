import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Sparkles,
  FileCode,
  FileText,
  FileSpreadsheet,
  Presentation,
  Terminal,
  Cpu,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  MoreVertical,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Wand2,
  Bot,
  Zap,
  Code2,
  Box,
  Compass,
  Brain
} from 'lucide-react'
import MemoryGraphBrain from '../components/MemoryGraphBrain'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
const tapGesture = { scale: 0.98 }

export default function Library({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('all') // 'all', 'folders', 'skills', 'artifacts'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedItemDetail, setSelectedItemDetail] = useState(null)

  // 1. Sub-folders
  const subFolders = [
    {
      id: 'f-reports',
      name: 'Executive & Board Reports',
      count: 8,
      updated: '2 hours ago',
      category: 'Reports',
      color: '#ea580c',
      bgLight: '#fff7ed',
      items: [
        { name: 'Q4 Board Executive Deck.pptx', type: 'deck', size: '12.4 MB', updated: 'Today' },
        { name: 'FY26 Revenue Variance Analysis.xlsx', type: 'sheet', size: '4.8 MB', updated: 'Yesterday' }
      ]
    },
    {
      id: 'f-segments',
      name: 'Customer Segmentation Runs',
      count: 14,
      updated: 'Yesterday',
      category: 'Analytics',
      color: '#2563eb',
      bgLight: '#eff6ff',
      items: [
        { name: 'Decile Sales Tier Snapshot.json', type: 'code', size: '2.1 MB', updated: 'Yesterday' },
        { name: 'Quartile Churn Risk Cohorts.csv', type: 'sheet', size: '8.4 MB', updated: 'Nov 3' }
      ]
    },
    {
      id: 'f-marketing',
      name: 'Marketing Mix Models (MMM)',
      count: 6,
      updated: '3 days ago',
      category: 'Marketing',
      color: '#16a34a',
      bgLight: '#f0fdf4',
      items: [
        { name: 'Google Ads ROAS Contribution.pdf', type: 'doc', size: '3.2 MB', updated: 'Nov 2' },
        { name: 'Budget Allocation Sensitivity.csv', type: 'sheet', size: '1.8 MB', updated: 'Oct 30' }
      ]
    },
    {
      id: 'f-prompts',
      name: 'Agent Reasoner Workspaces',
      count: 19,
      updated: '1 hour ago',
      category: 'AI Workspaces',
      color: '#9333ea',
      bgLight: '#faf5ff',
      items: [
        { name: 'SQL Query Tuning Scratchpad.sql', type: 'code', size: '450 KB', updated: '1 hour ago' },
        { name: 'Multi-Agent Support Routing Audit.log', type: 'doc', size: '1.4 MB', updated: 'Today' }
      ]
    }
  ]

  // 2. Skills
  const skills = [
    {
      id: 'sk-1',
      name: 'Marketing Mix Modeler (MMM)',
      description: 'Statistical Bayesian regression analyzing ad spend elasticity and optimal budget allocation across channels.',
      category: 'Optimization Skill',
      version: 'v2.4',
      author: 'Ingen Core',
      tags: ['MMM', 'Bayesian', 'Budgeting'],
      icon: Sparkles,
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      status: 'Active'
    },
    {
      id: 'sk-2',
      name: 'Decile & Quartile Partition Engine',
      description: 'Splits customer population into strictly proportional 10% and 25% revenue tiers with ticket concentration indices.',
      category: 'Segmentation Skill',
      version: 'v1.8',
      author: 'Ingen Core',
      tags: ['Deciles', 'Quartiles', 'Revenue'],
      icon: Wand2,
      iconColor: '#ea580c',
      iconBg: '#fff7ed',
      status: 'Active'
    },
    {
      id: 'sk-3',
      name: 'Look-Alike Vector Clustering',
      description: 'Deep neural similarity projection matching new prospective accounts to highest-LTV enterprise customer vectors.',
      category: 'AI Skill',
      version: 'v3.1',
      author: 'Vector Ops',
      tags: ['Embeddings', 'Clustering', 'Look-Alike'],
      icon: Bot,
      iconColor: '#9333ea',
      iconBg: '#faf5ff',
      status: 'Active'
    },
    {
      id: 'sk-4',
      name: 'SQL Snowflake Performance Optimizer',
      description: 'Analyzes slow query profiles, recommends micro-partition clustering keys, and prunes unused joins.',
      category: 'Database Skill',
      version: 'v2.0',
      author: 'Data Eng',
      tags: ['Snowflake', 'Cost Savings', 'Speed'],
      icon: Zap,
      iconColor: '#16a34a',
      iconBg: '#f0fdf4',
      status: 'Active'
    }
  ]

  // 3. Artifacts
  const artifacts = [
    {
      id: 'art-1',
      title: 'FY26 Q4 Customer 360 Synthesis Report',
      type: 'Executive Digest',
      format: 'Markdown / PDF',
      created: 'Today, 11:20 AM',
      size: '1.8 MB',
      source: 'Ingen Customer',
      icon: FileText,
      iconColor: '#ea580c',
      iconBg: '#fff7ed',
      summary: 'Holistic synthesis report containing unified multi-channel identities, sentiment trajectory, and expansion risk analysis.'
    },
    {
      id: 'art-2',
      title: 'Decile Tier Revenue Contribution Matrix',
      type: 'Dataset Artifact',
      format: 'Interactive Crosstab',
      created: 'Yesterday, 4:15 PM',
      size: '4.2 MB',
      source: 'Ingen Customer',
      icon: FileSpreadsheet,
      iconColor: '#0d9488',
      iconBg: '#f0fdfa',
      summary: 'Exact 10-decile breakdown tracking account distribution, ticket size, and top revenue drivers.'
    },
    {
      id: 'art-3',
      title: 'Channel Budget Rebalancing Model Blueprint',
      type: 'Simulation Artifact',
      format: 'JSON Model Graph',
      created: 'Nov 3, 2026',
      size: '860 KB',
      source: 'Ingen Optim',
      icon: FileCode,
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      summary: 'Optimal budget reallocation curve transferring underperforming direct mail spend into high-ROAS Paid Search.'
    },
    {
      id: 'art-4',
      title: 'Enterprise Identity Stitching Architecture Diagram',
      type: 'Technical Diagram',
      format: 'Excalidraw / SVG',
      created: 'Nov 2, 2026',
      size: '2.4 MB',
      source: 'Ingen Connect',
      icon: Presentation,
      iconColor: '#9333ea',
      iconBg: '#faf5ff',
      summary: 'Real-time CDC webhook and graph database node synthesis topology with sub-18ms latency guarantees.'
    }
  ]

  const activeFolder = subFolders.find((f) => f.id === selectedFolderId)

  return (
    <div className="ingen-customer-screen">
      {/* =========================================================
          LIBRARY HEADER & TABS
          ========================================================= */}
      <div className="hub-section-card" style={{ marginBottom: 20 }}>
        <div className="library-header-row">
          <div>
            <h1 className="hub-section-main-title" style={{ fontSize: 24 }}>
              Library
            </h1>
            <p className="hub-section-main-subtitle">
              Manage organized sub-folders, reusable AI skills, and generated project artifacts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="apple-button-secondary"
              onClick={() => alert('Create new sub-folder')}
            >
              <FolderPlus size={14} />
              <span>New Folder</span>
            </button>
            <button
              className="apple-button-primary"
              onClick={() => alert('Register new custom Skill or Artifact')}
            >
              <Plus size={14} />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="library-controls-bar">
          <div className="segmented-control">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'brain', label: '🧠 Memory Graph Brain' },
              { id: 'folders', label: `Sub-Folders (${subFolders.length})` },
              { id: 'skills', label: `Skills (${skills.length})` },
              { id: 'artifacts', label: `Artifacts (${artifacts.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`segmented-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSelectedFolderId(null)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="search-wrap" style={{ maxWidth: 300 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search folders, skills, artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="apple-search-input"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          FOLDER DRILLDOWN (IF USER CLICKS A SUB-FOLDER)
          ========================================================= */}
      {activeFolder ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={appleSpring}
          className="segmentation-detail-panel"
          style={{ marginBottom: 24 }}
        >
          <div className="detail-top-nav">
            <button
              className="detail-back-button"
              onClick={() => setSelectedFolderId(null)}
            >
              <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} />
              <span>Back to Library</span>
            </button>
          </div>

          <div className="detail-hero-box">
            <div
              className="detail-icon-large"
              style={{ backgroundColor: activeFolder.bgLight, color: activeFolder.color }}
            >
              <FolderOpen size={28} />
            </div>
            <div className="detail-hero-text">
              <h2 className="detail-hero-title">{activeFolder.name}</h2>
              <p className="detail-hero-desc">
                {activeFolder.count} items stored · Category: {activeFolder.category} · Last updated {activeFolder.updated}
              </p>
            </div>
            <button className="apple-button-primary" onClick={() => alert('Upload to this folder')}>
              <Plus size={14} />
              <span>Add File</span>
            </button>
          </div>

          <div className="detail-card-table-wrap">
            <table className="ic-data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Last Modified</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeFolder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="#64748b" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>{item.type.toUpperCase()}</td>
                    <td>{item.size}</td>
                    <td>{item.updated}</td>
                    <td>
                      <button
                        className="apple-button-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => alert(`Opening ${item.name}`)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : null}

      {/* =========================================================
          MEMORY GRAPH BRAIN VIEW (FEATURED OR DIRECT TAB)
          ========================================================= */}
      {(!activeFolder && (activeTab === 'all' || activeTab === 'brain')) && (
        <MemoryGraphBrain />
      )}

      {/* =========================================================
          SECTION 1: SUB-FOLDERS
          ========================================================= */}
      {(!activeFolder && (activeTab === 'all' || activeTab === 'folders')) && (
        <div className="hub-section-card" style={{ marginBottom: 20 }}>
          <div className="hub-section-header">
            <div className="hub-section-icon-box orange">
              <Folder size={18} strokeWidth={2.2} />
            </div>
            <div className="hub-section-titles">
              <h2 className="hub-section-main-title">Sub-Folders</h2>
              <p className="hub-section-main-subtitle">
                Organized directories for reports, customer segments, models and telemetry traces
              </p>
            </div>
          </div>

          <div className="hub-cards-grid">
            {subFolders
              .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((folder) => (
                <motion.div
                  key={folder.id}
                  whileHover={{ y: -2 }}
                  whileTap={tapGesture}
                  transition={appleSpring}
                  className="hub-action-card"
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <div
                    className="hub-action-icon-wrap"
                    style={{ backgroundColor: folder.bgLight, color: folder.color }}
                  >
                    <Folder size={18} strokeWidth={1.8} />
                  </div>

                  <div className="hub-action-content">
                    <h3 className="hub-action-title">{folder.name}</h3>
                    <p className="hub-action-desc">
                      {folder.count} files · {folder.category}
                    </p>
                  </div>

                  <div className="hub-action-arrow">
                    <ArrowRight size={16} strokeWidth={1.6} />
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================
          SECTION 2: SKILLS
          ========================================================= */}
      {(!activeFolder && (activeTab === 'all' || activeTab === 'skills')) && (
        <div className="hub-section-card" style={{ marginBottom: 20 }}>
          <div className="hub-section-header">
            <div className="hub-section-icon-box navy">
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
            <div className="hub-section-titles">
              <h2 className="hub-section-main-title">Skills</h2>
              <p className="hub-section-main-subtitle">
                Modular, repeatable AI capabilities and specialized algorithm packages
              </p>
            </div>
          </div>

          <div className="hub-cards-grid">
            {skills
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((skill) => {
                const Icon = skill.icon
                return (
                  <motion.div
                    key={skill.id}
                    whileHover={{ y: -2 }}
                    whileTap={tapGesture}
                    transition={appleSpring}
                    className="hub-action-card"
                    onClick={() => alert(`Activating skill: ${skill.name}`)}
                  >
                    <div
                      className="hub-action-icon-wrap"
                      style={{ backgroundColor: skill.iconBg, color: skill.iconColor }}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </div>

                    <div className="hub-action-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <h3 className="hub-action-title" style={{ margin: 0 }}>
                          {skill.name}
                        </h3>
                        <span className="ic-pct-badge" style={{ fontSize: 10 }}>
                          {skill.version}
                        </span>
                      </div>
                      <p className="hub-action-desc">{skill.description}</p>
                    </div>

                    <div className="hub-action-arrow">
                      <ArrowRight size={16} strokeWidth={1.6} />
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </div>
      )}

      {/* =========================================================
          SECTION 3: ARTIFACTS
          ========================================================= */}
      {(!activeFolder && (activeTab === 'all' || activeTab === 'artifacts')) && (
        <div className="hub-section-card" style={{ marginBottom: 20 }}>
          <div className="hub-section-header">
            <div className="hub-section-icon-box orange" style={{ background: '#0891b2' }}>
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <div className="hub-section-titles">
              <h2 className="hub-section-main-title">Artifacts</h2>
              <p className="hub-section-main-subtitle">
                Persistent generated outputs, reports, code blueprints, and interactive diagrams
              </p>
            </div>
          </div>

          <div className="hub-cards-grid">
            {artifacts
              .filter(
                (a) =>
                  a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.summary.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((art) => {
                const Icon = art.icon
                return (
                  <motion.div
                    key={art.id}
                    whileHover={{ y: -2 }}
                    whileTap={tapGesture}
                    transition={appleSpring}
                    className="hub-action-card"
                    onClick={() => alert(`Viewing Artifact: ${art.title}`)}
                  >
                    <div
                      className="hub-action-icon-wrap"
                      style={{ backgroundColor: art.iconBg, color: art.iconColor }}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </div>

                    <div className="hub-action-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <h3 className="hub-action-title" style={{ margin: 0 }}>
                          {art.title}
                        </h3>
                      </div>
                      <p className="hub-action-desc">{art.summary}</p>
                      <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                        Source: <strong>{art.source}</strong> · {art.format}
                      </div>
                    </div>

                    <div className="hub-action-arrow">
                      <ArrowRight size={16} strokeWidth={1.6} />
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </div>
      )}

      {/* Footer Copyright */}
      <footer className="ingen-customer-footer-line">
        <span>Copyright 2026 · All Rights Reserved</span>
      </footer>
    </div>
  )
}
