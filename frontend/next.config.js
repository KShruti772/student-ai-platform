/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    experimental: {
        typedRoutes: true,
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    webpack: (config, { dev }) => {
        if (dev) {
            config.cache = false
            config.devtool = 'eval-cheap-module-source-map'
        }
        return config
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
}
module.exports = nextConfig
