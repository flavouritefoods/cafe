'use client'

import React from 'react'
import Link from 'next/link'

export function AdminPhoneLoginBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        border: '1px solid #86EFAC',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌿 📱</div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: '#14532D', marginBottom: '4px' }}>
        Mom & Staff Mobile Login
      </div>
      <p style={{ fontSize: '13px', color: '#166534', margin: '0 0 12px 0', lineHeight: 1.4 }}>
        No password needed! Log in or register with your mobile number and instant OTP.
      </p>
      <Link
        href="/admin-login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: '#15803D',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '13px',
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)',
        }}
      >
        <span>📱 Log in with Mobile OTP</span>
        <span>→</span>
      </Link>
    </div>
  )
}
