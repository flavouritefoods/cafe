import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'
import { sendOtpSms } from '@/lib/sms'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Clean phone number: remove +91, spaces, dashes
    const cleanPhone = phone.replace(/\D/g, '').slice(-10)

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: configPromise })

    // Generate real, cryptographically random 6-digit OTP
    const generatedOtp = crypto.randomInt(100000, 1000000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    // Find existing customer or create new
    const existing = await payload.find({
      collection: 'customers',
      where: {
        phone: {
          equals: cleanPhone,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'customers',
        id: existing.docs[0].id,
        data: {
          otp: generatedOtp,
          otpExpiresAt: expiresAt,
        },
      })
    } else {
      await payload.create({
        collection: 'customers',
        data: {
          phone: cleanPhone,
          otp: generatedOtp,
          otpExpiresAt: expiresAt,
          isVerified: false,
        },
      })
    }

    // Read store settings for SMS Gateway credentials
    let storeSettings: any = null
    try {
      storeSettings = (await payload.findGlobal({ slug: 'store-settings' })) as any
    } catch (e) {
      console.warn('Could not read store settings for customer SMS dispatch:', e)
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
            'Failed to dispatch SMS verification code. Please check that SMS service is enabled.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent via SMS to +91 ${cleanPhone}`,
    })
  } catch (err: any) {
    console.error('Error sending OTP:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}
