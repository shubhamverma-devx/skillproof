/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse resolves an optional test fixture at require time; keep it external
  // so the server bundle does not try to inline that path.
  experimental: { serverComponentsExternalPackages: ['pdf-parse'] },
};

export default nextConfig;
