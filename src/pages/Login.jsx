import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import heroImg from '../assets/hero.png'
import './Login.css'

// Wireframe Hexagon Logo matching the screenshot
function HexagonSparkLogo({ size = 38 }) {
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

// Brand title with orange spark
function IngenSparkBrand({ size = 26 }) {
  return (
    <div className="ingenspark-brand-title" style={{ fontSize: size }}>
      <HexagonSparkLogo size={size + 10} />
      <span className="brand-text">
        Ingen<span className="brand-spark">⚡</span>park
      </span>
    </div>
  )
}

export const DEMO_USERS = [
  {
    id: 'user-superadmin',
    name: 'Super Admin Demo',
    username: 'superadmindemo',
    email: 'superadmindemo@ingenspark.com',
    role: 'Workspace Administrator',
    plan: 'Enterprise Pro',
    initials: 'SA',
    avatarBg: '#ea580c'
  },
  {
    id: 'user-srivatsav',
    name: 'Srivatsav Damaraju',
    username: 'srivatsav',
    email: 'srivatsav@ingenspark.ai',
    role: 'Workspace Owner & Lead Architect',
    plan: 'Enterprise Pro',
    initials: 'SD',
    avatarBg: '#ea580c'
  }
]

export default function Login({ currentUser, onLogin, onLogout }) {
  const [username, setUsername] = useState('superadmindemo')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setFeedback(null)

    setTimeout(() => {
      setIsLoading(false)
      const matchedUser =
        DEMO_USERS.find(
          (u) =>
            u.username.toLowerCase() === username.trim().toLowerCase() ||
            u.email.toLowerCase() === username.trim().toLowerCase()
        ) || {
          id: `user-${Date.now()}`,
          name: username.trim() || 'Super Admin Demo',
          username: username.trim(),
          email: `${username.trim()}@ingenspark.com`,
          role: 'Workspace Administrator',
          plan: 'Enterprise Pro',
          initials: 'SA',
          avatarBg: '#ea580c'
        }

      if (onLogin) onLogin(matchedUser)
    }, 400)
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    setFeedback(`Password reset instructions have been dispatched for user: ${username || 'superadmindemo'}`)
  }

  const handleSSO = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      if (onLogin) onLogin(DEMO_USERS[0])
    }, 400)
  }

  return (
    <div className="login-exact-screen">
      {/* Top Banner Notice */}
      <div className="login-exact-top-banner">
        <span>For pricing and licensing details, please contact 609-454-0172 or sales@ingenworks.com</span>
      </div>

      {/* Main Split Content Area */}
      <div className="login-exact-main-container">
        {/* Left Column: Hero Illustration + Tagline */}
        <div className="login-exact-left-column">
          <div className="hero-illustration-wrapper">
            <img
              src={heroImg}
              alt="Ingenious bots connecting data and teams"
              className="hero-illustration-img"
            />
          </div>
          <div className="hero-tagline-block">
            <h2 className="tagline-orange">Ingenious</h2>
            <h2 className="tagline-dark">bots connecting</h2>
            <h2 className="tagline-dark">data and teams</h2>
          </div>
        </div>

        {/* Right Column: Exact Form */}
        <div className="login-exact-right-column">
          <div className="login-form-card">
            {/* Logo */}
            <div className="login-logo-container">
              <IngenSparkBrand size={26} />
            </div>

            {/* Title */}
            <h1 className="login-heading">
              {mode === 'login' ? 'Login to your Ingenspark Account' : 'Register for an Ingenspark Account'}
            </h1>

            {feedback && (
              <div className="login-feedback-alert">
                {feedback}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="exact-login-form">
              {/* Username Field */}
              <div className="exact-form-group">
                <label className="exact-label">Username *</label>
                <input
                  type="text"
                  className="exact-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmindemo"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="exact-form-group" style={{ marginTop: 14 }}>
                <label className="exact-label">Password *</label>
                <div className="exact-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="exact-input exact-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="exact-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye size={16} color="#64748b" /> : <EyeOff size={16} color="#64748b" />}
                  </button>
                </div>
              </div>

              {/* Action Row: Forgot Password on left, Orange Login on right */}
              <div className="exact-action-row">
                <a
                  href="#forgot"
                  className="exact-green-link"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </a>

                <button
                  type="submit"
                  className="exact-login-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : mode === 'login' ? 'Login' : 'Register'}
                </button>
              </div>

              {/* Secondary Links in Green */}
              <div className="exact-secondary-links">
                <div>
                  <a
                    href="#register"
                    className="exact-green-link"
                    onClick={(e) => {
                      e.preventDefault()
                      setMode(mode === 'login' ? 'register' : 'login')
                    }}
                  >
                    {mode === 'login' ? 'Register' : 'Back to Login'}
                  </a>
                </div>
                <div>
                  <a
                    href="#sso"
                    className="exact-green-link"
                    onClick={handleSSO}
                  >
                    Login with SSO
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer matching screenshot */}
      <footer className="login-exact-footer">
        <div className="login-footer-left">
          <span>Copyright 2026 · All Rights Reserved</span>
        </div>
        <div className="login-footer-right">
          <IngenSparkBrand size={17} />
        </div>
      </footer>
    </div>
  )
}
