const isProd = process.env.NODE_ENV === 'production';
const repoName = 'fe-web';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Generate a fully static export so GitHub Pages
  // can serve files from the ./out directory.
  output: 'export',
  // Serve the app from /fe-web when built for production (GitHub Pages repo path)
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
};

export default nextConfig;
