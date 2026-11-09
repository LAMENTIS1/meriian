import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Send,
  Sparkles,
  Bot,
  User,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Check,
  ChevronDown
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }

export default function PipelineChatSession({
  dataset,
  availableDatasets = [],
  onSelectDataset,
  onGoToIngenData,
  onClose,
  onOpenFullRecommendation
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const currentDs = dataset || availableDatasets[0] || { name: 'orders', size: '18.4 MB' }

  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'spark-ai',
      timestamp: '15:10',
      text: `Hello! I've loaded your selected dataset **${currentDs.name}** (${currentDs.size || '18.4 MB'}) from IngenData.`,
      data: {
        type: 'initial_analysis',
        pipelineA: {
          name: 'Pipeline A: Data Readiness',
          status: 'Gate Locked (1 Blocker)',
          score: '85/96 Checks Passed',
          blocker: 'Check 1.9: Physician taxonomy collision'
        },
        pipelineB: {
          name: 'Pipeline B: Transformation',
          status: 'Format 1: Calendar Date (99.4%)',
          ruleset: 'public.application_specific_data_ruleset',
          outputs: ['trans_sales_data1', 'trans_sales_data2', 'trans_sales_data3']
        }
      }
    },
    {
      id: 'msg-2',
      sender: 'spark-ai',
      timestamp: '15:10',
      text: 'Would you like me to trigger **Transformation Subgraph 1** now to build customer time-series features, or should we run the auto-fix for **Check 1.9** first to clear the Bayesian Modeling Gate?',
      actions: [
        { id: 'run_transform', label: '⚡ Run Subgraph 1 (Format 1)', primary: true },
        { id: 'fix_blocker', label: '🛡️ Auto-Fix Check 1.9 (Readiness)', secondary: true },
        { id: 'change_file', label: '📂 Select Another File in IngenData', isDataAction: true }
      ]
    }
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSend = (userText) => {
    const textToSend = userText || inputMessage
    if (!textToSend.trim()) return

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsProcessing(true)

    setTimeout(() => {
      const lower = textToSend.toLowerCase()
      let aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'spark-ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: ''
      }

      if (lower.includes('transform') || lower.includes('subgraph') || lower.includes('format')) {
        aiReply.text = `🚀 **Executing Pipeline B (Subgraph 1: Calendar Date Transformation)** using Polars on \`${currentDs.name}\`...\n\n- Sanitized headers & mapped \`[customer_id, product_id, order_date, quantity, revenue]\`\n- Extracted ISO week, month, and quarterly aggregations\n- Standardized 3 Parquet tables materialized into S3 and registered in metadata.`
        aiReply.execution = {
          status: 'SUCCESS',
          runtime: '482ms',
          tables: [
            'trans_sales_data1 (Customer × Product: 24,180 rows)',
            'trans_sales_data2 (Customer × Class: 8,420 rows)',
            'trans_sales_data3 (Market Share Matrix: 24,180 rows)'
          ],
          downstream: 'Ready for Decile, Quartile, Market Dominant, and Customer 360.'
        }
      } else if (lower.includes('fix') || lower.includes('blocker') || lower.includes('1.9') || lower.includes('readiness')) {
        aiReply.text = `🛡️ **Resolving Check 1.9 on Pipeline A: Data Readiness**...\n\n- Applied automated deduplication rules across secondary specialty taxonomy\n- Re-evaluated 96 checks across all 18 validation areas\n- **Gate Verdict: Cleared!** Server-side token issued for downstream Bayesian Causal Modeling.`
        aiReply.readinessCleared = true
      } else if (lower.includes('file') || lower.includes('select') || lower.includes('dataset') || lower.includes('ingendata')) {
        aiReply.text = `You can pick any dataset from your **IngenData lake** using the selector above, or click below to return to the catalog grid:`
        aiReply.actions = [
          { id: 'goto_data', label: '📂 Browse All 12 Files in IngenData', isDataAction: true }
        ]
      } else {
        aiReply.text = `I can execute either pipeline for **${currentDs.name}**:\n\n1. **Pipeline A (Data Readiness)**: Evaluates 96 quality checks across 18 areas to unlock causal modeling.\n2. **Pipeline B (Transformation)**: Routes your data through one of 4 format subgraphs to generate standardized Parquet tables.`
        aiReply.actions = [
          { id: 'run_transform', label: 'Run Transformation Subgraph', primary: true },
          { id: 'fix_blocker', label: 'Resolve Blocker (Check 1.9)', secondary: true },
          { id: 'change_file', label: '📂 Switch Dataset File', isDataAction: true }
        ]
      }

      setMessages((prev) => [...prev, aiReply])
      setIsProcessing(false)
    }, 1200)
  }

  const handleDatasetSwitch = (newDs) => {
    setDropdownOpen(false)
    if (onSelectDataset) onSelectDataset(newDs)

    const switchMsg = {
      id: `msg-${Date.now()}`,
      sender: 'spark-ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Switched target file to **${newDs.name}** (${newDs.size || '31.5 MB'}). Preprocessing checks initialized for ${newDs.name}.`,
      data: {
        type: 'initial_analysis',
        pipelineA: {
          name: 'Pipeline A: Data Readiness',
          status: 'Evaluation In Progress',
          score: '91/96 Checks Passed',
          blocker: 'Check 4.2: NBRx conversion lag'
        },
        pipelineB: {
          name: 'Pipeline B: Transformation',
          status: 'Format 1: Calendar Date (98.7%)',
          ruleset: 'public.application_specific_data_ruleset',
          outputs: ['trans_sales_data1', 'trans_sales_data2', 'trans_sales_data3']
        }
      },
      actions: [
        { id: 'run_transform', label: `⚡ Run Subgraph 1 on ${newDs.name}`, primary: true },
        { id: 'goto_data', label: '📂 View in IngenData Grid', isDataAction: true }
      ]
    }
    setMessages((prev) => [...prev, switchMsg])
  }

  return (
    <div className="pipeline-chat-container">
      {/* Top Header of Chat Session */}
      <div className="pipeline-chat-header">
        <div className="chat-header-title-group">
          <div className="spark-ai-avatar">
            <Sparkles size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="chat-title">Spark AI Pipeline Copilot</span>
              <span className="copilot-live-pill">Active Session</span>
            </div>

            {/* Quick Dataset Selector Dropdown in Chat Header */}
            <div className="chat-dataset-selector-wrap">
              <button
                className="chat-dataset-picker-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
                title="Select active dataset file from IngenData"
              >
                <FileSpreadsheet size={13} color="#107C41" />
                <span>Target: <strong>{currentDs.name}</strong></span>
                <ChevronDown size={12} />
              </button>

              {dropdownOpen && (
                <div className="chat-dataset-dropdown-menu">
                  <div className="dataset-drop-header">IngenData Available Files:</div>
                  <div className="dataset-drop-list">
                    {availableDatasets.map((ds) => (
                      <button
                        key={ds.id}
                        className={`dataset-drop-item ${ds.name === currentDs.name ? 'active' : ''}`}
                        onClick={() => handleDatasetSwitch(ds)}
                      >
                        <FileSpreadsheet size={13} color="#107C41" />
                        <span className="drop-ds-name">{ds.name}</span>
                        <span className="drop-ds-size">{ds.size}</span>
                        {ds.name === currentDs.name && <Check size={12} color="#059669" />}
                      </button>
                    ))}
                  </div>
                  <div className="dataset-drop-footer">
                    <button
                      className="btn-drop-to-ingendata"
                      onClick={() => {
                        setDropdownOpen(false)
                        if (onGoToIngenData) onGoToIngenData()
                      }}
                    >
                      <span>Go to IngenData Catalog →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          {/* Direct "Go to IngenData" Button */}
          {onGoToIngenData && (
            <button
              className="btn-chat-ingendata-nav"
              onClick={onGoToIngenData}
              title="Return to IngenData Catalog for file selection"
            >
              <Database size={13} color="#ea580c" />
              <span>IngenData</span>
            </button>
          )}

          {onOpenFullRecommendation && (
            <button
              className="btn-open-rec-modal"
              onClick={onOpenFullRecommendation}
              title="Open full 18-Area & 4-Subgraph modal"
            >
              <Layers size={13} />
              <span>Full Pipeline View</span>
            </button>
          )}
          {onClose && (
            <button className="btn-close-chat" onClick={onClose} title="Close Chat">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="pipeline-chat-stream">
        {messages.map((m) => (
          <div key={m.id} className={`chat-message-bubble ${m.sender}`}>
            <div className="msg-avatar-col">
              {m.sender === 'spark-ai' ? (
                <div className="msg-bot-icon">
                  <Sparkles size={13} color="#7c3aed" />
                </div>
              ) : (
                <div className="msg-user-icon">
                  <User size={13} color="#ffffff" />
                </div>
              )}
            </div>

            <div className="msg-content-col">
              <div className="msg-meta-row">
                <span className="msg-sender-name">
                  {m.sender === 'spark-ai' ? 'Spark AI Orchestrator' : 'You'}
                </span>
                <span className="msg-timestamp">{m.timestamp}</span>
              </div>

              <div className="msg-text-body">
                {m.text.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '3px 0' }}>
                    {line.includes('**') ? (
                      line.split('**').map((part, pi) =>
                        pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part
                      )
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>

              {/* Initial Analysis Card */}
              {m.data?.type === 'initial_analysis' && (
                <div className="chat-analysis-dual-card">
                  <div className="dual-card-col readiness">
                    <div className="col-top">
                      <ShieldCheck size={14} color="#ea580c" />
                      <span className="col-title">{m.data.pipelineA.name}</span>
                    </div>
                    <span className="col-stat-pill red">{m.data.pipelineA.status}</span>
                    <p className="col-sub">{m.data.pipelineA.score}</p>
                    <p className="col-blocker">{m.data.pipelineA.blocker}</p>
                  </div>

                  <div className="dual-card-col transformation">
                    <div className="col-top">
                      <Cpu size={14} color="#4f46e5" />
                      <span className="col-title">{m.data.pipelineB.name}</span>
                    </div>
                    <span className="col-stat-pill green">{m.data.pipelineB.status}</span>
                    <p className="col-sub">Ruleset: <code>{m.data.pipelineB.ruleset}</code></p>
                    <p className="col-outputs">3 Parquet Outputs Ready</p>
                  </div>
                </div>
              )}

              {/* Execution Result Box */}
              {m.execution && (
                <div className="chat-exec-success-box">
                  <div className="exec-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <strong>Pipeline B Execution Completed ({m.execution.runtime})</strong>
                    </div>
                  </div>
                  <div className="exec-tables-list">
                    {m.execution.tables.map((t, idx) => (
                      <div key={idx} className="exec-table-item">
                        <FileSpreadsheet size={12} color="#059669" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="exec-downstream-hint">
                    {m.execution.downstream}
                  </div>
                </div>
              )}

              {/* Readiness Cleared Box */}
              {m.readinessCleared && (
                <div className="chat-gate-cleared-box">
                  <CheckCircle2 size={16} color="#059669" />
                  <div>
                    <span className="gate-title">Modelling Gate Cleared (96/96 Checks Passed)</span>
                    <span className="gate-desc">
                      Check 1.9 deduplication completed. Authorized clearance token generated for Bayesian Causal Analysis.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {m.actions && (
                <div className="msg-actions-row">
                  {m.actions.map((act) => {
                    if (act.isDataAction) {
                      return (
                        <button
                          key={act.id}
                          className="btn-chat-action data-action"
                          onClick={() => {
                            if (onGoToIngenData) onGoToIngenData()
                          }}
                        >
                          <Database size={12} color="#ea580c" />
                          <span>{act.label}</span>
                        </button>
                      )
                    }
                    return (
                      <button
                        key={act.id}
                        className={`btn-chat-action ${act.primary ? 'primary' : ''} ${act.secondary ? 'secondary' : ''}`}
                        onClick={() => handleSend(act.label)}
                      >
                        {act.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="chat-processing-indicator">
            <Sparkles size={14} className="spinning-sparkle" />
            <span>Spark AI is analyzing pipelines & executing tool...</span>
          </div>
        )}
      </div>

      {/* Input bar with quick IngenData picker trigger */}
      <div className="pipeline-chat-input-area">
        <button
          className="btn-chat-input-data-icon"
          title="Pick file from IngenData"
          onClick={() => {
            if (onGoToIngenData) onGoToIngenData()
          }}
        >
          <Database size={15} color="#ea580c" />
        </button>
        <input
          type="text"
          className="chat-input-field"
          placeholder="Ask Spark AI (e.g. 'Run Subgraph 1', 'Explain Check 1.9', or 'Select new file')..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
        />
        <button
          className="btn-chat-send"
          disabled={!inputMessage.trim() || isProcessing}
          onClick={() => handleSend()}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
