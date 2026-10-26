'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Phone, CheckCircle, RefreshCw, KeyRound, Lock, AlertCircle, Clock } from 'lucide-react'

export function AdminLoginClient() {
  const [step, setStep] = useState<'phone' | 'otp' | 'pending'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null)
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
    setDevOtp(null)

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
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setIsNewUser(Boolean(data.isNewUser))
      setStep('otp')
      if (data.devOtp) {
        setDevOtp(data.devOtp)
        setOtp(data.devOtp)
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
      setError('Please enter the 6-digit OTP code.')
      return
    }

    if (isNewUser && (!name || name.trim().length === 0)) {
      setError('Please enter your name (e.g. Mom, Vihari).')
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

      setSuccessMsg(data.message || 'Authenticated successfully! Redirecting...')
      // Full page redirect so server components pick up the new session cookie immediately
      setTimeout(() => {
        window.location.href = '/admin'
      }, 800)
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the OTP code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <span className="text-4xl transition-transform group-hover:scale-110">🌿</span>
            <div className="text-left">
              <span className="text-2xl font-serif font-bold text-[#1B5E20] block leading-none">
                Flavourite
              </span>
              <span className="text-[0.62rem] uppercase tracking-widest text-[#1B5E20]/80 font-sans block mt-1 font-semibold">
                Cafe & Bakery
              </span>
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1B5E20] border border-emerald-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin & Staff Portal</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Mobile OTP Login & Registration
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === 'phone'
              ? 'Enter your mobile number to sign in or register.'
              : step === 'otp'
              ? `Verification code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`
              : 'Account status update'}
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-sm border border-emerald-100 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="admin-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-medium text-sm">
                    🇮🇳 +91
                  </div>
                  <input
                    id="admin-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-20 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-gray-900 font-medium tracking-wide placeholder-gray-400 text-base"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Mom, Vihari, or bakery staff can register or log in here without remembering passwords.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1B5E20] hover:bg-[#154a19] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & Name if New User */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* If this is a new registration, ask for Name */}
              {isNewUser && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <span>✨ First-Time Admin Registration</span>
                  </div>
                  <div>
                    <label htmlFor="admin-name" className="block text-xs font-medium text-gray-700 mb-1">
                      Your Name / Display Label
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      required
                      placeholder="e.g. Mom, Vihari, Bakery Manager"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="admin-otp" className="block text-sm font-semibold text-gray-700">
                    6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setOtp('')
                      setError(null)
                    }}
                    className="text-xs text-[#1B5E20] hover:underline font-medium"
                  >
                    Change Number
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    id="admin-otp"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full py-3 text-center tracking-[0.5em] text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-gray-900"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                </div>

                {devOtp && (
                  <p className="mt-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    💡 Test OTP: <strong>{devOtp}</strong> (automatically filled for quick access)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || (isNewUser && !name.trim())}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1B5E20] hover:bg-[#154a19] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying & Opening Admin...</span>
                  </>
                ) : (
                  <>
                    <span>{isNewUser ? 'Create Admin Account & Open' : 'Verify & Enter Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <span className="text-xs text-gray-400">Resend code in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-xs text-[#1B5E20] hover:underline font-semibold"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: Account Pending Manual Approval */}
          {step === 'pending' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Admin Account Registered!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your mobile number (+91 {phone.replace(/\D/g, '').slice(-10)}) has been registered with name <strong>{name || 'New Admin'}</strong>.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
                <p className="font-semibold">⏳ Awaiting Store Owner Approval</p>
                <p>
                  Store settings currently require manual approval. The store owner can approve your account anytime under <strong>Settings → Staff & Admins</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError(null)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#1B5E20] hover:underline font-semibold"
              >
                <span>Back to Login</span>
              </button>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <Link href="/admin/login" className="hover:text-[#1B5E20] transition-colors inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Standard Email Login</span>
            </Link>
            <Link href="/" className="hover:text-[#1B5E20] transition-colors">
              Return to Storefront →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
