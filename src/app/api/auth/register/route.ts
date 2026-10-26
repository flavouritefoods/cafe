import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { hashCustomerPassword, signCustomerToken, setCustomerCookie } from '@/lib/customerAuth'

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json()

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

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : ''
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number for delivery notifications.' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const payload = await getPayload({ config: configPromise })

    // Check if customer with this email or phone already exists
    const existingEmail = await payload.find({
      collection: 'customers',
      where: {
        email: {
          equals: cleanEmail,
        },
      },
      limit: 1,
    })

    const existingPhone = await payload.find({
      collection: 'customers',
      where: {
        phone: {
          equals: cleanPhone,
        },
      },
      limit: 1,
    })

    const { salt, hash } = hashCustomerPassword(password)

    let customerId: number | string

    if (existingEmail.docs.length > 0) {
      const existing = existingEmail.docs[0] as any
      if (existing.passwordHash) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 400 }
        )
      }
      // Existing guest customer updating with password
      const updated = await payload.update({
        collection: 'customers',
        id: existing.id,
        data: {
          name: name.trim(),
          phone: cleanPhone,
          passwordHash: hash,
          passwordSalt: salt,
          isVerified: true,
        },
      })
      customerId = updated.id
    } else if (existingPhone.docs.length > 0) {
      const existing = existingPhone.docs[0] as any
      if (existing.passwordHash) {
        return NextResponse.json(
          { error: 'An account with this mobile number already exists. Please sign in.' },
          { status: 400 }
        )
      }
      // Existing phone customer updating with email and password
      const updated = await payload.update({
        collection: 'customers',
        id: existing.id,
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash: hash,
          passwordSalt: salt,
          isVerified: true,
        },
      })
      customerId = updated.id
    } else {
      // Create brand new customer
      const created = await payload.create({
        collection: 'customers',
        data: {
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash: hash,
          passwordSalt: salt,
          isVerified: true,
        },
      })
      customerId = created.id
    }

    // Generate session token and set cookie
    const token = signCustomerToken({
      id: customerId,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
    })

    const response = NextResponse.json({
      success: true,
      message: `Welcome to Flavourite, ${name.trim()}!`,
      customer: {
        id: customerId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
      },
    })

    setCustomerCookie(response, token)
    return response
  } catch (err: any) {
    console.error('Error in customer registration:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
