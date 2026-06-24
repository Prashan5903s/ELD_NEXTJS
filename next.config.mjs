export default {
  images: {
    // domains: ['uat.apnatelelink.us'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '**'
      }
    ] // Use localhost during development
  },
  serverRuntimeConfig: {
    HOSTNAME: process.env.FRONTEND_URL || '127.0.0.1',
    PORT: parseInt(process.env.PORT, 10) || 8000 // Parse to integer
  }
}
