import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Filter,
  Plus,
  Pin,
  Sparkles,
  Users,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Send,
  Bot,
  User,
  Tag,
  Clock,
  CheckCircle2,
  FolderKanban,
  FileText,
  Lock,
  Layers,
  ArrowUpRight,
  Activity,
  FolderOpen,
  Folder
} from 'lucide-react'
import { initialProjects } from '../data/projectsData'
import CreateProjectModal from '../components/CreateProjectModal'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
const tapGesture = { scale: 0.97 }

export default function IngenConnect({ currentProjectId, initialSection = 'projects', onSelectProject }) {
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId || null)
  const [mainNavSection, setMainNavSection] = useState(initialSection) // 'projects' | 'teams' | 'activity'
  const [projectFilterScope, setProjectFilterScope] = useState('all') // 'all' | 'my' | 'associated'
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'pinned' | 'recommended'
  const [selectedTag, setSelectedTag] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)

  // Sync with prop if it changes
  React.useEffect(() => {
    if (currentProjectId && currentProjectId !== selectedProjectId) {
      setSelectedProjectId(currentProjectId)
    }
  }, [currentProjectId])

  React.useEffect(() => {
    if (initialSection) {
      setMainNavSection(initialSection)
      if (initialSection === 'projects') {
        setSelectedProjectId(null)
      }
    }
  }, [initialSection])

  const handleSelect = (projId) => {
    setSelectedProjectId(projId)
    if (onSelectProject) onSelectProject(projId)
  }

  // Detail Modal / Sub-tab state
  const [detailTab, setDetailTab] = useState('summary') // 'summary' | 'stakeholders' | 'journal' | 'qa'

  // Q&A state
  const [qaInput, setQaInput] = useState('')
  const [qaMessages, setQaMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am the Ingen Connect Project Copilot. Ask any question about project context, stakeholders, milestones, or technical architecture.'
    }
  ])

  // Get selected project
  const currentProject = projects.find((p) => p.id === selectedProjectId)

  // Toggle Pin
  const togglePin = (e, id) => {
    e.stopPropagation()
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
    )
  }

  // Filter projects
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)))

  const filteredProjects = projects.filter((p) => {
    // Scope filter: My Projects vs Associated Projects
    const isOwner = p.accessLevel === 'Owner' || p.stakeholders.some(s => s.email.includes('srivatsav') && (s.lead || s.role.includes('Owner')))
    const matchesScope =
      projectFilterScope === 'all'
        ? true
        : projectFilterScope === 'my'
        ? (p.accessLevel === 'Owner' || isOwner)
        : (p.accessLevel !== 'Owner' || p.stakeholders.some(s => s.role.includes('Contributor') || s.role.includes('Editor')))

    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'pinned'
        ? p.pinned
        : activeTab === 'recommended'
        ? p.recommended
        : true

    const matchesTag = selectedTag ? p.tags.includes(selectedTag) : true

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesScope && matchesTab && matchesTag && matchesSearch
  })

  // Handle Q&A send
  const handleSendQa = (e) => {
    e.preventDefault()
    if (!qaInput.trim() || !currentProject) return

    const userText = qaInput.trim()
    setQaMessages((prev) => [...prev, { sender: 'user', text: userText }])
    setQaInput('')

    // Generate intelligent contextual response
    setTimeout(() => {
      const match = currentProject.qaDatabase?.find((item) =>
        userText.toLowerCase().includes(item.question.toLowerCase().split(' ')[1] || '')
      )

      let answer = ''
      if (match) {
        answer = match.answer
      } else if (userText.toLowerCase().includes('who') || userText.toLowerCase().includes('owner') || userText.toLowerCase().includes('lead')) {
        const lead = currentProject.stakeholders.find((s) => s.lead)
        answer = `The project owner and lead is ${lead?.name} (${lead?.role}, ${lead?.email}). There are ${currentProject.stakeholders.length} total active contributors.`
      } else if (userText.toLowerCase().includes('objective') || userText.toLowerCase().includes('goal')) {
        answer = `Project Objective: "${currentProject.objective}"\nBusiness Context: ${currentProject.businessContext}`
      } else if (userText.toLowerCase().includes('update') || userText.toLowerCase().includes('journal') || userText.toLowerCase().includes('recent')) {
        const latest = currentProject.journal[0]
        answer = `Latest update (${latest?.timestamp}) by ${latest?.author}: "${latest?.title}" - ${latest?.content}`
      } else {
        answer = `According to the ${currentProject.name} project context: This project is categorized under ${currentProject.category} with status '${currentProject.status}' (${currentProject.progress}% complete). Relevant tags: ${currentProject.tags.join(', ')}.`
      }

      setQaMessages((prev) => [...prev, { sender: 'bot', text: answer }])
    }, 450)
  }

  // =========================================================
  // VIEW: PROJECT DETAIL VIEW
  // =========================================================
  if (currentProject) {
    return (
      <div className="module-page">
        {/* Back navigation */}
        <div style={{ marginBottom: 18 }}>
          <motion.button
            whileTap={tapGesture}
            transition={appleSpring}
            className="apple-button-secondary"
            onClick={() => setSelectedProjectId(null)}
          >
            <ArrowLeft size={14} />
            <span>Back to All Projects</span>
          </motion.button>
        </div>

        {/* Project Header Card */}
        <div className="project-detail-hero">
          <div className="project-detail-hero-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="project-category-badge">{currentProject.category}</span>
              <span className="project-status-pill">{currentProject.status}</span>
              <span className="access-level-pill">
                <ShieldCheck size={12} />
                Access: {currentProject.accessLevel}
              </span>
            </div>
            <h1 className="project-detail-title">{currentProject.name}</h1>
            <p className="project-detail-desc">{currentProject.description}</p>
          </div>

          <div className="project-detail-hero-right">
            <motion.button
              whileTap={tapGesture}
              transition={appleSpring}
              className={`pin-action-btn ${currentProject.pinned ? 'pinned' : ''}`}
              onClick={(e) => togglePin(e, currentProject.id)}
            >
              <Pin size={15} />
              <span>{currentProject.pinned ? 'Pinned' : 'Pin Project'}</span>
            </motion.button>
          </div>
        </div>

        {/* Apple Segmented Nav Tabs for Detail View */}
        <div className="project-detail-tabs-bar">
          <div className="segmented-control">
            {[
              { id: 'summary', label: 'Summary & Context', icon: FileText },
              { id: 'stakeholders', label: 'Stakeholders', icon: Users },
              { id: 'journal', label: 'Project Journal', icon: BookOpen },
              { id: 'qa', label: 'Project Q&A Copilot', icon: Bot }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`segmented-btn ${detailTab === tab.id ? 'active' : ''}`}
                  onClick={() => setDetailTab(tab.id)}
                >
                  <Icon size={14} style={{ marginRight: 6 }} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* TAB 1: SUMMARY & BUSINESS CONTEXT */}
        {detailTab === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={appleSpring}
            className="detail-content-grid"
          >
            <div className="detail-card">
              <h3 className="detail-card-heading">Project Objective</h3>
              <p className="detail-card-text">{currentProject.objective}</p>

              <h3 className="detail-card-heading" style={{ marginTop: 22 }}>
                Business Context & Impact
              </h3>
              <p className="detail-card-text">{currentProject.businessContext}</p>

              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--apple-border-subtle)' }}>
                <span className="detail-card-meta-label">Progress & Milestones</span>
                <div className="project-progress-bar-bg" style={{ marginTop: 8 }}>
                  <div className="project-progress-bar-fill" style={{ width: `${currentProject.progress}%` }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--apple-text-2)', marginTop: 4, display: 'inline-block' }}>
                  {currentProject.progress}% of technical milestones completed
                </span>
              </div>
            </div>

            <div className="detail-card">
              <h3 className="detail-card-heading">Project Tags & Architecture</h3>
              <div className="project-tags-wrap" style={{ marginTop: 10 }}>
                {currentProject.tags.map((tag) => (
                  <span key={tag} className="project-tag-pill">
                    <Tag size={11} />
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="detail-card-heading" style={{ marginTop: 24 }}>
                Key Stakeholders
              </h3>
              <div className="stakeholder-preview-list">
                {currentProject.stakeholders.map((s, idx) => (
                  <div key={idx} className="stakeholder-mini-row">
                    <div className="stakeholder-avatar">{s.avatar}</div>
                    <div className="stakeholder-mini-info">
                      <div className="stakeholder-mini-name">
                        {s.name} {s.lead && <span className="lead-tag">Owner</span>}
                      </div>
                      <div className="stakeholder-mini-role">{s.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: STAKEHOLDER MANAGEMENT */}
        {detailTab === 'stakeholders' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={appleSpring}
            className="apple-glass-panel"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 className="detail-card-heading">Project Stakeholders & Access Roles</h3>
                <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginTop: 2 }}>
                  Role-based membership with verified security permissions.
                </p>
              </div>
              <button className="apple-button-primary" onClick={() => alert('Invite new stakeholder')}>
                <Plus size={14} />
                <span>Add Stakeholder</span>
              </button>
            </div>

            <div className="stakeholders-grid">
              {currentProject.stakeholders.map((s, idx) => (
                <div key={idx} className="stakeholder-card">
                  <div className="stakeholder-card-top">
                    <div className="stakeholder-avatar-lg">{s.avatar}</div>
                    <div>
                      <div className="stakeholder-card-name">
                        {s.name} {s.lead && <span className="lead-tag">Lead</span>}
                      </div>
                      <div className="stakeholder-card-role">{s.role}</div>
                    </div>
                  </div>
                  <div className="stakeholder-card-email">{s.email}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: PROJECT JOURNAL */}
        {detailTab === 'journal' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={appleSpring}
            className="apple-glass-panel"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 className="detail-card-heading">Project Journal & Historical Activity</h3>
                <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginTop: 2 }}>
                  Immutable chronological updates, engineering notes, and team sync entries.
                </p>
              </div>
              <button className="apple-button-primary" onClick={() => alert('Add journal entry')}>
                <Plus size={14} />
                <span>New Entry</span>
              </button>
            </div>

            <div className="journal-timeline">
              {currentProject.journal.map((entry) => (
                <div key={entry.id} className="journal-entry-card">
                  <div className="journal-entry-header">
                    <div className="journal-entry-title">{entry.title}</div>
                    <span className="journal-entry-time">{entry.timestamp}</span>
                  </div>
                  <div className="journal-entry-author">
                    Logged by <strong>{entry.author}</strong> ({entry.role})
                  </div>
                  <p className="journal-entry-content">{entry.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 4: PROJECT Q&A COPILOT */}
        {detailTab === 'qa' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={appleSpring}
            className="apple-glass-panel"
          >
            <div style={{ marginBottom: 16 }}>
              <h3 className="detail-card-heading">Project Contextual Q&A</h3>
              <p style={{ fontSize: 13, color: 'var(--apple-text-2)', marginTop: 2 }}>
                Query project documentation, stakeholders, architecture and decisions using natural language.
              </p>
            </div>

            {/* Chat History Box */}
            <div className="qa-chat-box">
              {qaMessages.map((msg, idx) => (
                <div key={idx} className={`qa-message-row ${msg.sender}`}>
                  <div className="qa-avatar-bubble">
                    {msg.sender === 'bot' ? <Bot size={15} /> : <User size={15} />}
                  </div>
                  <div className="qa-message-bubble">
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendQa} className="qa-input-bar">
              <input
                type="text"
                placeholder={`Ask anything about ${currentProject.name}...`}
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                className="qa-text-input"
              />
              <button type="submit" className="qa-send-btn" disabled={!qaInput.trim()}>
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </div>
    )
  }

  // =========================================================
  // VIEW: MAIN PROJECTS DISCOVERY WORKSPACE
  // =========================================================
  return (
    <div className="module-page">
      {/* Header */}
      <div className="module-page-header">
        <div>
          <div className="module-pre-title">Ingenspark Discovery & Collaboration</div>
          <h1 className="module-title">Ingen Connect</h1>
          <p className="module-subtitle">
            Centralized workspace to discover projects, follow team activity, identify stakeholders and query project knowledge.
          </p>
        </div>
        <div className="module-header-actions">
          <motion.button
            whileTap={tapGesture}
            transition={appleSpring}
            className="apple-button-primary"
            onClick={() => setCreateProjectModalOpen(true)}
          >
            <Plus size={15} />
            <span>New Project</span>
          </motion.button>
        </div>
      </div>

      {/* 3-Section Hub Navigation: Projects, Teams, Activity */}
      <div className="connect-tri-nav">
        <button
          className={`tri-nav-btn ${mainNavSection === 'projects' ? 'active' : ''}`}
          onClick={() => setMainNavSection('projects')}
        >
          <FolderKanban size={15} />
          <span>Projects</span>
          <span className="tri-count-pill">{projects.length}</span>
        </button>

        <button
          className={`tri-nav-btn ${mainNavSection === 'teams' ? 'active' : ''}`}
          onClick={() => setMainNavSection('teams')}
        >
          <Users size={15} />
          <span>Teams</span>
          <span className="tri-count-pill">18</span>
        </button>

        <button
          className={`tri-nav-btn ${mainNavSection === 'activity' ? 'active' : ''}`}
          onClick={() => setMainNavSection('activity')}
        >
          <Activity size={15} />
          <span>Activity</span>
          <span className="tri-count-pill">Live</span>
        </button>
      </div>

      {/* SECTION 1: PROJECTS HUB */}
      {mainNavSection === 'projects' && (
        <>
          {/* Quick Access Filter Tabs & Tag Bar */}
          <div className="projects-controls-bar">
            {/* Apple Segmented Tabs with My Projects & Associated Projects */}
            <div className="segmented-control">
              {[
                { id: 'all', label: `All (${projects.length})` },
                { id: 'my', label: `My Projects (${projects.filter(p => p.accessLevel === 'Owner').length})` },
                { id: 'associated', label: `Associated Projects (${projects.filter(p => p.accessLevel !== 'Owner').length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`segmented-btn ${projectFilterScope === tab.id ? 'active' : ''}`}
                  onClick={() => setProjectFilterScope(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-status filters */}
            <div className="segmented-control" style={{ marginLeft: 8 }}>
              {[
                { id: 'all', label: 'All Status' },
                { id: 'pinned', label: `Pinned (${projects.filter((p) => p.pinned).length})` },
                { id: 'recommended', label: `Recommended (${projects.filter((p) => p.recommended).length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`segmented-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="search-wrap" style={{ minWidth: 240, marginLeft: 'auto' }}>
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search projects, objectives or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="apple-search-input"
              />
            </div>
          </div>

          {/* Project Tags Bar */}
          <div className="project-tags-filter-row">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-text-2)', marginRight: 4 }}>
              Filter by Tag:
            </span>
            <button
              className={`project-tag-pill ${selectedTag === null ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`project-tag-pill ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="projects-card-grid">
            {filteredProjects.map((proj) => (
              <motion.div
                key={proj.id}
                whileHover={{ y: -3 }}
                whileTap={tapGesture}
                transition={appleSpring}
                className="apple-project-card"
                onClick={() => {
                  handleSelect(proj.id)
                  setDetailTab('summary')
                }}
              >
                {/* Top row with Category and Pin */}
                <div className="project-card-top-row">
                  <span className="project-category-badge">{proj.category}</span>
                  <button
                    className={`project-pin-btn ${proj.pinned ? 'pinned' : ''}`}
                    onClick={(e) => togglePin(e, proj.id)}
                    title={proj.pinned ? 'Unpin project' : 'Pin project'}
                  >
                    <Pin size={14} />
                  </button>
                </div>

                {/* Title & Desc */}
                <h3 className="project-card-title">{proj.name}</h3>
                <p className="project-card-desc">{proj.description}</p>

                {/* Tags */}
                <div className="project-card-tags">
                  {proj.tags.slice(0, 3).map((t) => (
                    <span key={t} className="project-mini-tag">
                      #{t}
                    </span>
                  ))}
                  {proj.tags.length > 3 && (
                    <span className="project-mini-tag">+{proj.tags.length - 3}</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 'auto', paddingTop: 14 }}>
                  <div className="project-progress-bar-bg">
                    <div className="project-progress-bar-fill" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>

                {/* Footer row: Stakeholder avatars & View arrow */}
                <div className="project-card-footer">
                  <div className="project-stakeholder-avatars">
                    {proj.stakeholders.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="mini-avatar-overlap" title={`${s.name} (${s.role})`}>
                        {s.avatar}
                      </div>
                    ))}
                    {proj.stakeholders.length > 3 && (
                      <div className="mini-avatar-overlap more">+{proj.stakeholders.length - 3}</div>
                    )}
                  </div>

                  <div className="project-open-link">
                    <span>View Context</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* SECTION 2: TEAMS HUB */}
      {mainNavSection === 'teams' && (
        <div className="teams-grid">
          {[
            {
              name: 'Core Data & Platform Eng',
              lead: 'Sarah Chen',
              members: ['SC', 'DM', 'SD', 'ER', 'KS'],
              role: 'Snowflake ETL, CDC streaming & vector pipelines',
              projectsCount: 4,
              color: '#eff6ff',
              icon: '⚡'
            },
            {
              name: 'Customer Intelligence & Churn',
              lead: 'Amara Okafor',
              members: ['AO', 'KS', 'RZ', 'SD'],
              role: 'Customer 360, retention models & ticket triage',
              projectsCount: 3,
              color: '#fff7ed',
              icon: '🎯'
            },
            {
              name: 'Finance & Autonomous Audit',
              lead: 'Marcus Vance',
              members: ['MV', 'RZ', 'SD'],
              role: 'Stripe, ERP reconciliation & balance ledger bots',
              projectsCount: 2,
              color: '#f0fdf4',
              icon: '⚖️'
            }
          ].map((team, idx) => (
            <div key={idx} className="team-card">
              <div className="team-card-header">
                <div className="team-avatar-box" style={{ backgroundColor: team.color }}>
                  <span>{team.icon}</span>
                </div>
                <span className="status-pill live">{team.projectsCount} Projects</span>
              </div>
              <h3 className="team-card-title">{team.name}</h3>
              <p className="team-card-role">{team.role}</p>

              <div className="team-members-avatars">
                {team.members.map((m, mIdx) => (
                  <div key={mIdx} className="team-member-chip">{m}</div>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--apple-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--apple-text-3)' }}>Lead: <strong>{team.lead}</strong></span>
                <button className="apple-button-secondary" style={{ padding: '3px 8px', fontSize: 11 }}>View Team</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: ACTIVITY HUB */}
      {mainNavSection === 'activity' && (
        <div className="activity-hub-card">
          <div className="activity-hub-header">
            <h3 className="activity-hub-title">Live Cross-Project Activity Stream</h3>
            <span className="status-pill live">Synced 1 min ago</span>
          </div>
          <div className="activity-list">
            {[
              {
                user: 'David Miller',
                action: 'deployed Snowflake CDC identity stitching webhook',
                project: 'Customer 360 & Unified Identity Graph',
                time: '12 mins ago',
                icon: <Database size={15} color="#2563eb" />
              },
              {
                user: 'Marcus Vance',
                action: 'reconciled $48M discrepancy run across 48,200 transactions',
                project: 'Autonomous Financial Reconciliation Bot',
                time: '45 mins ago',
                icon: <CheckCircle2 size={15} color="#16a34a" />
              },
              {
                user: 'Kenji Sato',
                action: 'optimized semantic cache latency to 11.8ms on 250M embeddings',
                project: 'Real-Time Vector Pipeline & Semantic Cache',
                time: '2 hours ago',
                icon: <Zap size={15} color="#ea580c" />
              },
              {
                user: 'Elena Rostova',
                action: 'granted SOC2 audit certification on customer identity nodes',
                project: 'Customer 360 & Unified Identity Graph',
                time: 'Yesterday',
                icon: <ShieldCheck size={15} color="#9333ea" />
              }
            ].map((act, i) => (
              <div key={i} className="activity-row-item">
                <div className="activity-icon-badge">{act.icon}</div>
                <div className="activity-info">
                  <div className="activity-title-line">
                    <div>
                      <span className="activity-user-bold">{act.user}</span>{' '}
                      <span style={{ fontSize: 13, color: 'var(--apple-text-2)' }}>{act.action}</span>
                    </div>
                    <span className="activity-time-stamp">{act.time}</span>
                  </div>
                  <span className="activity-project-tag">{act.project}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev])
          setSelectedProjectId(newProj.id)
        }}
      />
    </div>
  )
}
