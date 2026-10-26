import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Flavourite Bakery • Admin Mobile Login',
  description: 'Password-free admin and staff login for Flavourite Cafe & Bakery.',
  robots: 'noindex, nofollow',
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FFFDF9]">{children}</body>
    </html>
  )
}
