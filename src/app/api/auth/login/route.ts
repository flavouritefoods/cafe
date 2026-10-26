import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyCustomerPassword, signCustomerToken, setCustomerCookie } from '@/lib/customerAuth'

export async function POST(req: Request) {
  try {
    const { identifier, email, phone, password } = await req.json()

    // Accept identifier, email, or phone
    const loginIdentifier = (identifier || email || phone || '').toString().trim()

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Please enter your email or mobile number and password.' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: configPromise })

    // Check if identifier is email or phone
    const isEmail = loginIdentifier.includes('@')
    const cleanPhone = loginIdentifier.replace(/\D/g, '').slice(-10)

    let customerResult = await payload.find({
      collection: 'customers',
      where: isEmail
        ? { email: { equals: loginIdentifier.toLowerCase() } }
        : { phone: { equals: cleanPhone } },
      limit: 1,
    })

    // If not found and identifier could be the other type, attempt fallback
    if (customerResult.docs.length === 0 && !isEmail && cleanPhone.length === 10) {
      customerResult = await payload.find({
        collection: 'customers',
        where: { phone: { equals: cleanPhone } },
        limit: 1,
      })
    }

    if (customerResult.docs.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email or mobile number. Please check or register.' },
        { status: 401 }
      )
    }

    const customer = customerResult.docs[0] as any

    if (!customer.passwordHash || !customer.passwordSalt) {
      return NextResponse.json(
        {
          error:
            'A password has not been set for this account yet. Please switch to "Create Account" to set your password.',
        },
        { status: 400 }
      )
    }

    const isValid = verifyCustomerPassword(password, customer.passwordSalt, customer.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 }
      )
    }

    // Sign session token and set cookie
    const token = signCustomerToken({
      id: customer.id,
      name: customer.name || 'Valued Customer',
      email: customer.email || '',
      phone: customer.phone || '',
    })

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${customer.name || 'Valued Customer'}!`,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        addresses: customer.addresses || [],
      },
    })

    setCustomerCookie(response, token)
    return response
  } catch (err: any) {
    console.error('Error in customer login:', err)
    return NextResponse.json(
      { error: err?.message || 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
