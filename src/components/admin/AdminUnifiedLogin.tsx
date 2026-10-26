'use client'

import React, { useState } from 'react'

export function AdminUnifiedLogin() {
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone')
  const [step, setStep] = useState<'phone' | 'otp' | 'pending'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)
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

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setOtpCode(null)

    const clean = phone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code')

      setIsNewUser(Boolean(data.isNewUser))
      setStep('otp')
      if (data.otpCode) {
        setOtpCode(data.otpCode)
      }
      startResendTimer()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const clean = phone.replace(/\D/g, '').slice(-10)
    const cleanOtp = otp.trim()

    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    if (isNewUser && (!name || name.trim().length === 0)) {
      setError('Please enter your full name.')
      return
    }

    setLoading(true)
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
        setStep('pending')
        return
      }

      setSuccessMsg(data.message || 'Authenticated successfully. Opening dashboard...')
      setTimeout(() => {
        window.location.href = '/admin'
      }, 700)
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      {/* Hide the default email/password form when mobile OTP tab is active */}
      {activeTab === 'phone' && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .login__form,
              .template-minimal__wrap > form {
                display: none !important;
              }
            `,
          }}
        />
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--theme-elevation-100, #F3F4F6)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('phone')
            setError(null)
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
            color: activeTab === 'phone' ? 'var(--theme-elevation-1000, #111827)' : 'var(--theme-elevation-600, #6B7280)',
            boxShadow: activeTab === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          📱 Mobile OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('email')
            setError(null)
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
            color: activeTab === 'email' ? 'var(--theme-elevation-1000, #111827)' : 'var(--theme-elevation-600, #6B7280)',
            boxShadow: activeTab === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          ✉️ Email & Password
        </button>
      </div>

      {/* Mobile OTP View */}
      {activeTab === 'phone' && (
        <div style={{ width: '100%' }}>
          {error && (
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
              {error}
            </div>
          )}

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
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  htmlFor="unified-phone"
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
                      padding: '10px 12px',
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
                    id="unified-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
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
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                style={{
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--theme-success-500, #15803D)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: loading || phone.replace(/\D/g, '').length < 10 ? 'not-allowed' : 'pointer',
                  opacity: loading || phone.replace(/\D/g, '').length < 10 ? 0.6 : 1,
                  transition: 'background 0.15s ease',
                  marginTop: '4px',
                }}
              >
                {loading ? 'Sending Verification Code...' : 'Send Verification Code →'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--theme-elevation-600, #6B7280)' }}>
                  Sent to <strong>+91 {phone.replace(/\D/g, '').slice(-10)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setError(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: 'var(--theme-success-500, #15803D)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Change
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
                    htmlFor="unified-name"
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
                    id="unified-name"
                    type="text"
                    required
                    placeholder="e.g. Store Manager"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
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
                  htmlFor="unified-otp"
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
                  id="unified-otp"
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
                {otpCode && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#065F46',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      Verification Code: <strong>{otpCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(otpCode)}
                      style={{
                        background: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Fill
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || (isNewUser && !name.trim())}
                style={{
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--theme-success-500, #15803D)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: loading || otp.length !== 6 || (isNewUser && !name.trim()) ? 'not-allowed' : 'pointer',
                  opacity: loading || otp.length !== 6 || (isNewUser && !name.trim()) ? 0.6 : 1,
                  transition: 'background 0.15s ease',
                  marginTop: '4px',
                }}
              >
                {loading ? 'Verifying...' : isNewUser ? 'Create Account & Sign In' : 'Verify & Sign In'}
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
                      color: 'var(--theme-success-500, #15803D)',
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

          {step === 'pending' && (
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
                Your account has been registered successfully. It is currently awaiting activation by the store owner in Settings → Staff & Admins.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError(null)
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
    </div>
  )
}
