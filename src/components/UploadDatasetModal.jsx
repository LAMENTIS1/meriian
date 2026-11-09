import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  HardDrive,
  FolderOpen
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function UploadDatasetModal({ isOpen, onClose, onUploadSuccess }) {
  if (!isOpen) return null

  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [datasetName, setDatasetName] = useState('')
  const [category, setCategory] = useState('Sales')
  const [privacy, setPrivacy] = useState('Private')
  const [description, setDescription] = useState('Quarterly sales and telemetry records')
  const [uploading, setUploading] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      if (!datasetName) {
        setDatasetName(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!datasetName) {
        setDatasetName(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!datasetName) return

    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      const newDataset = {
        id: `ds-${Date.now()}`,
        name: datasetName,
        type: 'excel',
        privacy: privacy,
        category: category,
        description: description || 'Uploaded dataset',
        size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '12.4 MB',
        updated: 'Just now',
        hasHierarchy: true
      }
      if (onUploadSuccess) onUploadSuccess(newDataset)
      onClose()
    }, 1000)
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
        style={{ maxWidth: 580 }}
      >
        <div className="connector-modal-header">
          <div className="connector-modal-title-group">
            <div className="connector-icon-wrapper" style={{ backgroundColor: '#fff7ed' }}>
              <Upload size={20} color="#ea580c" />
            </div>
            <div>
              <h2 className="connector-modal-heading">Upload New Dataset</h2>
              <p className="connector-modal-subheading">
                Upload CSV, XLSX, Parquet or JSON datasets into Ingen Data lake
              </p>
            </div>
          </div>
          <button className="connector-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="connector-modal-body">
          {/* Dropzone */}
          <div
            className={`file-dropzone-area ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload-input"
              className="dropzone-hidden-input"
              accept=".csv,.xlsx,.xls,.parquet,.json"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload-input" className="dropzone-label">
              <div className="dropzone-icon-box">
                <FileSpreadsheet size={28} color="#ea580c" />
              </div>
              <span className="dropzone-primary-text">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop dataset file'}
              </span>
              <span className="dropzone-secondary-text">
                Supports Excel (.xlsx), CSV, Parquet, JSON up to 500MB
              </span>
            </label>
          </div>

          <div className="conn-grid-2" style={{ marginTop: 16 }}>
            <div className="conn-field-group">
              <label className="conn-field-label">Dataset Name</label>
              <input
                type="text"
                required
                className="conn-input"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g. Q4-Regional-Revenue"
              />
            </div>
            <div className="conn-field-group">
              <label className="conn-field-label">Category</label>
              <select
                className="conn-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Sales">Sales</option>
                <option value="Telemetry">Telemetry</option>
                <option value="Analytics">Analytics</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div className="conn-grid-2">
            <div className="conn-field-group">
              <label className="conn-field-label">Privacy Level</label>
              <select
                className="conn-input"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              >
                <option value="Private">Private (Workspace only)</option>
                <option value="Public">Public (Team-wide)</option>
              </select>
            </div>
            <div className="conn-field-group">
              <label className="conn-field-label">Description</label>
              <input
                type="text"
                className="conn-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of dataset contents"
              />
            </div>
          </div>

          <div className="conn-security-banner">
            <HardDrive size={15} className="conn-sec-icon" />
            <span>
              Ingen Data automatically parses schemas, computes column statistics, and builds vector embeddings for agent queries.
            </span>
          </div>

          <div className="connector-modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
            <div className="footer-left"></div>
            <div className="footer-right">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || (!selectedFile && !datasetName)}
                className="btn-save-conn"
              >
                {uploading ? 'Processing File...' : 'Upload & Ingest Dataset'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
