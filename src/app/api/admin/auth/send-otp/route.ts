import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Mobile number is required.' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: configPromise })

    // Read store settings for admin registration policy
    let registrationMode = 'open'
    let whitelistSet = new Set<string>()

    try {
      const settings = (await payload.findGlobal({ slug: 'store-settings' })) as any
      if (settings?.adminRegistrationMode) {
        registrationMode = settings.adminRegistrationMode
      }
      if (settings?.adminWhitelistPhones) {
        const numbers = String(settings.adminWhitelistPhones)
          .split(',')
          .map((n) => n.replace(/\D/g, '').slice(-10))
          .filter((n) => n.length === 10)
        whitelistSet = new Set(numbers)
      }
    } catch (e) {
      console.warn('Could not read store settings for admin auth, defaulting to open mode:', e)
    }

    const isWhitelisted = whitelistSet.has(cleanPhone)

    // Check if user already exists with this phone
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        phone: {
          equals: cleanPhone,
        },
      },
      limit: 1,
    })

    // Generate real, cryptographically random 6-digit OTP
    const generatedOtp = crypto.randomInt(100000, 1000000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    if (existingUsers.docs.length > 0) {
      const user = existingUsers.docs[0] as any

      if (user.status === 'suspended') {
        return NextResponse.json(
          { error: 'This account has been suspended. Please contact the store administrator.' },
          { status: 403 }
        )
      }

      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          otp: generatedOtp,
          otpExpiresAt: expiresAt,
        },
      })

      return NextResponse.json({
        success: true,
        isNewUser: false,
        userName: user.name,
        message: `Verification code generated for +91 ${cleanPhone}`,
        otpCode: generatedOtp,
      })
    }

    // User does not exist yet -> Registration Flow
    if (registrationMode === 'closed' && !isWhitelisted) {
      return NextResponse.json(
        {
          error:
            'Administrator registration is currently closed. Please contact the store owner to authorize your mobile number.',
        },
        { status: 403 }
      )
    }

    // Create user record with OTP
    const generatedPassword = crypto.randomBytes(16).toString('hex')
    const initialStatus = registrationMode === 'open' || isWhitelisted ? 'approved' : 'pending'

    await payload.create({
      collection: 'users',
      data: {
        name: 'Administrator',
        phone: cleanPhone,
        email: `${cleanPhone}@flavouritefood.com`,
        password: generatedPassword,
        role: 'admin',
        status: initialStatus,
        otp: generatedOtp,
        otpExpiresAt: expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      isNewUser: true,
      registrationMode,
      message: `Registration verification code generated for +91 ${cleanPhone}`,
      otpCode: generatedOtp,
    })
  } catch (err: any) {
    console.error('Error in admin send-otp:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}
