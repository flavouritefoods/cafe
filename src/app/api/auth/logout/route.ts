import { NextResponse } from 'next/server'
import { clearCustomerCookie } from '@/lib/customerAuth'

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
  clearCustomerCookie(response)
  return response
}
