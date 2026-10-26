'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export function AdminLoginUnifiedClient() {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isPendingLogin, setIsPendingLogin] = useState(false)

  // Registration State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regRole, setRegRole] = useState<'staff' | 'admin'>('staff')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState(false)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Handle Admin Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsPendingLogin(false)

    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both your email and password.')
      return
    }

    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.pendingApproval) {
          setIsPendingLogin(true)
        }
        throw new Error(data.error || 'Failed to sign in. Please verify your credentials.')
      }

      setSuccessMsg(data.message || 'Authentication successful. Opening dashboard...')
      setTimeout(() => {
        window.location.href = '/admin'
      }, 600)
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Admin / Staff Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)

    if (!regName.trim() || regName.trim().length < 2) {
      setRegError('Please enter your full name (at least 2 characters).')
      return
    }

    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setRegError('Please enter a valid email address.')
      return
    }

    if (!regPassword || regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long.')
      return
    }

    setRegLoading(true)
    try {
      const res = await fetch('/api/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
          role: regRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account. Please try again.')
      }

      setRegSuccess(true)
    } catch (err: any) {
      setRegError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--theme-bg, #FAFAF9)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--theme-elevation-0, #FFFFFF)',
          border: '1px solid var(--theme-elevation-150, #E5E7EB)',
          borderRadius: '16px',
          boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.06)',
          padding: '32px 28px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '30px' }}>🌿</span>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 800,
                fontFamily: 'serif',
                color: '#1B5E20',
                letterSpacing: '-0.5px',
              }}
            >
              Flavourite
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: 700,
              color: '#15803D',
              marginBottom: '6px',
            }}
          >
            Bakery & Cafe • Administration Portal
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--theme-elevation-600, #6B7280)' }}>
            Authorized staff and administrator management system
          </p>
        </div>

        {/* Success Global Message */}
        {successMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--theme-elevation-100, #F3F4F6)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin')
              setLoginError(null)
              setIsPendingLogin(false)
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '7px',
              cursor: 'pointer',
              background: activeTab === 'signin' ? 'var(--theme-elevation-0, #FFFFFF)' : 'transparent',
              color: activeTab === 'signin' ? '#15803D' : 'var(--theme-elevation-700, #4B5563)',
              boxShadow: activeTab === 'signin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🔐 Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register')
              setRegError(null)
              setRegSuccess(false)
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '7px',
              cursor: 'pointer',
              background: activeTab === 'register' ? 'var(--theme-elevation-0, #FFFFFF)' : 'transparent',
              color: activeTab === 'register' ? '#15803D' : 'var(--theme-elevation-700, #4B5563)',
              boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ✨ Create Account
          </button>
        </div>

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <div>
            {loginError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isPendingLogin ? '#FFFBEB' : '#FEF2F2',
                  border: isPendingLogin ? '1px solid #FDE68A' : '1px solid #FECACA',
                  color: isPendingLogin ? '#92400E' : '#B91C1C',
                  fontSize: '13px',
                  marginBottom: '16px',
                  lineHeight: 1.45,
                }}
              >
                {loginError}
              </div>
            )}

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  htmlFor="admin-email"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--theme-elevation-800, #374151)',
                  }}
                >
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="e.g. gvihari8@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--theme-elevation-0, #FFFFFF)',
                    color: 'var(--theme-elevation-1000, #111827)',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--theme-elevation-800, #374151)',
                  }}
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--theme-elevation-0, #FFFFFF)',
                    color: 'var(--theme-elevation-1000, #111827)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading || !loginEmail || !loginPassword}
                style={{
                  marginTop: '4px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#15803D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: loginLoading || !loginEmail || !loginPassword ? 'not-allowed' : 'pointer',
                  opacity: loginLoading || !loginEmail || !loginPassword ? 0.6 : 1,
                  transition: 'background 0.15s ease',
                }}
              >
                {loginLoading ? 'Signing in...' : 'Sign In to Dashboard →'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: CREATE ACCOUNT (WITH APPROVAL FLOW) */}
        {activeTab === 'register' && (
          <div>
            {regSuccess ? (
              <div
                style={{
                  padding: '20px 16px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
                  Account Created & Pending Approval
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#047857', lineHeight: 1.5 }}>
                  Your account <strong>{regEmail}</strong> has been registered successfully.
                  <br /><br />
                  For security, an existing store administrator must approve your account under <strong>Settings → Staff & Admins</strong> before you can log in.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin')
                    setLoginEmail(regEmail)
                    setRegSuccess(false)
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Go to Sign In →
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    color: '#92400E',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    marginBottom: '16px',
                  }}
                >
                  🛡️ <strong>Approval Required:</strong> New accounts are created with <em>Pending</em> status and must be verified by an existing administrator before accessing store data.
                </div>

                {regError && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#B91C1C',
                      fontSize: '12px',
                      marginBottom: '16px',
                      lineHeight: 1.4,
                    }}
                  >
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label
                      htmlFor="reg-name"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: 'var(--theme-elevation-800, #374151)',
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: 'var(--theme-elevation-800, #374151)',
                      }}
                    >
                      Work Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="e.g. name@flavouritefood.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: 'var(--theme-elevation-800, #374151)',
                      }}
                    >
                      Mobile Number <span style={{ color: '#9CA3AF', fontWeight: 'normal' }}>(Optional)</span>
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-password"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: 'var(--theme-elevation-800, #374151)',
                      }}
                    >
                      Password <span style={{ color: '#9CA3AF', fontWeight: 'normal' }}>(Min. 8 characters)</span>
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-role"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        color: 'var(--theme-elevation-800, #374151)',
                      }}
                    >
                      Role Requested
                    </label>
                    <select
                      id="reg-role"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as 'staff' | 'admin')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                    >
                      <option value="staff">👨‍🍳 Staff Member (Orders & Kitchen View)</option>
                      <option value="admin">👑 Administrator (Full Store Access)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading || !regName || !regEmail || regPassword.length < 8}
                    style={{
                      marginTop: '6px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#15803D',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: regLoading || !regName || !regEmail || regPassword.length < 8 ? 'not-allowed' : 'pointer',
                      opacity: regLoading || !regName || !regEmail || regPassword.length < 8 ? 0.6 : 1,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {regLoading ? 'Registering Account...' : 'Request Staff Account →'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Back to Storefront Link */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: '12px',
              color: 'var(--theme-elevation-500, #6B7280)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}
