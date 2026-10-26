'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react'

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/account'
  const isFromCheckout = redirectUrl.includes('checkout')

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')

  // Sign In State
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Registration State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')

  // Handle Customer Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identifier.trim() || !password) {
      setError('Please enter your email or mobile number and password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed. Please check your credentials.')
      }

      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Customer Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!regName.trim() || regName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).')
      return
    }

    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10)
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number for delivery coordination.')
      return
    }

    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: cleanPhone,
          password: regPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.')
      }

      router.push(redirectUrl)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
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
            {activeTab === 'signin' ? 'Welcome Back' : 'Create Customer Account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'signin'
              ? 'Sign in to access your saved addresses and track orders'
              : 'Sign up for fast checkout and order tracking'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin')
              setError(null)
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-brand-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register')
              setError(null)
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-brand-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 leading-relaxed">
            {error}
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address or Mobile Number
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@gmail.com or 9876543210"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className="w-full bg-brand-dark hover:bg-brand-medium text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* CREATE ACCOUNT FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. priya@gmail.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Mobile Number <span className="text-gray-400 font-normal lowercase">(for delivery)</span>
              </label>
              <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-brand-dark focus-within:border-brand-dark overflow-hidden bg-white">
                <span className="inline-flex items-center px-3.5 bg-gray-50 border-r border-gray-200 text-gray-600 font-semibold text-xs">
                  🇮🇳 +91
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  maxLength={10}
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password <span className="text-gray-400 font-normal lowercase">(min 6 chars)</span>
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark focus:border-brand-dark focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !regName || !regEmail || regPhone.length < 10 || regPassword.length < 6}
              className="w-full bg-brand-dark hover:bg-brand-medium text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <CheckCircle size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Guest Checkout Alternative (if coming from cart/checkout) */}
        {isFromCheckout && (
          <div className="pt-3 border-t border-gray-100 text-center">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 text-xs text-brand-dark hover:underline font-semibold"
            >
              <span>Or proceed to Checkout as Guest</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Security badge */}
        <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 border border-gray-100 flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-brand-dark shrink-0" />
          <span>Your details and passwords are cryptographically secured.</span>
        </div>

      </div>
    </div>
  )
}
