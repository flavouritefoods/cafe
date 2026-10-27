import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendOrderConfirmationEmails } from '@/lib/email'
import { sendTelegramOrderNotification } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      landmark,
      pincode,
      deliveryDate,
      deliverySlot,
      specialInstructions,
      items,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod = 'upi_whatsapp',
    } = body

    if (!customerName || !customerPhone || !deliveryAddress || !pincode || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order fields (name, phone, address, pincode, or items)' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: configPromise })

    // Generate readable Order Number: FLV-YYMMDD-XXXX
    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `FLV-${dateStr}-${randomSuffix}`

    // Create the order in Payload CMS
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        orderStatus: 'new',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        deliveryAddress,
        landmark: landmark || undefined,
        pincode,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        deliverySlot: deliverySlot || 'asap',
        specialInstructions: specialInstructions || undefined,
        items: items.map((item: any) => ({
          name: item.name,
          variantName: item.variantName || 'Standard',
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
        subtotal: Number(subtotal),
        tax: Number(tax || 0),
        shipping: Number(shipping || 0),
        total: Number(total),
        paymentMethod,
      },
    })

    // Trigger free email & telegram notifications
    try {
      const storeSettings: any = await payload.findGlobal({ slug: 'store-settings' })
      if (storeSettings && storeSettings.enableOrderEmails !== false) {
        await sendOrderConfirmationEmails({
          order,
          settings: storeSettings,
        })
      }
      if (storeSettings && storeSettings.telegramAlertsActive !== false) {
        await sendTelegramOrderNotification({
          order,
          settings: storeSettings,
        })
      }
    } catch (notifyErr) {
      console.warn('Non-fatal notification error in checkout:', notifyErr)
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      total,
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to place order' },
      { status: 500 }
    )
  }
}
