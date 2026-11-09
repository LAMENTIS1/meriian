import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Upload,
  Download,
  Share2,
  GitMerge,
  ArrowLeftRight,
  GitBranch,
  Network,
  Users,
  Zap,
  Activity,
  Layers,
  FileSpreadsheet,
  Grid,
  List,
  ChevronDown,
  Eye,
  Trash2,
  Edit2,
  Lock,
  Bolt,
  Filter,
  Check,
  Plus
} from 'lucide-react'
import UploadDatasetModal from '../components/UploadDatasetModal'
import ImportDatasetModal from '../components/ImportDatasetModal'
import ConnectorModal from '../components/ConnectorModal'
import PipelineRecommendationModal from '../components/PipelineRecommendationModal'
import PipelineChatSession from '../components/PipelineChatSession'
import { Sparkles, MessageSquare } from 'lucide-react'
import '../connectorModal.css'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
const tapGesture = { scale: 0.96 }

export default function IngenData({ onNavigate }) {
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [activeSubTab, setActiveSubTab] = useState('datasets') // 'datasets' | 'upload' | 'import' | 'connections' | 'merge' | 'transpose' | 'pipelines'
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [privacyFilter, setPrivacyFilter] = useState('All')

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [activeConnectorModal, setActiveConnectorModal] = useState(null)
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false)
  const [selectedDatasetForRec, setSelectedDatasetForRec] = useState(null)
  const [pipelineChatOpen, setPipelineChatOpen] = useState(false)
  const [chatDataset, setChatDataset] = useState(null)

  // Data sets matching the screenshot cards (12 cards)
  const [datasets, setDatasets] = useState([
    {
      id: 'ds-1',
      name: 'orders',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '18.4 MB',
      updated: '10 mins ago',
      hasHierarchy: true
    },
    {
      id: 'ds-2',
      name: 'Kafka-Dataset',
      type: 'excel',
      privacy: 'Private',
      category: 'Telemetry',
      description: 'performance data or sales data',
      size: '142 MB',
      updated: '25 mins ago',
      hasHierarchy: true
    },
    {
      id: 'ds-3',
      name: 'K-Dataset',
      type: 'excel',
      privacy: 'Private',
      category: 'Analytics',
      description: 'performance data or sales data',
      size: '8.2 MB',
      updated: '1 hour ago',
      hasHierarchy: false
    },
    {
      id: 'ds-4',
      name: '20K-Sales',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '42 MB',
      updated: '3 hours ago',
      hasHierarchy: true
    },
    {
      id: 'ds-5',
      name: 'Sales_September...',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '31.5 MB',
      updated: 'Yesterday',
      hasHierarchy: false
    },
    {
      id: 'ds-6',
      name: 'Sales-10',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '12.8 MB',
      updated: '2 days ago',
      hasHierarchy: true
    },
    {
      id: 'ds-7',
      name: '10Sales',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '9.4 MB',
      updated: '3 days ago',
      hasHierarchy: false
    },
    {
      id: 'ds-8',
      name: '10M Sales Recor...',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'Performance Data or Sales Data',
      size: '240 MB',
      updated: '5 days ago',
      hasHierarchy: true
    },
    {
      id: 'ds-9',
      name: 'SALES-5000-2000...',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '18.9 MB',
      updated: '6 days ago',
      hasHierarchy: true
    },
    {
      id: 'ds-10',
      name: 'Sales-2000Sales...',
      type: 'excel',
      privacy: 'Private',
      category: 'Sales',
      description: 'performance data or sales data',
      size: '14.2 MB',
      updated: '1 week ago',
      hasHierarchy: true
    },
    {
      id: 'ds-11',
      name: 'Disease_symptom...',
      type: 'excel',
      privacy: 'Private',
      category: 'Analytics',
      description: 'performance data or sales data',
      size: '6.7 MB',
      updated: '1 week ago',
      hasHierarchy: false
    },
    {
      id: 'ds-12',
      name: '100-Disease_sym...',
      type: 'excel',
      privacy: 'Private',
      category: 'Analytics',
      description: 'performance data or sales data',
      size: '4.8 MB',
      updated: '2 weeks ago',
      hasHierarchy: false
    }
  ])

  // Filter datasets
  const filteredDatasets = datasets.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'All' ? true : d.category === categoryFilter
    const matchesPrivacy = privacyFilter === 'All' ? true : d.privacy === privacyFilter
    return matchesSearch && matchesCategory && matchesPrivacy
  })

  // Action Bar Tabs (Datasets, Upload, Import, Connections, Merge, Data Transpose, Pipelines)
  const actionTabs = [
    { id: 'datasets', label: 'Datasets', icon: Layers, isPrimary: true },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'import', label: 'Import', icon: Download },
    { id: 'connections', label: 'Connections', icon: Network },
    { id: 'merge', label: 'Merge', icon: GitMerge },
    { id: 'transpose', label: 'Data Transpose', icon: ArrowLeftRight },
    { id: 'pipelines', label: 'Pipelines', icon: GitBranch }
  ]

  // Top Nav Items (IngenConnect, IngenData, IngenCustomer, IngenOptim, IngenTracker)
  const suiteTabs = [
    { id: 'ingen-connect', label: 'IngenConnect', icon: Network },
    { id: 'ingen-data', label: 'IngenData', icon: Layers, active: true },
    { id: 'ingen-customer', label: 'IngenCustomer', icon: Users },
    { id: 'ingen-optim', label: 'IngenOptim', icon: Zap },
    { id: 'ingen-tracker', label: 'IngenTracker', icon: Activity }
  ]

  // Delete dataset handler
  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirm('Delete dataset?')) {
      setDatasets((prev) => prev.filter((d) => d.id !== id))
    }
  }

  return (
    <div className="ingen-data-page">
      {/* =========================================================
          SUITE HORIZONTAL NAVIGATION TABS (Top Bar from Screenshot)
          ========================================================= */}
      <div className="suite-horizontal-nav">
        {suiteTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.active
          return (
            <button
              key={tab.id}
              className={`suite-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (onNavigate) onNavigate(tab.id)
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* =========================================================
          DATASETS HEADER & TOOLBAR
          ========================================================= */}
      <div className="dataset-header-section">
        <div className="dataset-header-left">
          <h1 className="dataset-section-title">Data Sets</h1>
          <p className="dataset-section-subtitle">
            Manage, import, and transform project data
          </p>
        </div>

        {/* Search input */}
        <div className="dataset-search-box">
          <Search size={15} className="dataset-search-icon" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dataset-search-input"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="dataset-actions-row">
          {actionTabs.map((tab) => {
            const Icon = tab.icon
            const isSelected = activeSubTab === tab.id
            return (
              <motion.button
                key={tab.id}
                whileTap={tapGesture}
                transition={appleSpring}
                className={`dataset-action-btn ${tab.isPrimary ? 'primary' : ''} ${
                  isSelected && !tab.isPrimary ? 'selected' : ''
                }`}
                onClick={() => {
                  setActiveSubTab(tab.id)
                  if (tab.id === 'upload') {
                    setUploadModalOpen(true)
                  } else if (tab.id === 'import') {
                    setImportModalOpen(true)
                  } else if (tab.id === 'connections') {
                    if (onNavigate) onNavigate('connectors')
                  } else if (tab.id === 'pipelines') {
                    setChatDataset(datasets[0])
                    setPipelineChatOpen(true)
                  }
                }}
              >
                <Icon size={14} strokeWidth={1.8} />
                <span>{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* =========================================================
          FILTER BAR (Grid/List View, Filter by Category, Filter by Privacy)
          ========================================================= */}
      <div className="dataset-filters-bar">
        {/* View toggle (Grid / List) */}
        <div className="dataset-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid size={15} strokeWidth={1.8} />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={15} strokeWidth={1.8} />
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="dataset-dropdown-filters">
          <div className="filter-dropdown-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="apple-filter-select"
            >
              <option value="All">Filter by Category</option>
              <option value="Sales">Sales</option>
              <option value="Telemetry">Telemetry</option>
              <option value="Analytics">Analytics</option>
            </select>
            <ChevronDown size={13} className="select-arrow" />
          </div>

          <div className="filter-dropdown-wrap">
            <span className="filter-dropdown-label">Filter by Privacy</span>
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value)}
              className="apple-filter-select"
            >
              <option value="All">All</option>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
            </select>
            <ChevronDown size={13} className="select-arrow" />
          </div>
        </div>
      </div>

      {/* =========================================================
          DATASETS GRID (Exact reproduction of screenshot 8 cards)
          ========================================================= */}
      {viewMode === 'grid' ? (
        <div className="datasets-grid">
          {filteredDatasets.map((ds) => (
            <motion.div
              key={ds.id}
              whileHover={{ y: -2 }}
              whileTap={tapGesture}
              transition={appleSpring}
              className="dataset-card"
              onClick={() => alert(`Opening dataset: ${ds.name}`)}
            >
              {/* Card Header with Privacy & Orange Spark Flash */}
              <div className="dataset-card-header">
                <span className="dataset-privacy-label">{ds.privacy}</span>
                <div className="dataset-spark-badge" title="Active Vector Index">
                  <Bolt size={12} fill="#ea580c" color="#ea580c" />
                </div>
              </div>

              {/* Big Excel Icon */}
              <div className="dataset-icon-center">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="48" height="48" rx="8" fill="#107C41" />
                  <path
                    d="M14 16 L22 24 L14 32 H19 L24.5 26.5 L30 32 H35 L27 24 L35 16 H30 L24.5 21.5 L19 16 Z"
                    fill="#FFFFFF"
                  />
                  <rect x="25" y="14" width="16" height="20" rx="2" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" fill="none" />
                  <line x1="25" y1="20" x2="41" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
                  <line x1="25" y1="26" x2="41" y2="26" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
                  <line x1="33" y1="14" x2="33" y2="34" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />
                </svg>
              </div>

              {/* Dataset Name */}
              <h3 className="dataset-card-name">{ds.name}</h3>

              {/* Mini Toolbar Icons (Hierarchy, Edit, View, Download, Delete, Dropdown, Fork, Logs) */}
              <div className="dataset-card-toolbar" onClick={(e) => e.stopPropagation()}>
                {ds.hasHierarchy && (
                  <button className="ds-tool-btn" title="Schema Hierarchy">
                    <Network size={13} />
                  </button>
                )}
                <button className="ds-tool-btn" title="Edit Metadata">
                  <Edit2 size={13} />
                </button>
                <button className="ds-tool-btn" title="Preview Data">
                  <Eye size={13} />
                </button>
                <button className="ds-tool-btn" title="Download">
                  <Download size={13} />
                </button>
                <button
                  className="ds-tool-btn danger"
                  title="Delete"
                  onClick={(e) => handleDelete(e, ds.id)}
                >
                  <Trash2 size={13} />
                </button>
                <button className="ds-tool-btn" title="More Options">
                  <ChevronDown size={13} />
                </button>
                <button className="ds-tool-btn" title="Branch Dataset">
                  <GitBranch size={13} />
                </button>
                <button
                  className="ds-tool-btn"
                  title="Pipeline Copilot Chat"
                  onClick={(e) => {
                    e.stopPropagation()
                    setChatDataset(ds)
                    setPipelineChatOpen(true)
                  }}
                >
                  <MessageSquare size={13} />
                </button>
                <button className="ds-tool-btn" title="Inspection Logs">
                  <Activity size={13} />
                </button>
                <button
                  className="btn-spark-rec-trigger"
                  title="Spark AI Pipeline Recommendations"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDatasetForRec(ds)
                    setRecommendationModalOpen(true)
                  }}
                >
                  <Sparkles size={11} color="#7c3aed" />
                  <span>Spark AI</span>
                </button>
              </div>

              {/* Card Footer Text */}
              <div className="dataset-card-footer">
                <span className="dataset-footer-desc">{ds.description}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="datasets-list-table">
          <div className="datasets-table-header">
            <span>Name</span>
            <span>Category</span>
            <span>Privacy</span>
            <span>Size</span>
            <span>Last Updated</span>
            <span>Actions</span>
          </div>
          {filteredDatasets.map((ds) => (
            <div key={ds.id} className="datasets-table-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet size={18} color="#107C41" />
                <span style={{ fontWeight: 600 }}>{ds.name}</span>
              </div>
              <span>{ds.category}</span>
              <span className="status-pill live">{ds.privacy}</span>
              <span>{ds.size}</span>
              <span>{ds.updated}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="ds-tool-btn" title="Preview"><Eye size={13} /></button>
                <button className="ds-tool-btn" title="Download"><Download size={13} /></button>
                <button className="ds-tool-btn danger" onClick={(e) => handleDelete(e, ds.id)}><Trash2 size={13} /></button>
                <button
                  className="btn-spark-rec-trigger"
                  title="Spark AI Pipeline Recommendations"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDatasetForRec(ds)
                    setRecommendationModalOpen(true)
                  }}
                >
                  <Sparkles size={11} color="#7c3aed" />
                  <span>Pipeline AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Spark Action Button at bottom right */}
      <div
        className="floating-spark-action"
        title="Open Spark AI Pipeline Copilot"
        onClick={() => {
          setChatDataset(datasets[0])
          setPipelineChatOpen(true)
        }}
      >
        <Bolt size={18} fill="#ffffff" color="#ffffff" />
      </div>

      {/* Upload Dataset Modal */}
      <UploadDatasetModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={(newDs) => {
          setDatasets((prev) => [newDs, ...prev])
          setActiveSubTab('datasets')
          // Auto-trigger Spark AI recommendations for newly uploaded file
          setSelectedDatasetForRec(newDs)
          setRecommendationModalOpen(true)
        }}
      />

      {/* Import Dataset Modal */}
      <ImportDatasetModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={(newDs) => {
          setDatasets((prev) => [newDs, ...prev])
          setActiveSubTab('datasets')
          setSelectedDatasetForRec(newDs)
          setRecommendationModalOpen(true)
        }}
      />

      {/* Spark AI Pipeline Recommendations Modal */}
      <PipelineRecommendationModal
        isOpen={recommendationModalOpen}
        dataset={selectedDatasetForRec}
        onClose={() => {
          setRecommendationModalOpen(false)
          setSelectedDatasetForRec(null)
        }}
        onApplyRecommendations={(appliedInfo) => {
          console.log('Applied pipeline recommendations:', appliedInfo)
        }}
      />

      {/* Spark AI Interactive Pipeline Copilot Drawer / Modal */}
      {pipelineChatOpen && (
        <div className="connector-modal-backdrop" onClick={() => setPipelineChatOpen(false)}>
          <div
            className="connector-modal-card"
            style={{ maxWidth: 740, padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <PipelineChatSession
              dataset={chatDataset}
              availableDatasets={datasets}
              onSelectDataset={(ds) => setChatDataset(ds)}
              onGoToIngenData={() => {
                setPipelineChatOpen(false)
                setActiveSubTab('datasets')
              }}
              onClose={() => setPipelineChatOpen(false)}
              onOpenFullRecommendation={() => {
                setSelectedDatasetForRec(chatDataset)
                setRecommendationModalOpen(true)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
