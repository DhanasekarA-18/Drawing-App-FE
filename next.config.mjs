/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const nextConfig = {
  env: {
    SOCKET_URL: isProd
      ? "https://drawing-app-be-1.onrender.com"
      : "http://localhost:5001",
  },
};

export default nextConfig;
