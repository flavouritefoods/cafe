import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminLoginUnifiedClient } from './AdminLoginUnifiedClient'

export const metadata: Metadata = {
  title: 'Login • Flavourite Bakery Admin',
  description: 'Administrator and staff login portal for Flavourite Cafe & Bakery.',
  robots: 'noindex, nofollow',
}

export default async function AdminLoginPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  // If already authenticated with payload-token, redirect directly to dashboard
  if (token) {
    redirect('/admin')
  }

  return <AdminLoginUnifiedClient />
}
