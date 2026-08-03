export default {
  images: {
    // domains: ['uat.apnatelelink.us'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uat.apnatelelink.us',
        pathname: '**'
      }
    ] // Use localhost during development
  },
  serverRuntimeConfig: {
    HOSTNAME: process.env.FRONTEND_URL || 'uat.apnatelelink.us', // Use localhost during development
    PORT: parseInt(process.env.PORT, 10) || 8000 // Parse to integer
  }
}
