'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Bike,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Printer,
  ChevronRight,
  BarChart3,
  PieChart,
  Search,
  DollarSign,
  ArrowUpRight,
  Database,
  Phone,
  CreditCard,
  Check,
  Volume2,
  VolumeX,
  Bell,
} from 'lucide-react'

// Web Audio API Native Kitchen Chime (100% Free, zero MP3 downloads)
function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }

    // Classic 2-tone "Ding-Dong" chime: 880Hz then 659.25Hz
    playTone(880, 0, 0.35)
    playTone(659.25, 0.22, 0.55)
  } catch (err) {
    console.warn('Audio chime warning:', err)
  }
}

export function BakeryDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Audio Alerts State (Kitchen counter bell)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const prevNewCountRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flavourite_kitchen_sound')
      if (saved !== null) {
        setSoundEnabled(saved === 'true')
      }
    } catch {}
  }, [])

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem('flavourite_kitchen_sound', String(next))
      } catch {}
      if (next) {
        playKitchenChime()
      }
      return next
    })
  }

  // Interactive controls
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'month' | 'all'>('today')
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d'>('7d')
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar')
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const toggleFilter = (status: string) => {
    setOrderFilter((prev) => (prev === status ? 'all' : status))
  }

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/dashboard-stats', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.stats) {
        setStats(data.stats)
        setError(null)

        // Check if any new orders arrived
        const currentNewCount = data.stats?.statusCounts?.new || 0
        if (prevNewCountRef.current !== null && currentNewCount > prevNewCountRef.current) {
          if (soundEnabled) {
            playKitchenChime()
          }
          setNewOrderAlert(true)
        }
        prevNewCountRef.current = currentNewCount
      } else {
        setError(data.error || 'Failed to load dashboard metrics')
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to analytics server')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleQuickStatus = async (e: React.SyntheticEvent, orderId: string, newStatus: string) => {
    e.stopPropagation() // Don't trigger row click
    try {
      setUpdatingOrderId(orderId)
      const res = await fetch('/api/admin/orders/quick-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus }),
      })
      if (res.ok) {
        await fetchStats()
      }
    } catch (err) {
      console.error('Status update failed:', err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDispatchCourier = async (e: React.SyntheticEvent, orderId: string) => {
    e.stopPropagation()
    try {
      setUpdatingOrderId(orderId)
      await fetch('/api/admin/orders/quick-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus: 'out_for_delivery' }),
      })
      router.push(`/admin/collections/orders/${orderId}#courier`)
    } catch (err) {
      console.error('Failed to dispatch order:', err)
      router.push(`/admin/collections/orders/${orderId}#courier`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleBackup = async () => {
    try {
      setBackingUp(true)
      setBackupSuccess(null)
      const res = await fetch('/api/admin/backup', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setBackupSuccess(`Database snapshot saved (${data.sizeKb} KB)`)
        setTimeout(() => setBackupSuccess(null), 5000)
      } else {
        alert(data.error || 'Backup failed')
      }
    } catch (err) {
      console.error('Backup error:', err)
      alert('Failed to trigger database backup')
    } finally {
      setBackingUp(false)
    }
  }

  if (loading && !stats) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#1B5E20' }}>
          <RefreshCw size={22} className="animate-spin" />
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Loading Store Analytics & Operations Data...</span>
        </div>
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Selected revenue value
  const displayedRevenue =
    revenuePeriod === 'today'
      ? stats?.todayRevenue || 0
      : revenuePeriod === 'month'
      ? stats?.monthRevenue || 0
      : stats?.totalRevenue || 0

  const displayedRevenueOrders =
    revenuePeriod === 'today'
      ? stats?.todayOrdersCount || 0
      : revenuePeriod === 'month'
      ? stats?.monthOrdersCount || 0
      : stats?.totalOrders || 0

  // Chart data selection
  const chartData = chartTimeframe === '7d' ? stats?.last7Days || [] : stats?.last30Days || []
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1)

  // Status breakdown calculations
  const totalStatusOrders = Math.max(stats?.totalOrders || 1, 1)
  const statusCounts = stats?.statusCounts || {}
  const statusRevenue = stats?.statusRevenue || {}

  // Filter orders
  const filteredOrders = (stats?.activeOrders || []).filter((o: any) => {
    const matchesStatus =
      orderFilter === 'all'
        ? true
        : orderFilter === 'new'
        ? o.orderStatus === 'new' || o.orderStatus === 'confirmed' || !o.orderStatus
        : o.orderStatus === orderFilter

    const query = searchQuery.toLowerCase().trim()
    if (!query) return matchesStatus
    const matchesSearch =
      (o.orderNumber && o.orderNumber.toLowerCase().includes(query)) ||
      (o.customerName && o.customerName.toLowerCase().includes(query)) ||
      (o.customerPhone && o.customerPhone.includes(query)) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(query))
    return matchesStatus && matchesSearch
  })

  // Status badge styling helper
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return { label: '🆕 New Order', bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' }
      case 'confirmed':
        return { label: '✅ Confirmed', bg: '#CCFBF1', color: '#0F766E', border: '#14B8A6' }
      case 'preparing':
        return { label: '🧁 Baking in Kitchen', bg: '#FFEDD5', color: '#9A3412', border: '#EA580C' }
      case 'out_for_delivery':
        return { label: '🛵 Out for Delivery', bg: '#DBEAFE', color: '#1E40AF', border: '#2563EB' }
      case 'delivered':
        return { label: '🎉 Delivered Successfully', bg: '#DCFCE7', color: '#166534', border: '#16A34A' }
      case 'cancelled':
        return { label: '❌ Cancelled', bg: '#FFE4E6', color: '#9F1239', border: '#F43F5E' }
      default:
        return { label: `📋 ${status || 'Received'}`, bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' }
    }
  }

  // Payment status badge styling helper
  const getPaymentStatusBadge = (status: string, method?: string) => {
    switch (status) {
      case 'paid_razorpay':
        return { label: '💳 Paid Online', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' }
      case 'paid_upi':
        return { label: '📱 Paid (UPI / WhatsApp)', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' }
      case 'paid_cod':
        return { label: '💵 Cash on Delivery', bg: '#E0F2FE', color: '#0369A1', border: '#7DD3FC' }
      case 'pending':
        return {
          label: method === 'cod' ? '💵 Cash on Delivery (Pay at Door)' : '⏳ Payment Pending',
          bg: '#FEF3C7',
          color: '#B45309',
          border: '#FCD34D',
        }
      case 'refunded':
        return { label: '↩️ Refunded', bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE' }
      default:
        return { label: `💳 ${status ? status.replace('_', ' ') : 'Pending'}`, bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' }
    }
  }

  return (
    <div style={{ fontFamily: 'inherit', maxWidth: '1400px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* 1. Dashboard Operations Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span
              style={{
                background: '#E8F5E9',
                color: '#1B5E20',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              📍 Samalkot Kitchen
            </span>
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
              • Service Area: 533xxx
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.02em',
            }}
          >
            Store Operations & Fulfillment
          </h1>
          <p style={{ margin: '3px 0 0 0', color: '#6B7280', fontSize: '0.84rem' }}>
            Live order queue, kitchen baking status, and daily sales metrics.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Kitchen audio alert active (plays when new order arrives)' : 'Audio alert muted'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: soundEnabled ? '#ECFDF5' : '#F3F4F6',
              color: soundEnabled ? '#065F46' : '#6B7280',
              border: soundEnabled ? '1px solid #A7F3D0' : '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '7px 11px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {soundEnabled ? <Volume2 size={14} className="text-emerald-700" /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Bell: ON' : 'Bell: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => playKitchenChime()}
            title="Test Kitchen Audio Chime"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#374151',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Bell size={13} className="text-amber-600" />
            <span>Test Sound</span>
          </button>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              color: '#4B5563',
              fontWeight: 600,
            }}
          >
            {currentDate}
          </div>

          <button
            onClick={fetchStats}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1B5E20',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div
          style={{
            background: '#FEF3C7',
            border: '2px solid #F59E0B',
            color: '#92400E',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔔</span>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>New Bakery Order Received!</strong>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                The kitchen order queue has been updated automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewOrderAlert(false)
              setOrderFilter('new')
            }}
            style={{
              background: '#B45309',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            View in Queue →
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* 2. Top Interactive Metric Cards (Clickable) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '1.75rem',
        }}
      >
        {/* Metric 1: Revenue (Interactive Toggle) */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.15rem',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1B5E20', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Store Revenue
              </span>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '6px', padding: '2px' }}>
                {(['today', 'month', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    style={{
                      border: 'none',
                      padding: '2px 7px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: revenuePeriod === period ? '#FFFFFF' : 'transparent',
                      color: revenuePeriod === period ? '#1B5E20' : '#6B7280',
                    }}
                  >
                    {period === 'today' ? 'Today' : period === 'month' ? '30D' : 'Total'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', margin: '4px 0' }}>
              ₹{displayedRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              {displayedRevenueOrders} orders ({revenuePeriod === 'today' ? 'today' : revenuePeriod === 'month' ? 'last 30 days' : 'all time'})
            </div>
          </div>

          <Link
            href="/admin/collections/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#1B5E20',
              textDecoration: 'none',
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid #F3F4F6',
            }}
          >
            <span>View All Orders Ledger</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Metric 2: New Orders (Clickable Filter) */}
        <div
          onClick={() => toggleFilter('new')}
          style={{
            background: orderFilter === 'new' ? '#FEF3C7' : '#FFFFFF',
            borderRadius: '14px',
            padding: '1.15rem',
            border: orderFilter === 'new' ? '2px solid #D97706' : '1px solid #E5E7EB',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New Orders
            </span>
            <span style={{ background: orderFilter === 'new' ? '#F59E0B' : '#FEF3C7', color: orderFilter === 'new' ? '#FFFFFF' : '#B45309', padding: '2px 7px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: 700 }}>
              {orderFilter === 'new' ? 'Filter Active ✕' : 'Action Req.'}
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#B45309', margin: '4px 0' }}>
            {(statusCounts.new || 0) + (statusCounts.confirmed || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: orderFilter === 'new' ? '#92400E' : '#6B7280', fontWeight: orderFilter === 'new' ? 700 : 400 }}>
            {orderFilter === 'new' ? 'Click to show all orders' : 'Click to filter queue below'}
          </div>
        </div>

        {/* Metric 3: In Kitchen / Preparing */}
        <div
          onClick={() => toggleFilter('preparing')}
          style={{
            background: orderFilter === 'preparing' ? '#FFEDD5' : '#FFFFFF',
            borderRadius: '14px',
            padding: '1.15rem',
            border: orderFilter === 'preparing' ? '2px solid #EA580C' : '1px solid #E5E7EB',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Kitchen
            </span>
            <span style={{ background: orderFilter === 'preparing' ? '#EA580C' : '#FFEDD5', color: orderFilter === 'preparing' ? '#FFFFFF' : '#C2410C', padding: '2px 7px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: 700 }}>
              {orderFilter === 'preparing' ? 'Filter Active ✕' : 'Baking'}
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#C2410C', margin: '4px 0' }}>
            {statusCounts.preparing || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: orderFilter === 'preparing' ? '#9A3412' : '#6B7280', fontWeight: orderFilter === 'preparing' ? 700 : 400 }}>
            {orderFilter === 'preparing' ? 'Click to show all orders' : 'Currently in oven / prep'}
          </div>
        </div>

        {/* Metric 4: Out for Delivery */}
        <div
          onClick={() => toggleFilter('out_for_delivery')}
          style={{
            background: orderFilter === 'out_for_delivery' ? '#DBEAFE' : '#FFFFFF',
            borderRadius: '14px',
            padding: '1.15rem',
            border: orderFilter === 'out_for_delivery' ? '2px solid #2563EB' : '1px solid #E5E7EB',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Out for Delivery
            </span>
            <span style={{ background: orderFilter === 'out_for_delivery' ? '#2563EB' : '#DBEAFE', color: orderFilter === 'out_for_delivery' ? '#FFFFFF' : '#1D4ED8', padding: '2px 7px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: 700 }}>
              {orderFilter === 'out_for_delivery' ? 'Filter Active ✕' : 'In Transit'}
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D4ED8', margin: '4px 0' }}>
            {statusCounts.out_for_delivery || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: orderFilter === 'out_for_delivery' ? '#1E40AF' : '#6B7280', fontWeight: orderFilter === 'out_for_delivery' ? 700 : 400 }}>
            {orderFilter === 'out_for_delivery' ? 'Click to show all orders' : 'Rider dispatched'}
          </div>
        </div>
      </div>

      {/* 3. Out of stock inventory alert */}
      {stats?.soldOutProducts && stats.soldOutProducts.length > 0 && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#D97706" />
            <span style={{ fontSize: '0.82rem', color: '#92400E', fontWeight: 600 }}>
              Notice: {stats.soldOutProducts.length} product(s) marked Sold Out on storefront:
              <strong style={{ marginLeft: '4px', color: '#78350F' }}>
                {stats.soldOutProducts.map((p: any) => p.name).join(', ')}
              </strong>
            </span>
          </div>
          <Link
            href="/admin/collections/products"
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#B45309',
              textDecoration: 'underline',
              whiteSpace: 'nowrap',
            }}
          >
            Manage Inventory →
          </Link>
        </div>
      )}

      {/* 4. Analytics & Trends Component */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #E5E7EB',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '1.25rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid #F3F4F6',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
              Sales & Fulfillment Analytics
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#6B7280' }}>
              Daily revenue trajectory and fulfillment stage distribution.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {/* Timeframe Filter */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setChartTimeframe('7d')}
                style={{
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: chartTimeframe === '7d' ? '#FFFFFF' : 'transparent',
                  color: chartTimeframe === '7d' ? '#1B5E20' : '#6B7280',
                  boxShadow: chartTimeframe === '7d' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setChartTimeframe('30d')}
                style={{
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: chartTimeframe === '30d' ? '#FFFFFF' : 'transparent',
                  color: chartTimeframe === '30d' ? '#1B5E20' : '#6B7280',
                  boxShadow: chartTimeframe === '30d' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Last 30 Days
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setChartType('bar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: chartType === 'bar' ? '#FFFFFF' : 'transparent',
                  color: chartType === 'bar' ? '#1B5E20' : '#6B7280',
                }}
              >
                <BarChart3 size={13} />
                <span>Bar</span>
              </button>
              <button
                onClick={() => setChartType('donut')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: chartType === 'donut' ? '#FFFFFF' : 'transparent',
                  color: chartType === 'donut' ? '#1B5E20' : '#6B7280',
                }}
              >
                <PieChart size={13} />
                <span>Stages</span>
              </button>
            </div>
          </div>
        </div>

        {/* View 1: Bar Chart */}
        {chartType === 'bar' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: chartTimeframe === '7d' ? '12px' : '4px',
                height: '180px',
                paddingTop: '20px',
                paddingBottom: '10px',
                overflowX: 'auto',
              }}
            >
              {chartData.map((day: any, idx: number) => {
                const heightPct = Math.max(Math.round((day.revenue / maxRevenue) * 100), 4)
                const isLatest = idx === chartData.length - 1

                return (
                  <div
                    key={day.date}
                    style={{
                      flex: 1,
                      minWidth: chartTimeframe === '7d' ? '36px' : '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {chartTimeframe === '7d' && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isLatest ? '#1B5E20' : '#4B5563', marginBottom: '4px' }}>
                        ₹{day.revenue > 0 ? day.revenue : '0'}
                      </div>
                    )}

                    <div
                      style={{
                        width: '100%',
                        maxWidth: chartTimeframe === '7d' ? '42px' : '16px',
                        height: `${heightPct}%`,
                        background: isLatest ? '#1B5E20' : day.revenue > 0 ? '#6EE7B7' : '#F3F4F6',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.2s ease',
                      }}
                      title={`${day.date}: ₹${day.revenue} (${day.ordersCount} orders)`}
                    />

                    <div style={{ marginTop: '6px', textAlign: 'center' }}>
                      {chartTimeframe === '7d' ? (
                        <>
                          <div style={{ fontSize: '0.72rem', fontWeight: isLatest ? 800 : 600, color: isLatest ? '#1B5E20' : '#374151' }}>
                            {day.dayName}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>{day.date}</div>
                        </>
                      ) : (
                        idx % 5 === 0 && <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>{day.date}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.72rem', color: '#6B7280' }}>
              <span>Period: {chartTimeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</span>
              <span>Avg Order Value: <strong style={{ color: '#1B5E20' }}>₹{stats?.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0}</strong></span>
            </div>
          </div>
        )}

        {/* View 2: Status Distribution */}
        {chartType === 'donut' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>
                Delivered ({statusCounts.delivered || 0})
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: '2px 0' }}>
                ₹{(statusRevenue.delivered || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#15803D' }}>
                {Math.round(((statusCounts.delivered || 0) / totalStatusOrders) * 100)}% of orders
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>
                In Transit ({statusCounts.out_for_delivery || 0})
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E40AF', margin: '2px 0' }}>
                ₹{(statusRevenue.out_for_delivery || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1D4ED8' }}>
                {Math.round(((statusCounts.out_for_delivery || 0) / totalStatusOrders) * 100)}% of orders
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
                In Kitchen ({statusCounts.preparing || 0})
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#9A3412', margin: '2px 0' }}>
                ₹{(statusRevenue.preparing || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#C2410C' }}>
                {Math.round(((statusCounts.preparing || 0) / totalStatusOrders) * 100)}% of orders
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#FEFCE8', border: '1px solid #FEF08A' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#A16207', textTransform: 'uppercase' }}>
                Queued ({(statusCounts.new || 0) + (statusCounts.confirmed || 0)})
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#854D0E', margin: '2px 0' }}>
                ₹{((statusRevenue.new || 0) + (statusRevenue.confirmed || 0)).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#A16207' }}>
                {Math.round((((statusCounts.new || 0) + (statusCounts.confirmed || 0)) / totalStatusOrders) * 100)}% of orders
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Live Orders & Fulfillment Queue */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #E5E7EB',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
              Active Orders & Fulfillment Queue
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#6B7280' }}>
              Kitchen dispatch tracking with live payment verification badges.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {orderFilter !== 'all' && (
              <button
                onClick={() => setOrderFilter('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>Filtered: {orderFilter.replace('_', ' ').toUpperCase()} (View All ✕)</span>
              </button>
            )}

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.78rem',
                  outline: 'none',
                  width: '160px',
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', background: '#F3F4F6', padding: '2px', borderRadius: '8px' }}>
              {['all', 'new', 'preparing', 'out_for_delivery', 'delivered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: orderFilter === st ? '#FFFFFF' : 'transparent',
                    color: orderFilter === st ? '#111827' : '#6B7280',
                    boxShadow: orderFilter === st ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {st === 'all' ? 'All' : st === 'out_for_delivery' ? 'Transit' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List / Cards */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9CA3AF', fontSize: '0.86rem' }}>
            No orders found matching this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredOrders.map((order: any) => {
              const cleanPhone = (order.customerPhone || '').replace(/\D/g, '')
              const waText = encodeURIComponent(
                `Hello ${order.customerName}, this is Flavourite Bakery regarding your order #${order.orderNumber}.`
              )
              const waUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${waText}`
              const printUrl = `/order-success?orderId=${encodeURIComponent(order.orderNumber)}`
              const isUpdating = updatingOrderId === order.id
              const currentStatus = order.orderStatus || 'new'

              const orderBadge = getOrderStatusBadge(currentStatus)
              const paymentBadge = getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)

              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/admin/collections/orders/${order.id}`)}
                  style={{
                    background: '#FAFAFA',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#1B5E20'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFAFA'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Top Row: Order ID, Customer, Amount & Distinct Badges */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: '#1B5E20',
                          fontSize: '0.92rem',
                          fontFamily: 'monospace',
                          background: '#E8F5E9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        #{order.orderNumber}
                      </span>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                        {order.customerName}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                        📞 {order.customerPhone}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                      {/* Kitchen Status Badge */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '4px 9px',
                          borderRadius: '6px',
                          background: orderBadge.bg,
                          color: orderBadge.color,
                          border: `1px solid ${orderBadge.border}`,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {orderBadge.label}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '4px 9px',
                          borderRadius: '6px',
                          background: paymentBadge.bg,
                          color: paymentBadge.color,
                          border: `1px solid ${paymentBadge.border}`,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {paymentBadge.label}
                      </span>

                      {/* Amount */}
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                        ₹{order.total}
                      </span>
                    </div>
                  </div>

                  {/* 4-Step Visual Kitchen & Fulfillment Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                    {[
                      { key: 'new', label: '1. Received' },
                      { key: 'preparing', label: '2. In Oven' },
                      { key: 'out_for_delivery', label: '3. In Transit' },
                      { key: 'delivered', label: '4. Delivered' },
                    ].map((step) => {
                      const stepOrder = ['new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']
                      const currentIndex = stepOrder.indexOf(currentStatus)
                      const stepTargetIndex = stepOrder.indexOf(step.key)
                      const isCompleted = currentIndex >= stepTargetIndex && currentStatus !== 'cancelled'
                      const isCurrent = currentStatus === step.key || (step.key === 'new' && currentStatus === 'confirmed')

                      return (
                        <div
                          key={step.key}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '4px',
                              borderRadius: '2px',
                              background: isCurrent ? '#1B5E20' : isCompleted ? '#86EFAC' : '#E5E7EB',
                              transition: 'background 0.2s',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: isCurrent ? 800 : 500,
                              color: isCurrent ? '#1B5E20' : isCompleted ? '#166534' : '#9CA3AF',
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Middle Row: Items Ordered */}
                  <div style={{ fontSize: '0.84rem', color: '#374151', lineHeight: 1.4 }}>
                    <strong style={{ color: '#111827' }}>Items:</strong> {order.itemsSummary || 'Bakery Items'}
                  </div>

                  {/* Special Instructions Note Box */}
                  {order.specialInstructions && (
                    <div
                      style={{
                        background: '#FEF9C3',
                        border: '1px solid #FEF08A',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        color: '#854D0E',
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Customer Note: "{order.specialInstructions}"
                    </div>
                  )}

                  {/* Bottom Row: Delivery Address, Slot, and Comprehensive Actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      paddingTop: '6px',
                      borderTop: '1px solid #F3F4F6',
                    }}
                  >
                    <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>
                      <strong>Slot:</strong> {order.deliverySlot?.toUpperCase() || 'ASAP'} • {order.deliveryAddress?.slice(0, 45)}...
                    </div>

                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Primary 1-Click Stepper Button */}
                      {(currentStatus === 'new' || currentStatus === 'confirmed' || !currentStatus) && (
                        <button
                          onClick={(e) => handleQuickStatus(e, order.id, 'preparing')}
                          disabled={isUpdating}
                          style={{
                            background: '#EA580C',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(234, 88, 12, 0.25)',
                          }}
                        >
                          <span>🧁 Start Baking</span>
                        </button>
                      )}

                      {currentStatus === 'preparing' && (
                        <button
                          onClick={(e) => handleDispatchCourier(e, order.id)}
                          disabled={isUpdating}
                          style={{
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                          }}
                          title="Dispatch order and open Delivery & Courier tab to enter tracking code"
                        >
                          <span>🛵 Dispatch & Courier Tab ↗</span>
                        </button>
                      )}

                      {/* Dedicated Courier Tab Quick Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/collections/orders/${order.id}#courier`)
                        }}
                        style={{
                          background: '#FFFFFF',
                          color: '#1E40AF',
                          border: '1px solid #BFDBFE',
                          borderRadius: '7px',
                          padding: '5px 8px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title="Open Delivery & Courier details tab for this order"
                      >
                        <span>🚚 Courier Tab</span>
                      </button>

                      {currentStatus === 'out_for_delivery' && (
                        <button
                          onClick={(e) => handleQuickStatus(e, order.id, 'delivered')}
                          disabled={isUpdating}
                          style={{
                            background: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
                          }}
                        >
                          <span>🎉 Mark Delivered</span>
                        </button>
                      )}

                      {/* Manual Quick Status Dropdown (Accessible on every order) */}
                      <select
                        value={currentStatus}
                        onChange={(e) => handleQuickStatus(e, order.id, e.target.value)}
                        disabled={isUpdating}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '7px',
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: '#374151',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="new">Status: 🆕 New Order</option>
                        <option value="confirmed">Status: ✅ Confirmed</option>
                        <option value="preparing">Status: 🧁 In Kitchen</option>
                        <option value="out_for_delivery">Status: 🛵 In Transit</option>
                        <option value="delivered">Status: 🎉 Delivered</option>
                        <option value="cancelled">Status: ❌ Cancelled</option>
                      </select>

                      {/* Call Customer */}
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#F3F4F6',
                            color: '#374151',
                            borderRadius: '7px',
                            padding: '5px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          <Phone size={12} color="#4B5563" />
                          <span>Call</span>
                        </a>
                      )}

                      {/* WhatsApp */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#25D366',
                          color: '#FFFFFF',
                          borderRadius: '7px',
                          padding: '5px 9px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <MessageCircle size={12} />
                        <span>WhatsApp</span>
                      </a>

                      {/* Print Slip */}
                      <a
                        href={printUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FFFFFF',
                          color: '#374151',
                          borderRadius: '7px',
                          padding: '5px 8px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #D1D5DB',
                        }}
                      >
                        <Printer size={12} color="#4B5563" />
                        <span>Slip</span>
                      </a>

                      {/* Open Full Document */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: '#1B5E20',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '5px 4px',
                        }}
                      >
                        <span>Full Order</span>
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 6. Quick Operations Shortcuts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '8px',
        }}
      >
        <Link
          href="/admin/collections/products/create"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#1B5E20',
            fontWeight: 700,
            fontSize: '0.8rem',
            textDecoration: 'none',
          }}
        >
          <PlusCircle size={15} color="#1B5E20" />
          <span>Add New Product</span>
        </Link>

        <Link
          href="/admin/collections/orders"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#374151',
            fontWeight: 700,
            fontSize: '0.8rem',
            textDecoration: 'none',
          }}
        >
          <ShoppingBag size={15} color="#1B5E20" />
          <span>All Orders & History</span>
        </Link>

        <Link
          href="/admin/globals/store-settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#374151',
            fontWeight: 700,
            fontSize: '0.8rem',
            textDecoration: 'none',
          }}
        >
          <FileText size={15} color="#C8A951" />
          <span>Store Settings & Banner</span>
        </Link>

        <button
          onClick={handleBackup}
          disabled={backingUp}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: backupSuccess ? '#DCFCE7' : '#FFFFFF',
            border: backupSuccess ? '1px solid #86EFAC' : '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '10px 14px',
            color: backupSuccess ? '#15803D' : '#374151',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          <Database size={15} color={backupSuccess ? '#15803D' : '#4B5563'} />
          <span>{backingUp ? 'Backing up...' : backupSuccess || 'Backup Database'}</span>
        </button>

        <Link
          href="/"
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#374151',
            fontWeight: 700,
            fontSize: '0.8rem',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={15} color="#6B7280" />
          <span>View Live Store</span>
        </Link>
      </div>
    </div>
  )
}
