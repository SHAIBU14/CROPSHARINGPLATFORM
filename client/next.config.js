/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  webpack(config) {
    const firebaseAuthPath = path.resolve(__dirname, 'node_modules/firebase/auth/dist/esm/index.esm.js')
    const firebaseAppPath = path.resolve(__dirname, 'node_modules/firebase/app/dist/esm/index.esm.js')
    const firebaseInnerAuthPath = path.resolve(__dirname, 'node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index.js')

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'firebase/app$': firebaseAppPath,
      'firebase/auth$': firebaseAuthPath,
      '@firebase/auth$': firebaseInnerAuthPath,
      '@firebase/auth/dist/node-esm/index.js$': firebaseInnerAuthPath,
    }

    return config
  },
}

module.exports = nextConfig
