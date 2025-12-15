const isProd = process.env.NODE_ENV === 'production';
const repoName = 'fe-web';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Generate a fully static site suitable for GitHub Pages
  output: 'export',
  // Serve the app from /fe-web when built for production (GitHub Pages project URL)
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
};

export default nextConfig;
