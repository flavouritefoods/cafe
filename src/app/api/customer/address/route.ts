import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSessionCustomer } from '@/lib/customerAuth'

async function findSessionCustomer(payload: any, session: any) {
  if (session.id) {
    try {
      const c = await payload.findByID({ collection: 'customers', id: session.id })
      if (c) return c
    } catch {}
  }
  if (session.email) {
    const byEmail = await payload.find({
      collection: 'customers',
      where: { email: { equals: session.email } },
      limit: 1,
    })
    if (byEmail.docs.length > 0) return byEmail.docs[0]
  }
  if (session.phone) {
    const byPhone = await payload.find({
      collection: 'customers',
      where: { phone: { equals: session.phone } },
      limit: 1,
    })
    if (byPhone.docs.length > 0) return byPhone.docs[0]
  }
  return null
}

export async function POST(req: Request) {
  try {
    const session = await getSessionCustomer()
    if (!session) {
      return NextResponse.json({ error: 'Please log in to manage addresses.' }, { status: 401 })
    }

    const body = await req.json()
    const { label = 'Home', recipientName, phone, addressLine1, landmark, pincode, city = 'Samalkot', isDefault = false } = body

    if (!recipientName || !phone || !addressLine1 || !pincode) {
      return NextResponse.json({ error: 'Name, phone, street address, and pincode are required.' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const customer = await findSessionCustomer(payload, session)

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })
    }

    const existingAddresses = customer.addresses || []

    const newAddress = {
      label,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      landmark: landmark?.trim() || '',
      pincode: pincode.trim(),
      city: city.trim(),
      isDefault: Boolean(isDefault) || existingAddresses.length === 0,
    }

    let updatedAddresses = isDefault 
      ? existingAddresses.map((a: any) => ({ ...a, isDefault: false }))
      : [...existingAddresses]

    updatedAddresses.push(newAddress)

    const updatedCustomer = await payload.update({
      collection: 'customers',
      id: customer.id,
      data: {
        addresses: updatedAddresses,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Address saved successfully!',
      addresses: updatedCustomer.addresses || [],
    })
  } catch (err: any) {
    console.error('Error saving customer address:', err)
    return NextResponse.json({ error: err?.message || 'Failed to save address.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionCustomer()
    if (!session) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const addressId = searchParams.get('id')

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required.' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const customer = await findSessionCustomer(payload, session)

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })
    }

    const existingAddresses = customer.addresses || []
    const updatedAddresses = existingAddresses.filter((a: any) => a.id !== addressId)

    const updatedCustomer = await payload.update({
      collection: 'customers',
      id: customer.id,
      data: {
        addresses: updatedAddresses,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully.',
      addresses: updatedCustomer.addresses || [],
    })
  } catch (err: any) {
    console.error('Error deleting address:', err)
    return NextResponse.json({ error: err?.message || 'Failed to delete address.' }, { status: 500 })
  }
}
