const isProd = process.env.NODE_ENV === 'production';
const repoName = 'fe-web';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: API routes (used for GitHub PR creation) are not compatible
  // with `output: 'export'`, so this app now runs in the default
  // server mode instead of static export.
  // Serve the app from /fe-web when built for production (e.g. custom base path)
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
};

export default nextConfig;
