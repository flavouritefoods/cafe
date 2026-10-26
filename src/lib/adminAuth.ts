import { jwtSign } from 'payload'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE_NAME = 'payload-token'
export const ADMIN_SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export async function signAdminToken(user: { id: number | string; email: string }) {
  const secret = process.env.PAYLOAD_SECRET || 'secret-key-for-local-dev-flavourite-cafe-2026'
  
  const { token, exp } = await jwtSign({
    fieldsToSign: {
      id: user.id,
      collection: 'users',
      email: user.email,
    },
    secret,
    tokenExpiration: ADMIN_SESSION_MAX_AGE,
  })

  return { token, exp }
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  })
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
