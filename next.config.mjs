/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Commented out to enable API routes and Image Optimization
  // images: {
  //   unoptimized: true, // Commented out to enable Image Optimization
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'clpmxrgdzhsitzjlmkhf.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
