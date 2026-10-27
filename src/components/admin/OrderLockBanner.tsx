'use client'

import React, { useState, useEffect } from 'react'
import { useField } from '@payloadcms/ui'
import { Lock, Unlock, ShieldAlert, CheckCircle2, History, AlertTriangle } from 'lucide-react'

export function OrderLockBanner() {
  // Field binding for lock state
  const { value: isLockedVal, setValue: setIsLocked } = useField<boolean>({ path: 'isLocked' })
  const { value: reasonVal, setValue: setReason } = useField<string>({ path: 'lastEditReason' })

  // An order is locked by default unless explicitly unlocked
  const isLocked = isLockedVal !== false
  const [unlockReason, setUnlockReason] = useState(reasonVal || '')

  useEffect(() => {
    if (reasonVal !== undefined && reasonVal !== unlockReason) {
      setUnlockReason(reasonVal || '')
    }
  }, [reasonVal])

  const handleUnlock = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLocked(false)
  }

  const handleLock = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLocked(true)
    setReason('')
  }

  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setUnlockReason(val)
    setReason(val)
  }

  return (
    <div
      className="order-lock-control-container"
      style={{
        margin: '0 0 24px 0',
        width: '100%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Dynamic CSS scoped to order form to prevent accidental changes when locked */}
      <style>{`
        ${
          isLocked
            ? `
          /* READ-ONLY / LOCKED MODE */
          /* Allow tabs and navigation, but lock form inputs */
          .collection-orders .document-fields > *:not(.order-lock-control-container):not(.tabs-field) input,
          .collection-orders .document-fields > *:not(.order-lock-control-container):not(.tabs-field) select,
          .collection-orders .document-fields > *:not(.order-lock-control-container):not(.tabs-field) textarea,
          .collection-orders .tabs-field__content input,
          .collection-orders .tabs-field__content select,
          .collection-orders .tabs-field__content textarea,
          .collection-orders .tabs-field__content button:not(.tabs-field__tab-button):not(.tabs-field__tab-button *),
          .collection-orders .array-field__add-row,
          .collection-orders .array-field__remove-row {
            pointer-events: none !important;
            opacity: 0.75 !important;
            cursor: not-allowed !important;
            user-select: text !important;
            background-color: #F9FAFB !important;
            border-color: #E5E7EB !important;
          }

          /* Ensure tab navigation remains 100% interactive */
          .collection-orders .tabs-field__tab-button,
          .collection-orders .tabs-field__tab-button * {
            pointer-events: auto !important;
            cursor: pointer !important;
            opacity: 1 !important;
          }

          /* Hide save/submit button when locked to prevent accidental updates */
          .collection-orders .form-submit,
          .collection-orders button[id*="action-save"],
          .collection-orders button[type="submit"]:not(.order-lock-btn) {
            opacity: 0.4 !important;
            pointer-events: none !important;
            filter: grayscale(100%) !important;
          }
        `
            : `
          /* EDITING / UNLOCKED MODE */
          .collection-orders .document-fields {
            animation: fadeIn 0.2s ease-in-out;
          }
        `
        }
      `}</style>

      {isLocked ? (
        /* LOCKED STATE: Clean Shield Card with "Edit Order" Button */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: '#F8FAFC',
            border: '2px solid #CBD5E1',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#1E293B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🔒 Protected Mode (Read-Only)</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 700,
                    background: '#E2E8F0',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Locked
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: 1.4,
                }}
              >
                All items, prices, delivery addresses, and statuses are protected against accidental edits.
                Click <strong>"Edit Order"</strong> to unlock and modify details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnlock}
            className="order-lock-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#1B5E20',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(27, 94, 32, 0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = '#15803D')}
            onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = '#1B5E20')}
          >
            <Unlock size={17} />
            <span>✏️ Edit Order</span>
          </button>
        </div>
      ) : (
        /* UNLOCKED STATE: Warning Alert with Edit Reason Input & Re-lock */
        <div
          style={{
            background: '#FFFBEB',
            border: '2px solid #FCD34D',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#D97706',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⚠️ Editing Active — Unlocked</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 700,
                      background: '#FEF3C7',
                      color: '#B45309',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #FCD34D',
                    }}
                  >
                    Audit Enabled
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#B45309' }}>
                  Form inputs and status controls are enabled. Changes will be logged with your staff name upon save.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLock}
              className="order-lock-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                color: '#4B5563',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Lock size={15} />
              <span>Cancel & Re-Lock</span>
            </button>
          </div>

          {/* Audit Reason Input */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <label
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#78350F',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <History size={14} color="#D97706" />
              <span>Reason for Modification (Optional / Recommended for Audit Log):</span>
            </label>
            <input
              type="text"
              value={unlockReason}
              onChange={handleReasonChange}
              placeholder="e.g. Customer called to change delivery address, updating status to baking in oven..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
