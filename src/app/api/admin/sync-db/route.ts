import { NextResponse } from 'next/server'
import { syncLocalDbToRemote } from '@/lib/tursoSync'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const targetUrl = process.env.DATABASE_URI

    if (!targetUrl || targetUrl.startsWith('file:')) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URI is not set to a remote database (e.g. Turso). Currently using local file.',
        currentDatabaseUri: targetUrl || 'none',
      })
    }

    const authToken = process.env.DATABASE_AUTH_TOKEN
    const result = await syncLocalDbToRemote(targetUrl, authToken)

    return NextResponse.json({
      targetUrl: targetUrl.replace(/:[^:@]+@/, ':***@'), // mask any embedded passwords
      hasAuthToken: Boolean(authToken),
      ...result,
    })
  } catch (err: any) {
    console.error('Error during database synchronization:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Database sync failed.' },
      { status: 500 }
    )
  }
}
