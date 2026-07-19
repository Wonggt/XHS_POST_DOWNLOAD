/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.xhscdn.com" },
      { protocol: "https", hostname: "**.xiaohongshu.com" },
    ],
  },
};

export default nextConfig;
