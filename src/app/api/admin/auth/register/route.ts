import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, role } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (at least 2 characters).' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : undefined

    const payload = await getPayload({ config: configPromise })

    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: cleanEmail,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json(
        {
          error:
            'An account with this email address already exists. Please sign in or use a different email.',
        },
        { status: 400 }
      )
    }

    // Read store settings to check registration policy if closed
    try {
      const settings = (await payload.findGlobal({ slug: 'store-settings' })) as any
      if (settings?.adminRegistrationMode === 'closed') {
        return NextResponse.json(
          {
            error:
              'Staff registration is currently closed. Please contact the store owner directly to create an account.',
          },
          { status: 403 }
        )
      }
    } catch {}

    // Create staff account with pending approval status
    const assignedRole = role === 'admin' ? 'admin' : 'staff'

    const newUser = await payload.create({
      collection: 'users',
      data: {
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: cleanPhone || undefined,
        role: assignedRole,
        status: 'pending', // Strictly pending until an existing admin approves
      },
    })

    console.log(`[ADMIN REGISTRATION] New user created: ${newUser.name} (${newUser.email}) - Status: PENDING`)

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message:
        'Account created successfully! It is currently awaiting approval by an existing store administrator. Please contact an administrator to approve your account in Settings → Staff & Admins.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'pending',
      },
    })
  } catch (err: any) {
    console.error('Error in admin registration:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
