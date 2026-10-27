import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { pushOrderToShiprocket, getShiprocketSettings } from '@/lib/shiprocket'
import { sendOrderConfirmationEmails } from '@/lib/email'
import { sendTelegramOrderNotification } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails,
    } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay verification parameters' },
        { status: 400 }
      )
    }

    // Retrieve Secret Key from env or store-settings
    let keySecret = process.env.RAZORPAY_KEY_SECRET

    const payload = await getPayload({ config: configPromise })

    if (!keySecret) {
      try {
        const settings: any = await payload.findGlobal({ slug: 'store-settings' })
        if (settings?.razorpayKeySecret) keySecret = settings.razorpayKeySecret
      } catch (settingsErr) {
        console.warn('Could not read store-settings for Razorpay key secret:', settingsErr)
      }
    }

    if (!keySecret) {
      return NextResponse.json(
        { error: 'Razorpay secret key not configured on the server' },
        { status: 500 }
      )
    }

    // Cryptographic signature verification: HMAC-SHA256(order_id + '|' + payment_id, secret)
    const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(dataToSign)
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      console.error('Razorpay signature mismatch:', {
        expected: expectedSignature,
        received: razorpay_signature,
      })
      return NextResponse.json(
        { error: 'Invalid payment signature. Payment verification failed.' },
        { status: 400 }
      )
    }

    // Payment is verified authentic! Create confirmed order in Payload CMS
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      landmark,
      city,
      state,
      pincode,
      deliveryDate,
      deliverySlot,
      specialInstructions,
      items,
      subtotal,
      tax,
      shipping,
      total,
    } = orderDetails || {}

    const now = new Date()
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `FLV-${dateStr}-${randomSuffix}`

    const baseOrderData: any = {
      orderNumber,
      orderStatus: 'confirmed',
      paymentStatus: 'paid_razorpay',
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || 'Not provided',
      customerEmail: customerEmail || undefined,
      deliveryAddress: deliveryAddress || 'Address provided during payment',
      landmark: landmark || undefined,
      pincode: pincode || '000000',
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      deliverySlot: deliverySlot || 'asap',
      specialInstructions: specialInstructions || undefined,
      items: (items || []).map((item: any) => ({
        name: item.name,
        variantName: item.variantName || 'Standard',
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      subtotal: Number(subtotal || 0),
      tax: Number(tax || 0),
      shipping: Number(shipping || 0),
      total: Number(total || 0),
      paymentMethod: 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    }

    let order: any = null
    try {
      order = await payload.create({
        collection: 'orders',
        data: {
          ...baseOrderData,
          city: city || 'Samalkot',
          state: state || 'Andhra Pradesh',
        },
      })
    } catch (createErr) {
      console.warn('Retrying order creation with base schema fields:', createErr)
      try {
        order = await payload.create({
          collection: 'orders',
          data: baseOrderData,
        })
      } catch (fallbackErr) {
        console.error('Fallback order creation failed:', fallbackErr)
      }
    }

    const finalOrder = order || {
      id: orderNumber,
      ...baseOrderData,
      city: city || 'Samalkot',
      state: state || 'Andhra Pradesh',
      createdAt: now.toISOString(),
    }

    // Auto-push order to Shiprocket if configured
    let shiprocketResult: any = null
    try {
      const srSettings = await getShiprocketSettings()
      if (srSettings && srSettings.autoPush !== false) {
        shiprocketResult = await pushOrderToShiprocket(finalOrder)
        if (order?.id) {
          await payload.update({
            collection: 'orders',
            id: order.id,
            data: {
              shiprocketOrderId: shiprocketResult.shiprocketOrderId || undefined,
              shiprocketShipmentId: shiprocketResult.shiprocketShipmentId || undefined,
              awbCode: shiprocketResult.awbCode || undefined,
              courierName: shiprocketResult.courierName || undefined,
              trackingUrl: shiprocketResult.trackingUrl || undefined,
              shiprocketStatus: shiprocketResult.status || undefined,
            },
          })
        }
      }
    } catch (srErr) {
      console.error('Non-fatal Shiprocket auto-push error:', srErr)
    }

    // Automated Notifications (Customer email invoice & Kitchen staff alert)
    try {
      const storeSettings: any = await payload.findGlobal({ slug: 'store-settings' })
      if (storeSettings && storeSettings.enableOrderEmails !== false) {
        await sendOrderConfirmationEmails({
          order: finalOrder,
          settings: storeSettings,
        })
      }
      if (storeSettings && storeSettings.telegramAlertsActive !== false) {
        await sendTelegramOrderNotification({
          order: finalOrder,
          settings: storeSettings,
        })
      }
    } catch (notifyErr) {
      console.error('Non-fatal order notification error:', notifyErr)
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderNumber,
      orderId: finalOrder.id,
      order: finalOrder,
      shiprocket: shiprocketResult,
    })
  } catch (error: any) {
    console.error('Error during Razorpay payment verification:', error)
    return NextResponse.json(
      { error: error?.message || 'Server error while verifying payment' },
      { status: 500 }
    )
  }
}
