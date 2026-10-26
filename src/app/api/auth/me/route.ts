import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSessionCustomer } from '@/lib/customerAuth'

export async function GET() {
  try {
    const session = await getSessionCustomer()

    if (!session) {
      return NextResponse.json({ authenticated: false, customer: null, orders: [] })
    }

    const payload = await getPayload({ config: configPromise })

    let customer: any = null

    // 1. Try finding by ID
    if (session.id) {
      try {
        customer = await payload.findByID({
          collection: 'customers',
          id: session.id,
        })
      } catch {}
    }

    // 2. Fallback to email or phone
    if (!customer && session.email) {
      const byEmail = await payload.find({
        collection: 'customers',
        where: { email: { equals: session.email } },
        limit: 1,
      })
      if (byEmail.docs.length > 0) customer = byEmail.docs[0]
    }

    if (!customer && session.phone) {
      const byPhone = await payload.find({
        collection: 'customers',
        where: { phone: { equals: session.phone } },
        limit: 1,
      })
      if (byPhone.docs.length > 0) customer = byPhone.docs[0]
    }

    if (!customer) {
      return NextResponse.json({ authenticated: false, customer: null, orders: [] })
    }

    // 3. Query past orders
    const orderConditions: any[] = []
    if (customer.phone) {
      orderConditions.push({ customerPhone: { equals: customer.phone } })
    }
    if (customer.email) {
      orderConditions.push({ customerEmail: { equals: customer.email } })
    }

    const ordersResult = await payload.find({
      collection: 'orders',
      where: orderConditions.length > 0 ? { or: orderConditions } : { id: { equals: -1 } },
      sort: '-createdAt',
      limit: 25,
    })

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        addresses: customer.addresses || [],
      },
      orders: ordersResult.docs.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        itemCount: o.items?.length || 0,
        createdAt: o.createdAt,
        items: o.items || [],
        courierTrackingUrl: o.courierTrackingUrl,
      })),
    })
  } catch (err: any) {
    console.error('Error fetching customer session:', err)
    return NextResponse.json({ authenticated: false, customer: null, orders: [] })
  }
}
