/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'

import config from '@payload-config'
import '@payloadcms/next/css'
import './admin.css'
import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { serverFunction } from './serverFunction'
import { importMap } from './admin/importMap'

export const metadata: Metadata = {
  title: 'Flavourite Bakery Admin',
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RootLayout 
    config={config} 
    importMap={importMap}
    serverFunction={serverFunction}
  >
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){ try { document.documentElement.setAttribute('data-theme', 'light'); document.cookie = 'payload-theme=light; path=/; max-age=31536000'; } catch(e){} })();`,
      }}
    />
    {children}
  </RootLayout>
)

export default Layout
