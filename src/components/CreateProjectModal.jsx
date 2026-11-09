import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  FolderPlus,
  X,
  Users,
  Target,
  FileSpreadsheet,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  if (!isOpen) return null

  const [projectName, setProjectName] = useState('')
  const [category, setCategory] = useState('Customer Analytics')
  const [description, setDescription] = useState('')
  const [objective, setObjective] = useState('')
  const [leadName, setLeadName] = useState('Srivatsav Damaraju')
  const [accessLevel, setAccessLevel] = useState('Confidential')
  const [tags, setTags] = useState('Analytics, Telemetry, Q4')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!projectName.trim()) return

    const newProject = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      category: category,
      status: 'Active',
      progress: 5,
      pinned: true,
      recommended: false,
      accessLevel: accessLevel,
      description: description.trim() || 'Cross-functional analytical initiative.',
      objective: objective.trim() || 'Accelerate team insights and operational telemetry.',
      businessContext: 'Created from workspace quick action.',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      stakeholders: [
        {
          name: leadName.trim() || 'Srivatsav Damaraju',
          role: 'Project Owner',
          email: 'srivatsav@ingen.ai',
          avatar: '👑',
          lead: true
        }
      ],
      journal: [
        {
          timestamp: 'Just now',
          author: leadName.trim() || 'Srivatsav Damaraju',
          title: 'Project Initiated',
          content: 'Created workspace and configured initial telemetry pipelines.'
        }
      ],
      qaDatabase: []
    }

    if (onProjectCreated) onProjectCreated(newProject)
    onClose()
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
        style={{ maxWidth: 620 }}
      >
        <div className="connector-modal-header">
          <div className="connector-modal-title-group">
            <div className="connector-icon-wrapper" style={{ backgroundColor: '#fff7ed' }}>
              <FolderPlus size={20} color="#ea580c" />
            </div>
            <div>
              <h2 className="connector-modal-heading">Create New Project</h2>
              <p className="connector-modal-subheading">
                Establish a collaborative workspace for models, datasets, and stakeholders
              </p>
            </div>
          </div>
          <button className="connector-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="connector-modal-body">
          <div className="conn-grid-2">
            <div className="conn-field-group">
              <label className="conn-field-label">Project Name *</label>
              <input
                type="text"
                required
                className="conn-input"
                placeholder="e.g. APAC Growth & Revenue Expansion"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="conn-field-group">
              <label className="conn-field-label">Category</label>
              <select
                className="conn-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Customer Analytics">Customer Analytics</option>
                <option value="Model Optimization">Model Optimization</option>
                <option value="Sales Intelligence">Sales Intelligence</option>
                <option value="Marketing Attribution">Marketing Attribution</option>
                <option value="Platform Engineering">Platform Engineering</option>
              </select>
            </div>
          </div>

          <div className="conn-field-group" style={{ marginBottom: 16 }}>
            <label className="conn-field-label">Primary Objective</label>
            <input
              type="text"
              className="conn-input"
              placeholder="e.g. Reduce churn by 18% and synthesize Q4 renewal cohorts"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          <div className="conn-field-group" style={{ marginBottom: 16 }}>
            <label className="conn-field-label">Description & Scope</label>
            <textarea
              className="conn-input"
              rows={2}
              style={{ resize: 'none' }}
              placeholder="Provide context, key deliverables, and target timelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="conn-grid-3">
            <div className="conn-field-group">
              <label className="conn-field-label">Project Lead</label>
              <input
                type="text"
                className="conn-input"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />
            </div>
            <div className="conn-field-group">
              <label className="conn-field-label">Access Level</label>
              <select
                className="conn-input"
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
              >
                <option value="Confidential">Confidential (Restricted)</option>
                <option value="Internal">Internal (Team-wide)</option>
                <option value="Public">Public (Tenant)</option>
              </select>
            </div>
            <div className="conn-field-group">
              <label className="conn-field-label">Tags (comma separated)</label>
              <input
                type="text"
                className="conn-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ARR, Telemetry"
              />
            </div>
          </div>

          <div className="conn-security-banner">
            <Sparkles size={16} className="conn-sec-icon" />
            <span>
              Ingen Connect creates an autonomous agent copilot for this project, indexing all stakeholder queries, datasets, and audit logs.
            </span>
          </div>

          <div className="connector-modal-footer" style={{ margin: '18px -24px -24px', padding: '16px 24px' }}>
            <div className="footer-left"></div>
            <div className="footer-right">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!projectName.trim()}
                className="btn-save-conn"
              >
                Create Project Workspace
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
