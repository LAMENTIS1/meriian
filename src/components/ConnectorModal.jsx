import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Database,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Lock,
  Key,
  Server,
  Shield,
  FileCode2,
  Terminal,
  Copy,
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function ConnectorModal({ connector, onClose, onSaveConnection }) {
  if (!connector) return null

  const [activeTab, setActiveTab] = useState('credentials') // 'credentials' | 'code' | 'schema'
  const [copiedCode, setCopiedCode] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState(null) // 'success' | 'error' | null

  // Form Fields
  const [formData, setFormData] = useState({
    displayName: `${connector.name} Production`,
    host: connector.type === 'Database' || connector.type === 'Data Warehouse' ? `${connector.id}-db.internal.network` : 'https://api.service.com',
    port: connector.id === 'postgres' ? '5432' : connector.id === 'mysql' ? '3306' : connector.id === 'sqlserver' ? '1433' : '443',
    database: 'analytics_production',
    username: 'readonly_ingen_service',
    password: '••••••••••••••••',
    sslMode: 'require',
    schema: 'public'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTestConnection = () => {
    setIsTesting(true)
    setTestStatus(null)
    setTimeout(() => {
      setIsTesting(false)
      setTestStatus('success')
    }, 1200)
  }

  const handleCopyCode = (codeStr) => {
    navigator.clipboard?.writeText(codeStr)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Generate connection snippet
  const generateSnippet = () => {
    if (connector.id === 'postgres') {
      return `# Python psycopg2 / SQLAlchemy Connection Snippet
from sqlalchemy import create_engine
import pandas as pd

# Secure connection uri
DATABASE_URL = "postgresql://${formData.username}:<PASSWORD>@${formData.host}:${formData.port}/${formData.database}?sslmode=${formData.sslMode}"

engine = create_engine(DATABASE_URL)

# Live query execution
query = "SELECT * FROM public.orders WHERE status = 'delivered' LIMIT 1000;"
df = pd.read_sql(query, engine)
print(f"Loaded {len(df)} records from ${connector.name}")`
    } else if (connector.id === 'bigquery') {
      return `# Google Cloud BigQuery Python Client
from google.cloud import bigquery

client = bigquery.Client(project="${formData.database}")

sql_query = """
SELECT 
  customer_id, 
  metric_name, 
  SUM(metric_value) AS total_val
FROM \`${formData.database}.${formData.schema}.customer_telemetry\`
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 500
"""

df = client.query(sql_query).to_dataframe()
print(df.head())`
    } else if (connector.id === 'snowflake') {
      return `# Snowflake Connector for Python & Pandas
import snowflake.connector

conn = snowflake.connector.connect(
    user="${formData.username}",
    password="<SECURE_PASSWORD>",
    account="${formData.host.split('.')[0] || 'xy12345'}",
    warehouse="COMPUTE_WH",
    database="${formData.database}",
    schema="${formData.schema}"
)

cursor = conn.cursor()
cursor.execute("SELECT CURRENT_VERSION(), CURRENT_WAREHOUSE();")
print("Connected:", cursor.fetchall())`
    } else {
      return `# ${connector.name} API / Webhook Integration
import requests
import json

AUTH_TOKEN = "sk-ingenspark-live-${connector.id}-token"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json",
    "X-Ingen-Connector": "${connector.id}"
}

endpoint = "${formData.host}/v1/sync/events"
payload = {
    "sync_mode": "incremental_cdc",
    "batch_size": 1000,
    "vector_index": True
}

response = requests.post(endpoint, json=payload, headers=HEADERS)
print("Status:", response.status_code, response.json())`
    }
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
      >
        {/* Modal Header */}
        <div className="connector-modal-header">
          <div className="connector-modal-title-group">
            <div
              className="connector-icon-wrapper"
              style={{ backgroundColor: connector.iconBg }}
            >
              <span>{connector.iconText}</span>
            </div>
            <div>
              <div className="connector-name-row">
                <h2 className="connector-modal-heading">{connector.name} Connection</h2>
                <span className="connector-tag-pill">{connector.type}</span>
              </div>
              <p className="connector-modal-subheading">{connector.desc}</p>
            </div>
          </div>
          <button className="connector-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs: Credentials & Parameters | Connection Code | Schema */}
        <div className="connector-tabs-bar">
          <button
            className={`connector-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            <Server size={14} />
            <span>Connection Parameters</span>
          </button>
          <button
            className={`connector-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <FileCode2 size={14} />
            <span>Connection Code & SDK</span>
          </button>
          <button
            className={`connector-tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            <Database size={14} />
            <span>Active Datasets & Tables</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="connector-modal-body">
          {activeTab === 'credentials' && (
            <div className="connector-credentials-pane">
              <div className="conn-grid-2">
                <div className="conn-field-group">
                  <label className="conn-field-label">Connection Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="e.g. Postgres Production Replica"
                  />
                </div>
                <div className="conn-field-group">
                  <label className="conn-field-label">Host / Endpoint</label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="e.g. db.example.com"
                  />
                </div>
              </div>

              <div className="conn-grid-3">
                <div className="conn-field-group">
                  <label className="conn-field-label">Port</label>
                  <input
                    type="text"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="5432"
                  />
                </div>
                <div className="conn-field-group">
                  <label className="conn-field-label">Database Name</label>
                  <input
                    type="text"
                    name="database"
                    value={formData.database}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="analytics"
                  />
                </div>
                <div className="conn-field-group">
                  <label className="conn-field-label">Schema / Namespace</label>
                  <input
                    type="text"
                    name="schema"
                    value={formData.schema}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="public"
                  />
                </div>
              </div>

              <div className="conn-grid-2">
                <div className="conn-field-group">
                  <label className="conn-field-label">Username / Service Account</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="ingen_reader"
                  />
                </div>
                <div className="conn-field-group">
                  <label className="conn-field-label">Password / Secret Key</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="conn-input"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="conn-security-banner">
                <Shield size={16} className="conn-sec-icon" />
                <span>
                  Credentials are encrypted using AES-256 and stored in your isolated tenant vault. Ingen Spark uses read-only queries with SSL/TLS encryption.
                </span>
              </div>

              {testStatus === 'success' && (
                <div className="conn-status-success">
                  <CheckCircle2 size={16} />
                  <span>Connection successful! Latency: 24ms. Found 14 schemas, 42 tables.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="connector-code-pane">
              <div className="code-header-row">
                <div className="code-lang-tag">
                  <Terminal size={13} />
                  <span>Python / SDK Client</span>
                </div>
                <button
                  className="code-copy-btn"
                  onClick={() => handleCopyCode(generateSnippet())}
                >
                  {copiedCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied' : 'Copy Snippet'}</span>
                </button>
              </div>

              <pre className="conn-code-block">
                <code>{generateSnippet()}</code>
              </pre>

              <div className="code-hint-box">
                <AlertCircle size={15} />
                <span>
                  Tip: You can execute this connection directly inside AI Workspace tasks or CDC pipelines via <code>/connect</code>.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="connector-schema-pane">
              <div className="schema-intro">
                <span>Associated live tables synced with <strong>Ingen Data (Files)</strong>:</span>
              </div>
              <div className="schema-table-list">
                {[
                  { name: 'orders', rows: '1.2M rows', updated: '10 mins ago', size: '18.4 MB' },
                  { name: 'customer_events', rows: '5.8M rows', updated: '25 mins ago', size: '142 MB' },
                  { name: 'sales_q4_actuals', rows: '420K rows', updated: '1 hr ago', size: '42 MB' },
                  { name: 'telemetry_metrics', rows: '12.4M rows', updated: 'Yesterday', size: '240 MB' }
                ].map((item, idx) => (
                  <div key={idx} className="schema-table-row">
                    <div className="schema-name-col">
                      <Database size={15} color="#ea580c" />
                      <span className="schema-table-title">{item.name}</span>
                    </div>
                    <span className="schema-meta-pill">{item.rows}</span>
                    <span className="schema-meta-pill">{item.size}</span>
                    <span className="schema-date">{item.updated}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="connector-modal-footer">
          <div className="footer-left">
            <button
              className="btn-test-conn"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              <RefreshCw size={14} className={isTesting ? 'spinning' : ''} />
              <span>{isTesting ? 'Testing Link...' : 'Test Connection'}</span>
            </button>
          </div>

          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-save-conn"
              onClick={() => {
                if (onSaveConnection) onSaveConnection({ ...connector, ...formData })
                alert(`Successfully connected ${connector.name}!`)
                onClose()
              }}
            >
              Save & Authorize
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
