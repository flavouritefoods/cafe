/**
 * Free Telegram Bot Order Notification Service
 * 100% Free Forever with unlimited messages.
 * Sends instant push notifications with sound/vibration to owner/staff Telegram groups.
 */

interface SendTelegramParams {
  order: any
  settings?: any
}

export async function sendTelegramOrderNotification({ order, settings }: SendTelegramParams) {
  try {
    const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
    const chatId = settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      return { success: false, reason: 'Telegram bot not configured' }
    }

    const itemsText = (order.items || [])
      .map(
        (it: any) =>
          `• *${it.quantity}x* ${it.name}${it.variantName ? ` (${it.variantName})` : ''} - ₹${it.price * it.quantity}`
      )
      .join('\n')

    const paymentText =
      order.paymentStatus === 'paid_razorpay'
        ? '✅ Paid Online (Razorpay)'
        : order.paymentStatus === 'paid_upi'
        ? '✅ Paid via UPI'
        : order.paymentMethod === 'cod'
        ? '💵 Cash on Delivery (Pay at Door)'
        : '⏳ Payment Pending'

    const message = `🎂 *NEW ORDER RECEIVED!*
━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* \`#${order.orderNumber}\`
👤 *Customer:* ${order.customerName}
📞 *Phone:* \`+91 ${order.customerPhone}\`
💳 *Payment:* ${paymentText}
💰 *Total Amount:* *₹${order.total}*

🛒 *Items Ordered:*
${itemsText}

📍 *Delivery Address:*
${order.deliveryAddress}
${order.landmark ? `Landmark: ${order.landmark}\n` : ''}Pincode: *${order.pincode}* (${order.city || 'Samalkot'})
${order.specialInstructions ? `\n📝 *Kitchen Note:* _"${order.specialInstructions}"_\n` : ''}
━━━━━━━━━━━━━━━━━━━━
🔗 [Open Order in Admin Dashboard](https://flavouritefood.com/admin/collections/orders/${order.id || ''})`

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    const data = await res.json()
    if (data.ok) {
      console.log(`[TELEGRAM] Order alert sent for #${order.orderNumber}`)
      return { success: true }
    } else {
      console.error('[TELEGRAM] Error sending message:', data)
      return { success: false, error: data.description }
    }
  } catch (err: any) {
    console.error('[TELEGRAM] Failed to send Telegram alert:', err)
    return { success: false, error: err?.message }
  }
}
