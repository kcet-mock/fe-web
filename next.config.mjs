const repoName = 'fe-web';

/** @type {import('next').NextConfig | ((phase: string) => import('next').NextConfig)} */
export default function nextConfig(phase) {
  const isProdBuild = process.env.NODE_ENV === 'production';
  const enableInternal = process.env.NEXT_PUBLIC_INTERNAL_PAGES === 'true';

  return {
    reactStrictMode: true,
    // Generate a fully static export so GitHub Pages can serve files from ./out.
    output: isProdBuild ? 'export' : undefined,
    images: {
      unoptimized: true,
    },
    // Increase page data size threshold to suppress warnings
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
    experimental: {
      largePageDataBytes: 256 * 1024, // Increase from 128 KB to 256 KB
    },
    // Serve the app from /fe-web when built for production (GitHub Pages repo path)
    basePath: isProdBuild ? `/${repoName}` : '',
    assetPrefix: isProdBuild ? `/${repoName}/` : '',
    ...(enableInternal
      ? {
          async rewrites() {
            return [
              {
                source: '/api/internal/:path*',
                destination: 'http://localhost:8787/api/internal/:path*',
              },
            ];
          },
        }
      : {}),
  };
}
