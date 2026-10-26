import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const CUSTOMER_COOKIE_NAME = 'flavourite_customer_session'
const SECRET = process.env.PAYLOAD_SECRET || 'secret-key-for-local-dev-flavourite-cafe-2026'

// Password Hashing via Node crypto scrypt
export function hashCustomerPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

export function verifyCustomerPassword(password: string, salt: string, hash: string): boolean {
  try {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
  } catch {
    return false
  }
}

// Session Token Generation & Verification
export function signCustomerToken(payload: {
  id: number | string
  email?: string
  phone?: string
  name?: string
}) {
  const data = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyCustomerToken(
  token: string
): { id: number | string; email?: string; phone?: string; name?: string } | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
    if (sig.length !== expectedSig.length) return null
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
      if (parsed.exp && parsed.exp < Date.now()) return null
      return parsed
    }
  } catch {
    return null
  }
  return null
}

export async function getSessionCustomer() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value
    if (!token) return null
    return verifyCustomerToken(token)
  } catch {
    return null
  }
}

export function setCustomerCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })
}

export function clearCustomerCookie(response: NextResponse) {
  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
