import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'
import { sendOtpSms } from '@/lib/sms'

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

    // Read store settings for admin registration policy and SMS configuration
    let storeSettings: any = null
    let registrationMode = 'open'
    let whitelistSet = new Set<string>()

    try {
      storeSettings = (await payload.findGlobal({ slug: 'store-settings' })) as any
      if (storeSettings?.adminRegistrationMode) {
        registrationMode = storeSettings.adminRegistrationMode
      }
      if (storeSettings?.adminWhitelistPhones) {
        const numbers = String(storeSettings.adminWhitelistPhones)
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

    let isNewUser = false
    let userName = ''

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

      isNewUser = false
      userName = user.name || ''
    } else {
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

      isNewUser = true
    }

    // Dispatch real SMS via configured SMS gateway (Fast2SMS / Twilio)
    const smsResult = await sendOtpSms({
      phone: cleanPhone,
      otp: generatedOtp,
      settings: storeSettings,
    })

    if (!smsResult.success) {
      return NextResponse.json(
        {
          error:
            smsResult.error ||
            'SMS delivery failed. If you have not configured an SMS provider yet, please log in using the Email & Password tab.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      userName: isNewUser ? undefined : userName,
      message: `Verification code sent via SMS to +91 ${cleanPhone}`,
    })
  } catch (err: any) {
    console.error('Error in admin send-otp:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}
