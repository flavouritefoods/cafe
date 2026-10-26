import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { signAdminToken, setAdminCookie } from '@/lib/adminAuth'

export async function POST(req: Request) {
  try {
    const { phone, otp, name } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Mobile number and verification code are required.' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    const cleanOtp = otp.toString().trim()

    const payload = await getPayload({ config: configPromise })

    const userResult = await payload.find({
      collection: 'users',
      where: {
        phone: {
          equals: cleanPhone,
        },
      },
      limit: 1,
    })

    if (userResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'No account found for this mobile number. Please request a new verification code.' },
        { status: 404 }
      )
    }

    const user = userResult.docs[0] as any

    // Verify OTP against stored code
    if (!user.otp || user.otp !== cleanOtp) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      )
    }

    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      otp: null,
      otpExpiresAt: null,
    }

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim()
    }

    const updatedUser = (await payload.update({
      collection: 'users',
      id: user.id,
      data: updateData,
    })) as any

    // Check account approval status
    if (updatedUser.status === 'pending') {
      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message:
          'Your account has been registered successfully. It is awaiting approval by the store owner in Settings → Staff & Admins.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          status: 'pending',
        },
      })
    }

    if (updatedUser.status === 'suspended') {
      return NextResponse.json(
        { error: 'This account has been suspended. Please contact the store administrator.' },
        { status: 403 }
      )
    }

    // Account is approved: issue official Payload admin JWT session
    const { token } = await signAdminToken({
      id: updatedUser.id,
      email: updatedUser.email,
    })

    const response = NextResponse.json({
      success: true,
      approved: true,
      message: `Welcome, ${updatedUser.name}! Logging you into the Admin Dashboard...`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    })

    setAdminCookie(response, token)
    return response
  } catch (err: any) {
    console.error('Error in admin verify-otp:', err)
    return NextResponse.json(
      { error: err?.message || 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
