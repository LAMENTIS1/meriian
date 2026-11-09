import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  SquarePen,
  Library as LibraryIcon,
  Plug,
  FolderOpen,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ArrowUp,
  Globe,
  Code2,
  Video,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  MoreHorizontal,
  Paperclip,
  Database,
  Telescope,
  Wand2,
  Gauge,
  ChevronRight,
  Network,
  Users,
  Zap,
  Activity,
  Command,
  RotateCw,
  PieChart,
  Split,
  TrendingUp,
  Bell,
  Plus,
  FolderPlus,
  LogOut
} from 'lucide-react'
import './App.css'
import './modules.css'
import './connectorModal.css'
import './chatgptTheme.css'
import './darkTheme.css'

// Page Components
import IngenConnect from './pages/IngenConnect'
import IngenCustomer from './pages/IngenCustomer'
import IngenOptim from './pages/IngenOptim'
import IngenTracker from './pages/IngenTracker'
import IngenData from './pages/IngenData'
import Library from './pages/Library'
import CustomerPerformanceWorkspace from './pages/CustomerPerformanceWorkspace'
import Login, { DEMO_USERS } from './pages/Login'
import ConnectorModal from './components/ConnectorModal'
import CreateProjectModal from './components/CreateProjectModal'
import NotificationsDropdown from './components/NotificationsDropdown'
import { initialProjects } from './data/projectsData'

// Apple Minimalist Hexagonal Spark Logo
function SparkLogo({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <polygon
        points="50,6 90,28 90,72 50,94 10,72 10,28"
        stroke="#ea580c"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="50" cy="50" r="7" stroke="#ea580c" strokeWidth="3" fill="#fed7aa" />
      <circle cx="50" cy="6" r="3.5" fill="#ea580c" />
      <circle cx="90" cy="28" r="3.5" fill="#ea580c" />
      <circle cx="90" cy="72" r="3.5" fill="#ea580c" />
      <circle cx="50" cy="94" r="3.5" fill="#ea580c" />
      <circle cx="10" cy="72" r="3.5" fill="#ea580c" />
      <circle cx="10" cy="28" r="3.5" fill="#ea580c" />

      <line x1="50" y1="6" x2="50" y2="43" stroke="#ea580c" strokeWidth="2" />
      <line x1="50" y1="57" x2="50" y2="94" stroke="#ea580c" strokeWidth="2" />
      <line x1="10" y1="28" x2="44" y2="46" stroke="#ea580c" strokeWidth="2" />
      <line x1="56" y1="54" x2="90" y2="72" stroke="#ea580c" strokeWidth="2" />
      <line x1="90" y1="28" x2="56" y2="46" stroke="#ea580c" strokeWidth="2" />
      <line x1="44" y1="54" x2="10" y2="72" stroke="#ea580c" strokeWidth="2" />

      <line x1="50" y1="6" x2="90" y2="72" stroke="#ea580c" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="50" y1="6" x2="10" y2="72" stroke="#ea580c" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="10" y1="28" x2="90" y2="28" stroke="#ea580c" strokeWidth="1.2" strokeOpacity="0.7" />
      <line x1="10" y1="72" x2="90" y2="72" stroke="#ea580c" strokeWidth="1.2" strokeOpacity="0.7" />
    </svg>
  )
}

const appleDefaultSpring = {
  type: 'spring',
  damping: 30,
  stiffness: 300,
  mass: 0.8
}

const appleTapGesture = { scale: 0.97 }

