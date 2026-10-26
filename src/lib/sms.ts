export interface SendSmsResult {
  success: boolean
  provider?: string
  error?: string
}

export async function sendOtpSms({
  phone,
  otp,
  settings,
}: {
  phone: string
  otp: string
  settings?: any
}): Promise<SendSmsResult> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10)

  // 1. Determine provider & API key from StoreSettings or process.env
  const provider = settings?.smsProvider || process.env.SMS_PROVIDER || 'fast2sms'
  const fast2smsKey = settings?.fast2smsApiKey || process.env.FAST2SMS_API_KEY
  const twilioSid = settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID
  const twilioToken = settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = settings?.twilioFromNumber || process.env.TWILIO_FROM_NUMBER

  // 2. Fast2SMS (Industry standard for India OTPs with zero DLT paperwork needed on OTP route)
  if (provider === 'fast2sms' || (!provider && fast2smsKey)) {
    if (!fast2smsKey) {
      console.warn(`[SMS] Fast2SMS API key not configured. OTP for +91 ${cleanPhone}: ${otp}`)
      return {
        success: false,
        error: 'SMS service is not yet configured. Please configure an SMS API key in Store Settings.',
      }
    }

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanPhone,
        }),
      })

      const result = await response.json()
      if (result.return === true || result.status_code === 200) {
        console.log(`[SMS] Successfully dispatched OTP SMS to +91 ${cleanPhone} via Fast2SMS`)
        return { success: true, provider: 'fast2sms' }
      } else {
        console.error('[SMS] Fast2SMS API error:', result)
        return {
          success: false,
          provider: 'fast2sms',
          error: result.message?.[0] || result.message || 'Failed to dispatch SMS via Fast2SMS',
        }
      }
    } catch (err: any) {
      console.error('[SMS] Network failure calling Fast2SMS:', err)
      return { success: false, provider: 'fast2sms', error: err?.message || 'Network error reaching SMS gateway' }
    }
  }

  // 3. Twilio
  if (provider === 'twilio' && twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')
      const body = new URLSearchParams({
        To: `+91${cleanPhone}`,
        From: twilioFrom,
        Body: `Your Flavourite Cafe & Bakery verification code is: ${otp}. Valid for 5 minutes.`,
      })

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      const result = await response.json()
      if (response.ok && result.sid) {
        console.log(`[SMS] Successfully dispatched OTP SMS to +91 ${cleanPhone} via Twilio`)
        return { success: true, provider: 'twilio' }
      } else {
        console.error('[SMS] Twilio error:', result)
        return { success: false, provider: 'twilio', error: result.message || 'Twilio failed to dispatch SMS' }
      }
    } catch (err: any) {
      console.error('[SMS] Network failure calling Twilio:', err)
      return { success: false, provider: 'twilio', error: err?.message }
    }
  }

  // Fallback if no provider configured
  console.warn(`[SMS] No active SMS provider configured. OTP generated for +91 ${cleanPhone}: ${otp}`)
  return {
    success: false,
    error: 'SMS gateway is not configured. Please enter your SMS Gateway API key in Store Settings.',
  }
}
