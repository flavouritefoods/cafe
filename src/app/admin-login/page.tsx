import { Metadata } from 'next'
import { Suspense } from 'react'
import { AdminLoginClient } from './AdminLoginClient'

export const metadata: Metadata = {
  title: 'Admin Mobile OTP Login • Flavourite Bakery',
  description: 'Password-free admin and staff login for Flavourite Cafe & Bakery.',
  robots: 'noindex, nofollow',
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
          <div className="w-8 h-8 border-3 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginClient />
    </Suspense>
  )
}
