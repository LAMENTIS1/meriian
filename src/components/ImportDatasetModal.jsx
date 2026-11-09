import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Download,
  Database,
  Cloud,
  CheckCircle2,
  X,
  ArrowRight,
  RefreshCw,
  Search,
  Check
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function ImportDatasetModal({ isOpen, onClose, onImportSuccess }) {
  if (!isOpen) return null

  const [selectedSource, setSelectedSource] = useState('postgres')
  const [selectedTable, setSelectedTable] = useState('orders_q4')
  const [syncMode, setSyncMode] = useState('snapshot')
  const [importing, setImporting] = useState(false)

  const sources = [
    { id: 'postgres', name: 'Postgres (Production)', icon: '🐘', type: 'Database' },
    { id: 'snowflake', name: 'Snowflake Enterprise', icon: '❄️', type: 'Data Warehouse' },
    { id: 'bigquery', name: 'BigQuery Analytics', icon: '🔍', type: 'Data Warehouse' },
    { id: 'gsheets', name: 'Google Sheets (Live Sync)', icon: '📊', type: 'Integration' }
  ]

  const availableTables = {
    postgres: ['orders_q4', 'customer_churn_events', 'product_inventory', 'users_ledger'],
    snowflake: ['ANALYTICS.FACT_SALES', 'FINANCE.ARR_FORECAST', 'MARKETING.CAMPAIGN_ATTRIBUTION'],
    bigquery: ['telemetry_raw_events', 'daily_active_sessions', 'billing_invoices'],
    gsheets: ['Q4 Target Model.xlsx', 'Sales Rep Quotas.xlsx', 'Executive Dashboard']
  }

  const handleImport = () => {
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      const importedDataset = {
        id: `ds-${Date.now()}`,
        name: selectedTable.replace(/[^a-zA-Z0-9_-]/g, '_'),
        type: 'excel',
        privacy: 'Private',
        category: 'Sales',
        description: `Imported via ${sources.find(s => s.id === selectedSource)?.name}`,
        size: '28.6 MB',
        updated: 'Just now',
        hasHierarchy: true
      }
      if (onImportSuccess) onImportSuccess(importedDataset)
      onClose()
    }, 1200)
  }

  return (
    <div className="connector-modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={appleSpring}
        className="connector-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div className="connector-modal-header">
          <div className="connector-modal-title-group">
            <div className="connector-icon-wrapper" style={{ backgroundColor: '#eff6ff' }}>
              <Download size={20} color="#2563eb" />
            </div>
            <div>
              <h2 className="connector-modal-heading">Import from Connected Sources</h2>
              <p className="connector-modal-subheading">
                Materialize tables or views directly from active data connectors
              </p>
            </div>
          </div>
          <button className="connector-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="connector-modal-body">
          <label className="conn-field-label" style={{ marginBottom: 8 }}>Select Connected Source</label>
          <div className="conn-source-grid">
            {sources.map((s) => (
              <div
                key={s.id}
                className={`conn-source-card ${selectedSource === s.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSource(s.id)
                  setSelectedTable(availableTables[s.id][0])
                }}
              >
                <span className="conn-source-icon">{s.icon}</span>
                <div className="conn-source-info">
                  <span className="conn-source-name">{s.name}</span>
                  <span className="conn-source-type">{s.type}</span>
                </div>
                {selectedSource === s.id && (
                  <Check size={16} className="conn-source-check" />
                )}
              </div>
            ))}
          </div>

          <div className="conn-field-group" style={{ marginTop: 18 }}>
            <label className="conn-field-label">Available Tables / Objects in {sources.find(s => s.id === selectedSource)?.name}</label>
            <div className="table-selection-list">
              {(availableTables[selectedSource] || []).map((tbl) => (
                <div
                  key={tbl}
                  className={`table-select-item ${selectedTable === tbl ? 'selected' : ''}`}
                  onClick={() => setSelectedTable(tbl)}
                >
                  <Database size={14} color="#64748b" />
                  <span className="table-select-name">{tbl}</span>
                  {selectedTable === tbl && <Check size={14} color="#ea580c" />}
                </div>
              ))}
            </div>
          </div>

          <div className="conn-grid-2" style={{ marginTop: 16 }}>
            <div className="conn-field-group">
              <label className="conn-field-label">Sync Policy</label>
              <select
                className="conn-input"
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value)}
              >
                <option value="snapshot">One-time Static Snapshot</option>
                <option value="scheduled">Incremental Daily Sync</option>
                <option value="live">Continuous CDC Stream</option>
              </select>
            </div>
            <div className="conn-field-group">
              <label className="conn-field-label">Target Dataset Category</label>
              <select className="conn-input">
                <option>Sales</option>
                <option>Analytics</option>
                <option>Telemetry</option>
              </select>
            </div>
          </div>
        </div>

        <div className="connector-modal-footer">
          <div className="footer-left"></div>
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-save-conn"
              disabled={importing}
              onClick={handleImport}
            >
              {importing ? (
                <>
                  <RefreshCw size={14} className="spinning" />
                  <span>Importing...</span>
                </>
              ) : (
                <span>Import Dataset</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
