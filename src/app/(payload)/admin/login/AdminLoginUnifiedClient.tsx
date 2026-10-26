'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export function AdminLoginUnifiedClient() {
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone')

  // Phone OTP State
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp' | 'pending'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  // Email/Password State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const startResendTimer = () => {
    setResendTimer(30)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle Phone OTP Send
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPhoneError(null)

    const clean = phone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setPhoneLoading(true)
    try {
      const res = await fetch('/api/admin/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code')

      setIsNewUser(Boolean(data.isNewUser))
      setPhoneStep('otp')
      startResendTimer()
    } catch (err: any) {
      setPhoneError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setPhoneLoading(false)
    }
  }

  // Handle Phone OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)

    const clean = phone.replace(/\D/g, '').slice(-10)
    const cleanOtp = otp.trim()

    if (cleanOtp.length !== 6) {
      setPhoneError('Please enter the 6-digit verification code.')
      return
    }

    if (isNewUser && (!name || name.trim().length === 0)) {
      setPhoneError('Please enter your full name.')
      return
    }

    setPhoneLoading(true)
    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clean,
          otp: cleanOtp,
          name: name.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      if (data.pendingApproval) {
        setPhoneStep('pending')
        return
      }

      setSuccessMsg(data.message || 'Authentication successful. Opening dashboard...')
      setTimeout(() => {
        window.location.href = '/admin'
      }, 600)
    } catch (err: any) {
      setPhoneError(err?.message || 'Verification failed. Please check the code.')
    } finally {
      setPhoneLoading(false)
    }
  }

  // Handle Standard Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)

    if (!email || !password) {
      setEmailError('Please enter both email and password.')
      return
    }

    setEmailLoading(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.errors?.[0]?.message || data.error || 'Invalid email or password.'
        throw new Error(msg)
      }

      setSuccessMsg('Login successful. Opening dashboard...')
      setTimeout(() => {
        window.location.href = '/admin'
      }, 600)
    } catch (err: any) {
      setEmailError(err?.message || 'Invalid credentials. Please try again.')
    } finally {
      setEmailLoading(false)
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
          maxWidth: '420px',
          background: 'var(--theme-elevation-0, #FFFFFF)',
          border: '1px solid var(--theme-elevation-150, #E5E7EB)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          padding: '32px 28px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '32px' }}>🌿</span>
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
              marginBottom: '8px',
            }}
          >
            Cafe & Bakery • Admin Portal
          </div>
          <p style={{ fontSize: '13px', color: 'var(--theme-elevation-600, #6B7280)', margin: 0 }}>
            Sign in to manage orders, products, and store settings.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#15803D',
              fontSize: '13px',
              marginBottom: '16px',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--theme-elevation-100, #F3F4F6)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '22px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('phone')
              setPhoneError(null)
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeTab === 'phone' ? 'var(--theme-elevation-0, #FFFFFF)' : 'transparent',
              color:
                activeTab === 'phone'
                  ? 'var(--theme-elevation-1000, #111827)'
                  : 'var(--theme-elevation-600, #6B7280)',
              boxShadow: activeTab === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            📱 Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email')
              setEmailError(null)
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: activeTab === 'email' ? 'var(--theme-elevation-0, #FFFFFF)' : 'transparent',
              color:
                activeTab === 'email'
                  ? 'var(--theme-elevation-1000, #111827)'
                  : 'var(--theme-elevation-600, #6B7280)',
              boxShadow: activeTab === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            ✉️ Email & Password
          </button>
        </div>

        {/* TAB 1: Mobile OTP Login */}
        {activeTab === 'phone' && (
          <div>
            {phoneError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '13px',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                {phoneError}
              </div>
            )}

            {phoneStep === 'phone' && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    htmlFor="admin-phone"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--theme-elevation-800, #374151)',
                    }}
                  >
                    Mobile Number
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '11px 12px',
                        background: 'var(--theme-elevation-100, #F3F4F6)',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        borderRight: 'none',
                        borderRadius: '8px 0 0 8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--theme-elevation-700, #4B5563)',
                      }}
                    >
                      🇮🇳 +91
                    </span>
                    <input
                      id="admin-phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={{
                        flex: 1,
                        padding: '11px 14px',
                        borderRadius: '0 8px 8px 0',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || phone.replace(/\D/g, '').length < 10}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#15803D',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: phoneLoading || phone.replace(/\D/g, '').length < 10 ? 'not-allowed' : 'pointer',
                    opacity: phoneLoading || phone.replace(/\D/g, '').length < 10 ? 0.6 : 1,
                    transition: 'background 0.15s ease',
                  }}
                >
                  {phoneLoading ? 'Sending Verification Code...' : 'Send Verification Code →'}
                </button>
              </form>
            )}

            {phoneStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--theme-elevation-600, #6B7280)' }}>
                    Sent to <strong>+91 {phone.replace(/\D/g, '').slice(-10)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep('phone')
                      setOtp('')
                      setPhoneError(null)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '12px',
                      color: '#15803D',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    Change Number
                  </button>
                </div>

                {isNewUser && (
                  <div
                    style={{
                      padding: '12px',
                      background: 'var(--theme-elevation-50, #F9FAFB)',
                      border: '1px solid var(--theme-elevation-200, #E5E7EB)',
                      borderRadius: '8px',
                    }}
                  >
                    <label
                      htmlFor="admin-name"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '6px',
                        color: 'var(--theme-elevation-800, #374151)',
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      required
                      placeholder="e.g. Store Administrator"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'var(--theme-elevation-0, #FFFFFF)',
                        color: 'var(--theme-elevation-1000, #111827)',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="admin-otp"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: 'var(--theme-elevation-800, #374151)',
                    }}
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="admin-otp"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--theme-elevation-250, #D1D5DB)',
                      fontSize: '22px',
                      fontWeight: 700,
                      letterSpacing: '0.4em',
                      textAlign: 'center',
                      outline: 'none',
                      background: 'var(--theme-elevation-0, #FFFFFF)',
                      color: 'var(--theme-elevation-1000, #111827)',
                    }}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || otp.length !== 6 || (isNewUser && !name.trim())}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#15803D',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor:
                      phoneLoading || otp.length !== 6 || (isNewUser && !name.trim())
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: phoneLoading || otp.length !== 6 || (isNewUser && !name.trim()) ? 0.6 : 1,
                    transition: 'background 0.15s ease',
                  }}
                >
                  {phoneLoading ? 'Verifying...' : isNewUser ? 'Create Account & Sign In' : 'Verify & Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--theme-elevation-500, #9CA3AF)' }}>
                      Resend code in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '12px',
                        color: '#15803D',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textDecoration: 'underline',
                      }}
                    >
                      Didn't receive code? Resend
                    </button>
                  )}
                </div>
              </form>
            )}

            {phoneStep === 'pending' && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                  Account Awaiting Approval
                </div>
                <p style={{ margin: '0 0 12px 0' }}>
                  Your administrator account has been created. It is currently awaiting approval by the store owner in Settings → Staff & Admins.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep('phone')
                    setOtp('')
                    setPhoneError(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: '#92400E',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Email & Password Login */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {emailError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                {emailError}
              </div>
            )}

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
                placeholder="admin@flavouritefood.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={emailLoading || !email || !password}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#15803D',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: emailLoading || !email || !password ? 'not-allowed' : 'pointer',
                opacity: emailLoading || !email || !password ? 0.6 : 1,
                transition: 'background 0.15s ease',
              }}
            >
              {emailLoading ? 'Signing In...' : 'Sign In with Password →'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--theme-elevation-150, #E5E7EB)',
            textAlign: 'center',
            fontSize: '12px',
          }}
        >
          <Link
            href="/"
            style={{
              color: 'var(--theme-elevation-600, #6B7280)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}
