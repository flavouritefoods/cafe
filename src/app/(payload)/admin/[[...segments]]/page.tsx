/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import { AdminLoginUnifiedClient } from '../login/AdminLoginUnifiedClient'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const resolvedParams = await params
  if (resolvedParams?.segments?.[0] === 'login') {
    return {
      title: 'Login • Flavourite Bakery Admin',
      description: 'Administrator and staff login portal for Flavourite Cafe & Bakery.',
      robots: 'noindex, nofollow',
    }
  }
  return generatePageMetadata({ config, params, searchParams })
}

const Page = async ({ params, searchParams }: Args) => {
  const resolvedParams = await params
  const segment = resolvedParams?.segments?.[0]

  // Intercept the /admin/login route to present the unified Mobile OTP + Email login portal
  // DO NOT blindly redirect based on cookie presence here to prevent infinite redirect loops
  // with Payload's server session validator when cookies expire or become invalid.
  if (segment === 'login') {
    return <AdminLoginUnifiedClient />
  }

  return RootPage({ 
    config, 
    importMap, 
    params, 
    searchParams 
  })
}

export default Page
