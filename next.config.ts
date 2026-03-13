/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lodash-es'],
  },
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 5,
  },
  // Windows 파일 잠금 이슈 해결
  trailingSlash: false,
};

module.exports = nextConfig;