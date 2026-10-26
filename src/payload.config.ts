import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Banners } from './collections/Banners'
import { Orders } from './collections/Orders'
import { StoreSettings } from './globals/StoreSettings'

import fs from 'fs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// On Vercel serverless environments, the project root is strictly read-only.
// If no remote DATABASE_URI (such as Turso) is configured, copy the bundled payload.db to /tmp
// so SQLite can open in read-write mode without throwing ConnectionFailed 14.
let databaseUrl = process.env.DATABASE_URI || 'file:./payload.db'
if (process.env.VERCEL && (!process.env.DATABASE_URI || process.env.DATABASE_URI.startsWith('file:'))) {
  const tmpDbPath = '/tmp/payload.db'
  const localDbPath = path.resolve(process.cwd(), 'payload.db')
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
    try {
      fs.copyFileSync(localDbPath, tmpDbPath)
    } catch (e) {
      console.error('Failed to copy payload.db to /tmp on Vercel:', e)
    }
  }
  databaseUrl = `file:${tmpDbPath}`
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '• Flavourite Bakery Admin',
    },
    components: {
      beforeDashboard: ['@/components/admin/BakeryDashboard#BakeryDashboard'],
      beforeNavLinks: ['@/components/admin/AdminNavHeader#AdminNavHeader'],
    },
    livePreview: {
      url: 'http://localhost:3000',
      collections: ['banners', 'categories', 'products'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Customers, Media, Categories, Products, Banners, Orders],
  globals: [StoreSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'secret-key-for-local-dev-flavourite-cafe-2026',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    push: true,
    client: {
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    },
  }),
})
