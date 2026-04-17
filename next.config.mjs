/** @type {import('next').NextConfig} */
const allowedOrigin = process.env.ALLOWED_ORIGIN || "";

const nextConfig = {
  output: "standalone",
  async headers() {
    if (!allowedOrigin) return [];
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: allowedOrigin },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "content-type,authorization" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
