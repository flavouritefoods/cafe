import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  // Allow IDE tunnels to connect to HMR
  allowedDevOrigins: ['172.16.0.2', 'localhost'],
  async redirects() {
    return [
      {
        source: '/admin-login',
        destination: '/admin/login',
        permanent: true,
      },
    ]
  },
}

export default withPayload(nextConfig)
