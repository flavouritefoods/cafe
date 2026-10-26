import React from 'react'

export function AdminLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '28px' }}>🌿</span>
        <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'serif', color: '#1B5E20' }}>
          Flavourite
        </span>
      </div>
      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, color: '#15803D' }}>
        Cafe & Bakery • Admin Portal
      </span>
    </div>
  )
}
