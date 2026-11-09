import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Database,
  Users,
  Activity,
  AlertTriangle,
  FolderKanban,
  Sparkles
} from 'lucide-react'

const appleSpring = { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }

export default function NotificationsDropdown({ isOpen, onClose, onNavigate }) {
  if (!isOpen) return null

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'New Telemetry Dataset Synced',
      desc: 'Kafka-Dataset completed hourly vector chunking with zero errors.',
      time: '5m ago',
      unread: true,
      type: 'dataset',
      targetView: 'ingen-data'
    },
    {
      id: 'notif-2',
      title: 'Stakeholder Added to Project',
      desc: 'Sarah Lin joined Customer Performance Analysis workspace.',
      time: '24m ago',
      unread: true,
      type: 'project',
      targetView: 'ingen-connect'
    },
    {
      id: 'notif-3',
      title: 'Ingen Optim Token Alert',
      desc: 'Autonomous query caching reduced latency by 34% on Postgres queries.',
      time: '1h ago',
      unread: false,
      type: 'optim',
      targetView: 'ingen-optim'
    },
    {
      id: 'notif-4',
      title: 'Ingen Tracker Audit Verified',
      desc: 'SOC2 immutable ledger trace checkpoint completed for Q4 batch.',
      time: '3h ago',
      unread: false,
      type: 'tracker',
      targetView: 'ingen-tracker'
    }
  ])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <>
      <div className="notif-dropdown-backdrop" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={appleSpring}
        className="notif-dropdown-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notif-header">
          <div className="notif-header-title-row">
            <span className="notif-title">Notifications</span>
            {unreadCount > 0 && (
              <span className="notif-badge-pill">{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-read-btn" onClick={markAllRead}>
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.unread ? 'unread' : ''}`}
              onClick={() => {
                markAsRead(n.id)
                if (onNavigate && n.targetView) {
                  onNavigate(n.targetView)
                  onClose()
                }
              }}
            >
              <div className="notif-icon-box">
                {n.type === 'dataset' && <Database size={15} color="#ea580c" />}
                {n.type === 'project' && <FolderKanban size={15} color="#2563eb" />}
                {n.type === 'optim' && <Sparkles size={15} color="#16a34a" />}
                {n.type === 'tracker' && <Activity size={15} color="#9333ea" />}
              </div>
              <div className="notif-content">
                <div className="notif-item-header">
                  <span className="notif-item-title">{n.title}</span>
                  <span className="notif-time">{n.time}</span>
                </div>
                <p className="notif-desc">{n.desc}</p>
              </div>
              {n.unread && <span className="notif-unread-dot" />}
            </div>
          ))}
        </div>

        <div className="notif-footer">
          <button
            className="notif-view-all-btn"
            onClick={() => {
              if (onNavigate) onNavigate('ingen-tracker')
              onClose()
            }}
          >
            <span>View Full Audit Log & Telemetry →</span>
          </button>
        </div>
      </motion.div>
    </>
  )
}
