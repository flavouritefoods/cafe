import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { signCustomerToken } from '@/lib/customerAuth'

export async function POST(req: Request) {
  try {
    const { phone, otp, name } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required.' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    const cleanOtp = otp.toString().trim()

    const payload = await getPayload({ config: configPromise })

    const customerResult = await payload.find({
      collection: 'customers',
      where: {
        phone: {
          equals: cleanPhone,
        },
      },
      limit: 1,
    })

    if (customerResult.docs.length === 0) {
      return NextResponse.json({ error: 'Customer not found. Please request a new OTP.' }, { status: 404 })
    }

    const customer = customerResult.docs[0] as any

    // Verify OTP against stored OTP
    if (!customer.otp || customer.otp !== cleanOtp) {
      return NextResponse.json({ error: 'Invalid OTP code. Please check and try again.' }, { status: 400 })
    }

    if (customer.otpExpiresAt && new Date(customer.otpExpiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a fresh one.' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    }

    if (name && !customer.name) {
      updateData.name = name.trim()
    }

    const updatedCustomer = await payload.update({
      collection: 'customers',
      id: customer.id,
      data: updateData,
    })

    // Issue JWT cookie
    const token = signCustomerToken({
      id: updatedCustomer.id,
      phone: updatedCustomer.phone,
      name: updatedCustomer.name || undefined,
    })

    const response = NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully!',
      customer: {
        id: updatedCustomer.id,
        phone: updatedCustomer.phone,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        addresses: updatedCustomer.addresses || [],
      },
    })

    // Set secure HTTP-only cookie (30 days)
    response.cookies.set({
      name: 'flavourite_customer_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (err: any) {
    console.error('Error verifying OTP:', err)
    return NextResponse.json(
      { error: err?.message || 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
