import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { setAdminCookie } from '@/lib/adminAuth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Both email and password are required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const payload = await getPayload({ config: configPromise })

    // 1. Verify credentials via Payload auth
    let loginResult: any
    try {
      loginResult = await payload.login({
        collection: 'users',
        data: {
          email: cleanEmail,
          password,
        },
      })
    } catch (authError: any) {
      console.warn('[ADMIN LOGIN] Invalid credentials for email:', cleanEmail)
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      )
    }

    const user = loginResult?.user

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 401 }
      )
    }

    // 2. Check approval status
    if (user.status === 'pending') {
      return NextResponse.json(
        {
          pendingApproval: true,
          error:
            '⏳ Account Pending Approval: Your account has been registered, but requires authorization by an existing store administrator before you can log in. Please contact an administrator to approve your account under Settings → Staff & Admins.',
        },
        { status: 403 }
      )
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        {
          error:
            '🚫 Access Denied: This account has been suspended. Please contact the store administrator.',
        },
        { status: 403 }
      )
    }

    // 3. Approved account -> issue session cookie
    const response = NextResponse.json({
      success: true,
      message: `Welcome, ${user.name}! Opening dashboard...`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })

    if (loginResult.token) {
      setAdminCookie(response, loginResult.token)
    }

    return response
  } catch (err: any) {
    console.error('Error in admin email login:', err)
    return NextResponse.json(
      { error: err?.message || 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