export default function App() {
  const getInitialView = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase()
    if (hash === 'login' || hash === 'signin') return 'login'
    if (hash === 'performance' || hash === 'workspace' || hash === 'customer-performance') return 'customer-performance'
    if (hash === 'ingenconnect' || hash === 'connect') return 'ingen-connect'
    if (hash === 'customer' || hash === 'ingencustomer') return 'ingen-customer'
    if (hash === 'optim' || hash === 'ingenoptim') return 'ingen-optim'
    if (hash === 'tracker' || hash === 'ingentracker') return 'ingen-tracker'
    if (hash === 'data' || hash === 'ingendata' || hash === 'files') return 'ingen-data'
    if (hash === 'connectors') return 'connectors'
    if (hash === 'library') return 'library'
    return 'home'
  }

  const [currentView, setCurrentView] = useState(getInitialView)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('spark_theme') || 'default')

  // Logged-in user state (defaults to Demo Admin or saved session)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('spark_user')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return DEMO_USERS[0]
  })

  const handleLogin = (user) => {
    setCurrentUser(user)
    try {
      localStorage.setItem('spark_user', JSON.stringify(user))
    } catch {
      // ignore
    }
    navigateTo('home')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem('spark_user')
    } catch {
      // ignore
    }
  }

  // Apply data-theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
    localStorage.setItem('spark_theme', themeMode)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'default') return 'dark'
      if (prev === 'dark') return 'chatgpt'
      return 'default'
    })
  }

  // Listen to hash change
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(getInitialView())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateTo = (viewId) => {
    setCurrentView(viewId)
    const hashMap = {
      home: '',
      login: 'login',
      library: 'library',
      connectors: 'connectors',
      'ingen-connect': 'ingenconnect',
      'ingen-data': 'ingendata',
      'ingen-customer': 'customer',
      'ingen-optim': 'optim',
      'ingen-tracker': 'tracker',
      'customer-performance': 'customer-performance'
    }
    window.location.hash = hashMap[viewId] ? `#/${hashMap[viewId]}` : '#/'
  }

  // Prompt states
  const [prompt, setPrompt] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Slash commands registry
  const slashCommands = [
    {
      id: 'ingen-customer',
      command: '/customer',
      title: 'Ingen Customer',
      desc: 'Account health, conversations & churn prevention',
      icon: Users,
      keywords: ['/ing', '/ingen', '/customer', '/ingencustomer']
    },
    {
      id: 'ingen-optim',
      command: '/optim',
      title: 'Ingen Optim',
      desc: 'Autonomous performance tuning, token savings & SQL speedup',
      icon: Zap,
      keywords: ['/ing', '/ingen', '/optim', '/ingenoptim']
    },
    {
      id: 'ingen-tracker',
      command: '/tracker',
      title: 'Ingen Tracker',
      desc: 'Immutable audit trails, agent telemetry & compliance traces',
      icon: Activity,
      keywords: ['/ing', '/ingen', '/tracker', '/ingentracker']
    },
    {
      id: 'ingen-connect',
      command: '/ingenconnect',
      title: 'Ingen Connect',
      desc: 'Integration fabric, CDC pipelines & streaming webhooks',
      icon: Network,
      keywords: ['/ing', '/ingen', '/connect', '/ingenconnect']
    },
    {
      id: 'ingen-data',
      command: '/ingendata',
      title: 'Ingen Data (Files)',
      desc: 'Vector repository, dataset chunking & document RAG',
      icon: FolderOpen,
      keywords: ['/ing', '/ingen', '/data', '/ingendata', '/files']
    }
  ]

  // Detect if user typed a slash command starting with / or /ing
  const isTypingSlash = prompt.trim().startsWith('/')
  const slashQuery = prompt.trim().toLowerCase()

  const matchingCommands = isTypingSlash
    ? slashCommands.filter((cmd) => {
        // If user typed /ing, match all commands that have /ing as keyword
        if (slashQuery.startsWith('/ing')) return true
        if (slashQuery === '/') return true
        return (
          cmd.command.toLowerCase().includes(slashQuery) ||
          cmd.title.toLowerCase().includes(slashQuery.replace('/', '')) ||
          cmd.keywords.some((k) => k.startsWith(slashQuery))
        )
      })
    : []

  const handleSelectCommand = (cmd) => {
    navigateTo(cmd.id)
    setPrompt('')
  }

  // Keyboard navigation for slash menu
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleKeyDown = (e) => {
    if (matchingCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % matchingCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + matchingCommands.length) % matchingCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (matchingCommands[selectedIndex]) {
          handleSelectCommand(matchingCommands[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        setPrompt('')
      }
    }
  }

  // Tools in Prompt
  const [mcpActive, setMcpActive] = useState(false)
  const [connectorsActive, setConnectorsActive] = useState(false)
  const [openDataActive, setOpenDataActive] = useState(false)
  const [researchCanvasActive, setResearchCanvasActive] = useState(false)

  // Model Tier
  const [modelTier, setModelTier] = useState('Lite')
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false)
  const tierRef = useRef(null)

  // Connectors filter & search
  const [connectorFilter, setConnectorFilter] = useState('All')
  const [searchConnectorQuery, setSearchConnectorQuery] = useState('')
  const [selectedConnectorForModal, setSelectedConnectorForModal] = useState(null)

  // Global Project & Notification Modals
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [currentProject, setCurrentProject] = useState(initialProjects[0])
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false)
  const [connectAccordionOpen, setConnectAccordionOpen] = useState(true)
  const [connectActiveSubTab, setConnectActiveSubTab] = useState('projects') // 'projects' | 'teams' | 'activity'

  const tiers = [
    {
      id: 'Lite',
      name: 'Lite',
      desc: 'Swift everyday intelligence for summaries and quick lookups',
      colorClass: 'lite'
    },
    {
      id: 'Moderate',
      name: 'Moderate',
      desc: 'Balanced capability for data modeling, analytics and reports',
      colorClass: 'moderate'
    },
    {
      id: 'Heavy',
      name: 'Heavy',
      desc: 'Deep multi-agent reasoning, research canvas and MCP synthesis',
      colorClass: 'heavy'
    }
  ]

  const sidebarNavItems = [
    { id: 'home', label: 'New Task', icon: SquarePen },
    { id: 'library', label: 'Library', icon: LibraryIcon },
    { id: 'connectors', label: 'Data Connectors', icon: Plug },
    { id: 'ingen-connect', label: 'Ingen Connect', icon: Network },
    { id: 'ingen-data', label: 'Ingen Data (Files)', icon: FolderOpen },
    { id: 'ingen-customer', label: 'Ingen Customer', icon: Users },
    { id: 'ingen-optim', label: 'Ingen Optim', icon: Zap },
    { id: 'ingen-tracker', label: 'Ingen Tracker', icon: Activity }
  ]

  const connectorsList = [
    {
      id: 'postgres',
      name: 'Postgres',
      desc: 'Direct connection to PostgreSQL databases with instant semantic queries',
      type: 'Database',
      iconBg: '#eff6ff',
      iconText: '🐘'
    },
    {
      id: 'bigquery',
      name: 'BigQuery',
      desc: 'Google Cloud data warehouse connection with zero ETL pipelines',
      type: 'Data Warehouse',
      iconBg: '#eff6ff',
      iconText: '🔍'
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      desc: 'Enterprise analytical tables and cloud data warehouse integration',
      type: 'Data Warehouse',
      iconBg: '#f0f9ff',
      iconText: '❄️'
    },
    {
      id: 'mysql',
      name: 'MySQL',
      desc: 'Relational database schema inspection and live analysis',
      type: 'Database',
      iconBg: '#ecfeff',
      iconText: '🐬'
    },
    {
      id: 'sqlserver',
      name: 'SqlServer',
      desc: 'Microsoft SQL Server enterprise connector with live sync',
      type: 'Database',
      iconBg: '#fef2f2',
      iconText: '🗄️'
    },
    {
      id: 'supabase',
      name: 'Supabase',
      desc: 'Postgres with auto-generated APIs and real-time subscriptions',
      type: 'Database',
      iconBg: '#f0fdf4',
      iconText: '⚡'
    },
    {
      id: 'gdrive',
      name: 'Google Drive',
      desc: 'Direct document search and folder extraction for workspace tasks',
      type: 'Integration',
      iconBg: '#fef2f2',
      iconText: '📁'
    },
    {
      id: 'gsheets',
      name: 'Google Sheets',
      desc: 'Live bidirectional sync with spreadsheets and financial models',
      type: 'Integration',
      iconBg: '#f0fdf4',
      iconText: '📊'
    },
    {
      id: 'onedrive',
      name: 'Microsoft OneDrive',
      desc: 'Personal OneDrive synchronization and collaborative document indexing',
      type: 'Integration',
      iconBg: '#eff6ff',
      iconText: '☁️',
      isNew: true
    },
    {
      id: 'sharepoint',
      name: 'SharePoint',
      desc: 'Enterprise SharePoint knowledge repository and document libraries',
      type: 'Integration',
      iconBg: '#f0fdfa',
      iconText: '📑',
      isNew: true
    },
    {
      id: 'googleads',
      name: 'Google Ads',
      desc: 'Campaign performance telemetry, attribution models and ROAS data',
      type: 'Integration',
      iconBg: '#fefce8',
      iconText: '📈',
      isNew: true
    },
    {
      id: 'metaads',
      name: 'Meta Ads',
      desc: 'Cross-channel ad spend, conversion matrix and creative tracking',
      type: 'Integration',
      iconBg: '#eff6ff',
      iconText: '♾️',
      isNew: true
    }
  ]

  const filteredConnectors = connectorsList.filter((c) => {
    const matchesFilter =
      connectorFilter === 'All'
        ? true
        : connectorFilter === 'Data Warehouses'
        ? c.type === 'Data Warehouse'
        : connectorFilter === 'Databases'
        ? c.type === 'Database'
        : connectorFilter === 'Integrations'
        ? c.type === 'Integration'
        : true

    const matchesSearch =
      c.name.toLowerCase().includes(searchConnectorQuery.toLowerCase()) ||
      c.desc.toLowerCase().includes(searchConnectorQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const categories = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
    { id: 'slides', label: 'Slides', icon: Presentation },
    { id: 'more', label: 'More', icon: MoreHorizontal }
  ]

  const templates = [
    {
      id: 1,
      title: 'Q4 Board Update',
      subtitle: 'ARR $18.4M (+24% YoY) on two record quarters',
      category: 'Board Update',
      theme: 'preview-board',
      tag: 'Executive'
    },
    {
      id: 2,
      title: 'MARKETING CHANNEL PERFORMANCE',
      subtitle: 'Channel efficiency & pipeline generation matrix',
      category: 'Performance Report',
      theme: 'preview-marketing',
      tag: 'Growth'
    },
    {
      id: 3,
      title: 'Quarterly Business Review: Marketing',
      subtitle: 'Target vs Actual CAC & LTV multi-region overview',
      category: 'QBR',
      theme: 'preview-qbr',
      tag: 'Strategy'
    },
    {
      id: 4,
      title: 'PRODUCT SURVEY 4',
      subtitle: 'NPS breakdown & cohort sentiment metrics',
      category: 'Survey Readout',
      theme: 'preview-survey',
      tag: 'Analytics'
    },
    {
      id: 5,
      title: 'Profitable growth, predictable engine.',
      subtitle: 'Unit economics and capital efficiency metrics',
      category: 'Investor Update',
      theme: 'preview-investor',
      tag: 'Finance'
    },
    {
      id: 6,
      title: 'Verdara rooted in ritual',
      subtitle: 'Brand identity & go-to-market rollout deck',
      category: 'Product Launch',
      theme: 'preview-product',
      tag: 'Launch'
    },
    {
      id: 7,
      title: 'Paid Search Performance',
      subtitle: 'Ad spend optimization & keyword conversion analysis',
      category: 'Campaign Update',
      theme: 'preview-campaign',
      tag: 'Paid Media'
    },
    {
      id: 8,
      title: 'The Field Notes Workshop',
      subtitle: 'Interactive discovery session & team outcomes',
      category: 'Workshop',
      theme: 'preview-workshop',
      tag: 'Design'
    }
  ]

  useEffect(() => {
    function handleClickOutside(event) {
      if (tierRef.current && !tierRef.current.contains(event.target)) {
        setTierDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getViewTitle = () => {
    switch (currentView) {
      case 'login':
        return 'Sign In'
      case 'customer-performance':
        return 'Customer Performance Analysis'
      case 'home':
        return 'Workspace'
      case 'library':
        return 'Library'
      case 'connectors':
        return 'Data Connectors'
      case 'ingen-connect':
        return 'Ingen Connect'
      case 'ingen-data':
        return 'Ingen Data'
      case 'ingen-customer':
        return 'Ingen Customer'
      case 'ingen-optim':
        return 'Ingen Optim'
      case 'ingen-tracker':
        return 'Ingen Tracker'
      default:
        return 'Ingenspark'
    }
  }

  // Authentication Gate: When not signed in or on login view, show ONLY the dedicated Login page!
  if (!currentUser || currentView === 'login') {
    return (
      <div className="login-standalone-root">
        <div className="bg-ambient">
          <div className="ambient-blob-1" />
        </div>
        <Login
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onCancel={() => {
            if (!currentUser) handleLogin(DEMO_USERS[0])
            else navigateTo('home')
          }}
        />
      </div>
    )
  }

  return (
    <div className="app-layout">
      <div className="bg-ambient">
        <div className="ambient-blob-1" />
      </div>

      {/* =========================================================
          APPLE TRANSLUCENT SIDEBAR
          ========================================================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={appleDefaultSpring}
            className="sidebar"
          >
            <div className="sidebar-header">
              <a href="#/" className="sidebar-brand" onClick={() => navigateTo('home')}>
                <SparkLogo size={20} />
                <span className="sidebar-brand-name">
                  Ingen<span className="accent">spark</span>
                </span>
              </a>
              <button
                className="sidebar-collapse-btn"
                onClick={() => setSidebarOpen(false)}
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            <div className="sidebar-body">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                const isConnect = item.id === 'ingen-connect'

                if (isConnect) {
                  return (
                    <div key={item.id} className="sidebar-nav-group">
                      <motion.button
                        whileTap={appleTapGesture}
                        transition={appleDefaultSpring}
                        className={`sidebar-nav-item has-accordion ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          navigateTo('ingen-connect')
                          setConnectAccordionOpen((prev) => !prev)
                        }}
                      >
                        <div className="sidebar-nav-left">
                          <Icon size={16} strokeWidth={1.8} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`accordion-chevron ${connectAccordionOpen ? 'expanded' : ''}`}
                        />
                      </motion.button>

                      {/* Expandable sub-tree matching user's exact uploaded image */}
                      <AnimatePresence>
                        {connectAccordionOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={appleDefaultSpring}
                            className="sidebar-sub-tree"
                          >
                            <div className="sidebar-tree-branch" />
                            <button
                              className={`sidebar-sub-item ${
                                currentView === 'ingen-connect' && connectActiveSubTab === 'projects'
                                  ? 'active'
                                  : ''
                              }`}
                              onClick={() => {
                                navigateTo('ingen-connect')
                                setConnectActiveSubTab('projects')
                              }}
                            >
                              <FolderOpen
                                size={15}
                                className="sidebar-sub-icon folder"
                                color={
                                  currentView === 'ingen-connect' && connectActiveSubTab === 'projects'
                                    ? '#ea580c'
                                    : 'currentColor'
                                }
                              />
                              <span>Projects</span>
                            </button>

                            <button
                              className={`sidebar-sub-item ${
                                currentView === 'ingen-connect' && connectActiveSubTab === 'teams'
                                  ? 'active'
                                  : ''
                              }`}
                              onClick={() => {
                                navigateTo('ingen-connect')
                                setConnectActiveSubTab('teams')
                              }}
                            >
                              <Users size={15} className="sidebar-sub-icon" />
                              <span>Teams</span>
                            </button>

                            <button
                              className={`sidebar-sub-item ${
                                currentView === 'ingen-connect' && connectActiveSubTab === 'activity'
                                  ? 'active'
                                  : ''
                              }`}
                              onClick={() => {
                                navigateTo('ingen-connect')
                                setConnectActiveSubTab('activity')
                              }}
                            >
                              <Activity size={15} className="sidebar-sub-icon" />
                              <span>Activity</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                return (
                  <motion.button
                    key={item.id}
                    whileTap={appleTapGesture}
                    transition={appleDefaultSpring}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigateTo(item.id)}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </motion.button>
                )
              })}

              {/* Quick Add Project Sidebar Action */}
              <div className="sidebar-action-row" style={{ marginTop: 6, marginBottom: 8 }}>
                <button
                  className="sidebar-add-project-btn"
                  onClick={() => setCreateProjectModalOpen(true)}
                  title="Create new project workspace"
                >
                  <Plus size={14} strokeWidth={2.2} />
                  <span>New Project</span>
                </button>
              </div>

              <div className="sidebar-section-title">Recent Tasks</div>

              <div
                className={`recent-task-link ${currentView === 'customer-performance' ? 'active' : ''}`}
                onClick={() => navigateTo('customer-performance')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RotateCw size={13} strokeWidth={1.8} color="#64748b" />
                  <span>Customer Performance An...</span>
                </div>
              </div>

              <div
                className="recent-task-link"
                onClick={() => alert('Opening Q4 Marketing Mix Analysis')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <PieChart size={13} strokeWidth={1.8} color="#64748b" />
                  <span>Q4 Marketing Mix Analysis</span>
                </div>
              </div>

              <div
                className="recent-task-link"
                onClick={() => alert('Opening A/B Test - Campaign B')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Split size={13} strokeWidth={1.8} color="#64748b" />
                  <span>A/B Test – Campaign B</span>
                </div>
              </div>

              <div
                className="recent-task-link"
                onClick={() => alert('Opening Sales Drivers - Pharma')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <TrendingUp size={13} strokeWidth={1.8} color="#64748b" />
                  <span>Sales Drivers – Pharma</span>
                </div>
              </div>

              <div
                className="recent-view-all-link"
                onClick={() => navigateTo('customer-performance')}
              >
                <span>View All →</span>
              </div>
            </div>

            <div className="sidebar-footer">
              <div
                className="user-profile"
                onClick={() => navigateTo('login')}
                style={{ cursor: 'pointer' }}
                title="Account & Login settings"
              >
                <div
                  className="user-avatar"
                  style={{
                    backgroundColor: currentUser?.avatarBg || '#ea580c'
                  }}
                >
                  {currentUser?.initials || '??'}
                </div>
                <div className="user-info">
                  <div className="user-name">{currentUser?.name || 'Guest User'}</div>
                  <div className="user-plan">{currentUser?.plan || 'Sign in to sync'}</div>
                </div>
              </div>
              <button
                className="settings-btn"
                onClick={handleLogout}
                title="Sign out of account"
              >
                <LogOut size={15} strokeWidth={1.8} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* =========================================================
          MAIN VIEWPORT
          ========================================================= */}
      <div className="main-viewport">
        {currentView !== 'login' && (
          <header className="top-app-bar">
            <div className="top-bar-left">
              {!sidebarOpen && (
                <button
                  className="bar-icon-btn"
                  onClick={() => setSidebarOpen(true)}
                  title="Open Sidebar"
                >
                  <PanelLeft size={17} strokeWidth={1.8} />
                </button>
              )}
              <span className="top-bar-title">{getViewTitle()}</span>
            </div>

            <div className="top-bar-right">
              {/* Current Active Project Selector Pill (changes to current project where he is in) */}
              <div className="top-bar-project-selector">
                <motion.button
                  whileTap={appleTapGesture}
                  transition={appleDefaultSpring}
                  className={`btn-current-project-pill ${projectSelectorOpen ? 'active' : ''}`}
                  onClick={() => setProjectSelectorOpen((prev) => !prev)}
                  title="Current Active Project Workspace"
                >
                  <span className="current-proj-dot" />
                  <span className="current-proj-name">{currentProject?.name || 'Customer 360 Graph'}</span>
                  <ChevronDown size={13} color="var(--apple-text-3)" />
                </motion.button>

                {/* Project Quick Switcher Dropdown */}
                <AnimatePresence>
                  {projectSelectorOpen && (
                    <>
                      <div
                        className="proj-dropdown-backdrop"
                        onClick={() => setProjectSelectorOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={appleDefaultSpring}
                        className="proj-dropdown-menu"
                      >
                        <div className="proj-dropdown-header">Active Project Workspaces</div>
                        <div className="proj-dropdown-list">
                          {initialProjects.map((p) => (
                            <button
                              key={p.id}
                              className={`proj-dropdown-item ${currentProject?.id === p.id ? 'active' : ''}`}
                              onClick={() => {
                                setCurrentProject(p)
                                setProjectSelectorOpen(false)
                                navigateTo('ingen-connect')
                              }}
                            >
                              <div className="proj-drop-info">
                                <span className="proj-drop-title">{p.name}</span>
                                <span className="proj-drop-sub">{p.category} · {p.accessLevel}</span>
                              </div>
                              {currentProject?.id === p.id && (
                                <span className="current-proj-dot" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="proj-dropdown-footer">
                          <button
                            className="proj-drop-create-btn"
                            onClick={() => {
                              setProjectSelectorOpen(false)
                              setCreateProjectModalOpen(true)
                            }}
                          >
                            <Plus size={13} />
                            <span>Create New Project</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle Button (Light -> Dark -> ChatGPT) */}
              <motion.button
                whileTap={appleTapGesture}
                transition={appleDefaultSpring}
                className="theme-switch-pill"
                onClick={toggleTheme}
                title={`Active Theme: ${themeMode.toUpperCase()}. Click to cycle (Dark -> ChatGPT -> Light).`}
              >
                <span className="theme-dot" />
                <span>
                  {themeMode === 'dark'
                    ? '🌙 Dark Theme'
                    : themeMode === 'chatgpt'
                    ? '📄 ChatGPT Style'
                    : '☀️ Light Theme'}
                </span>
              </motion.button>

              {/* Notification Bell Button */}
              <motion.button
                whileTap={appleTapGesture}
                transition={appleDefaultSpring}
                className={`btn-notification-top ${notifDropdownOpen ? 'active' : ''}`}
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
                title="Notifications"
              >
                <Bell size={16} strokeWidth={1.8} />
                <span className="notif-badge-indicator" />
              </motion.button>

              {/* Notifications Dropdown Card */}
              <NotificationsDropdown
                isOpen={notifDropdownOpen}
                onClose={() => setNotifDropdownOpen(false)}
                onNavigate={navigateTo}
              />

              {currentUser ? (
                <motion.button
                  whileTap={appleTapGesture}
                  transition={appleDefaultSpring}
                  className="btn-ghost-top"
                  onClick={() => navigateTo('login')}
                  title="Account & Session"
                >
                  <span>{currentUser.name.split(' ')[0]}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>({currentUser.plan?.split(' ')[0] || 'User'})</span>
                </motion.button>
              ) : (
                <button className="btn-ghost-top" onClick={() => navigateTo('login')}>
                  Sign In
                </button>
              )}
              <motion.button
                whileTap={appleTapGesture}
                transition={appleDefaultSpring}
                className="btn-primary-top"
                onClick={handleLogout}
                title="Sign out of account"
              >
                Sign Out
              </motion.button>
            </div>
          </header>
        )}

        {/* ---------------------------------------------------------
            ROUTED VIEW DISPATCHER
            --------------------------------------------------------- */}
        {currentView === 'login' ? (
          <Login
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onCancel={() => navigateTo('home')}
          />
        ) : currentView === 'customer-performance' ? (
          <CustomerPerformanceWorkspace />
        ) : currentView === 'ingen-connect' ? (
          <IngenConnect
            currentProjectId={currentProject?.id}
            initialSection={connectActiveSubTab}
            onSelectProject={(projId) => {
              const found = initialProjects.find((p) => p.id === projId)
              if (found) setCurrentProject(found)
            }}
          />
        ) : currentView === 'ingen-customer' ? (
          <IngenCustomer />
        ) : currentView === 'ingen-optim' ? (
          <IngenOptim />
        ) : currentView === 'ingen-tracker' ? (
          <IngenTracker />
        ) : currentView === 'ingen-data' ? (
          <IngenData onNavigate={navigateTo} />
        ) : currentView === 'connectors' ? (
          <div className="connectors-page">
            <div className="connectors-header">
              <h1 className="connectors-title">Connectors & MCPs</h1>
              <p className="connectors-desc">
                Connect your team data directly to run instant, privacy-aware AI workflows.
              </p>
            </div>

            <h2 className="connectors-section-heading">Available Integrations</h2>

            <div className="connectors-filter-bar">
              <div className="filter-tabs">
                {['All', 'Data Warehouses', 'Databases', 'Integrations'].map((tab) => (
                  <button
                    key={tab}
                    className={`filter-tab ${connectorFilter === tab ? 'active' : ''}`}
                    onClick={() => setConnectorFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="search-connectors-input-wrap">
                <Search size={14} className="search-connectors-icon" strokeWidth={1.8} />
                <input
                  type="text"
                  placeholder="Search connectors"
                  className="search-connectors-input"
                  value={searchConnectorQuery}
                  onChange={(e) => setSearchConnectorQuery(e.target.value)}
                />
              </div>
            </div>

            <motion.div layout className="connectors-grid">
              {filteredConnectors.map((c) => (
                <motion.div
                  layout
                  key={c.id}
                  whileTap={appleTapGesture}
                  transition={appleDefaultSpring}
                  className="connector-card"
                  onClick={() => setSelectedConnectorForModal(c)}
                >
                  <div className="connector-card-header">
                    <div
                      className="connector-icon-wrapper"
                      style={{ backgroundColor: c.iconBg }}
                    >
                      <span>{c.iconText}</span>
                    </div>

                    <div className="connector-info">
                      <div className="connector-name-row">
                        <span className="connector-name">{c.name}</span>
                        {c.isNew && <span className="badge-new">New</span>}
                      </div>
                      <p className="connector-desc">{c.desc}</p>
                    </div>
                  </div>

                  <div className="connector-card-footer">
                    <span className="connector-tag-pill">{c.type}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Connector Configuration & Code Modal */}
            <ConnectorModal
              connector={selectedConnectorForModal}
              onClose={() => setSelectedConnectorForModal(null)}
              onSaveConnection={(savedConn) => {
                console.log('Saved connector:', savedConn)
              }}
            />
          </div>
        ) : currentView === 'library' ? (
          <Library onNavigate={navigateTo} />
        ) : (
          /* HOME AI WORKSPACE (New Task with Slash Command /ing Support) */
          <div className="main-stage">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={appleDefaultSpring}
              whileTap={appleTapGesture}
              className="banner-pill"
              onClick={() => navigateTo('connectors')}
            >
              <span className="pill-tag">New</span>
              <span>Connectors & MCPs are live</span>
              <ChevronRight size={13} strokeWidth={2} style={{ marginLeft: 2 }} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={appleDefaultSpring}
              className="hero-heading"
            >
              What can I do for you today?
            </motion.h1>
            <p className="hero-subtitle">
              Type <strong style={{ color: '#ea580c' }}>/ing</strong> to jump directly to Customer, Optim, Tracker or Connect.
            </p>

            {/* Apple Refined Prompt Surface with Slash Palette Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={appleDefaultSpring}
              className={`prompt-card ${isFocused ? 'focused' : ''}`}
            >
              {/* Apple Spotlight Style Slash Palette */}
              <AnimatePresence>
                {matchingCommands.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={appleDefaultSpring}
                    className="slash-palette-popover"
                  >
                    <div className="slash-palette-header">
                      <span>Ingenspark Modules</span>
                      <span className="slash-palette-kbd">↑↓ to navigate • ↵ to select</span>
                    </div>

                    <div className="slash-palette-list">
                      {matchingCommands.map((cmd, idx) => {
                        const Icon = cmd.icon
                        const isSelected = selectedIndex === idx
                        return (
                          <button
                            key={cmd.id}
                            className={`slash-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className="slash-item-icon-box">
                              <Icon size={16} strokeWidth={1.8} />
                            </div>
                            <div className="slash-item-content">
                              <div className="slash-item-title-row">
                                <span className="slash-item-title">{cmd.title}</span>
                                <span className="slash-item-command">{cmd.command}</span>
                              </div>
                              <span className="slash-item-desc">{cmd.desc}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                className="prompt-input"
                rows={2}
                placeholder="Type /ing for modules, or describe a task..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  // Slight delay so click in popover registers before blur
                  setTimeout(() => setIsFocused(false), 200)
                }}
              />

              <div className="prompt-toolbar">
                <div className="toolbar-left">
                  <motion.button
                    whileTap={appleTapGesture}
                    className="tool-icon-btn"
                    title="Attach files"
                    onClick={() => alert('Attach file')}
                  >
                    <Paperclip size={16} strokeWidth={1.8} />
                  </motion.button>

                  <motion.button
                    whileTap={appleTapGesture}
                    className={`tool-icon-btn ${mcpActive ? 'active' : ''}`}
                    title="MCP (Model Context Protocol)"
                    onClick={() => setMcpActive(!mcpActive)}
                  >
                    <Wand2 size={16} strokeWidth={1.8} />
                  </motion.button>

                  <motion.button
                    whileTap={appleTapGesture}
                    className={`tool-icon-btn ${connectorsActive ? 'active' : ''}`}
                    title="Connectors"
                    onClick={() => {
                      setConnectorsActive(!connectorsActive)
                      navigateTo('connectors')
                    }}
                  >
                    <Plug size={16} strokeWidth={1.8} />
                  </motion.button>

                  <motion.button
                    whileTap={appleTapGesture}
                    className={`tool-chip ${openDataActive ? 'active' : ''}`}
                    onClick={() => setOpenDataActive(!openDataActive)}
                  >
                    <Database size={14} strokeWidth={1.8} />
                    <span>Data</span>
                  </motion.button>
                </div>

                <div className="toolbar-right">
                  <div className="tier-selector-container" ref={tierRef}>
                    <motion.button
                      whileTap={appleTapGesture}
                      className={`tier-selector-btn ${tierDropdownOpen ? 'open' : ''}`}
                      onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
                    >
                      <Gauge size={13} strokeWidth={1.8} />
                      <span>{modelTier}</span>
                      <div
                        className={`tier-indicator ${
                          modelTier === 'Lite'
                            ? 'lite'
                            : modelTier === 'Moderate'
                            ? 'moderate'
                            : 'heavy'
                        }`}
                      />
                      <ChevronDown size={12} strokeWidth={2} />
                    </motion.button>

                    <AnimatePresence>
                      {tierDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 6 }}
                          transition={appleDefaultSpring}
                          className="tier-dropdown"
                        >
                          {tiers.map((t) => (
                            <button
                              key={t.id}
                              className={`tier-item ${modelTier === t.id ? 'active' : ''}`}
                              onClick={() => {
                                setModelTier(t.id)
                                setTierDropdownOpen(false)
                              }}
                            >
                              <div
                                className={`tier-indicator ${t.colorClass}`}
                                style={{ marginTop: 4 }}
                              />
                              <div className="tier-item-info">
                                <div className="tier-item-name">{t.name}</div>
                                <div className="tier-item-desc">{t.desc}</div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileTap={prompt.trim() ? appleTapGesture : {}}
                    className={`send-btn ${prompt.trim() ? 'active' : ''}`}
                    disabled={!prompt.trim()}
                    onClick={() => {
                      alert(`Executing query on [${modelTier} Tier]: "${prompt}"`)
                      setPrompt('')
                    }}
                  >
                    <ArrowUp size={16} strokeWidth={2.4} />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="templates-grid">
              {templates.map((item) => (
                <motion.div
                  key={item.id}
                  whileTap={appleTapGesture}
                  transition={appleDefaultSpring}
                  className="template-card"
                  onClick={() => setPrompt(`Generate report for: ${item.title}`)}
                >
                  <div className={`template-card-preview ${item.theme}`}>
                    <div className="mini-doc-content">
                      <div className="mini-title">{item.title}</div>
                      <div className="mini-subtitle">{item.subtitle}</div>
                      <div className="mini-lines">
                        <div className="mini-line" style={{ width: '80%' }} />
                        <div className="mini-line" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="template-card-footer">
                    <span className="template-name">{item.category}</span>
                    <span className="template-badge">{item.tag}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {currentView !== 'login' && (
          <footer className="page-footer">
            <p className="copyright">Copyright 2026 · All Rights Reserved</p>
            <div className="footer-brand">
              <SparkLogo size={18} />
              <span>Ingenspark</span>
            </div>
          </footer>
        )}
      </div>

      {/* Global Create Project Modal */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          navigateTo('ingen-connect')
        }}
      />
    </div>
  )
}
