'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Phone, CheckCircle, RefreshCw } from 'lucide-react'

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/account'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

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

    const clean = phone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setStep('otp')
      startResendTimer()
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!otp || otp.length < 4) {
      setError('Please enter the verification code.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      // Successfully authenticated
      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-cream/40">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🌿</span>
            <span className="text-2xl font-serif font-bold text-brand-dark">Flavourite</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'phone' ? 'Log in or Sign up' : 'Verify Mobile Number'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'phone'
              ? 'Enter your mobile number to view orders and saved addresses'
              : `Enter the 6-digit code sent to +91 ${phone}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3.5 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-brand-dark focus-within:border-brand-dark overflow-hidden bg-white">
                <span className="inline-flex items-center px-4 bg-gray-50 border-r border-gray-200 text-gray-700 font-semibold text-sm">
                  🇮🇳 +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full px-4 py-3.5 text-base tracking-wider focus:outline-none"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-brand-dark hover:bg-brand-medium text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue with OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-500 border border-gray-100 flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand-dark shrink-0" />
              <span>We never share your phone number. Instant OTP, no password required.</span>
            </div>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3.5 text-center text-2xl tracking-[0.4em] font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Your Name <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-brand-dark hover:bg-brand-medium text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Verify & Log In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-brand-dark hover:underline font-medium"
              >
                ← Change Phone
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={resendTimer > 0 || loading}
                className="text-brand-dark hover:underline font-medium disabled:opacity-40 disabled:no-underline"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
