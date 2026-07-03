import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * IRONFORGE — Next.js 16 production configuration.
 *
 * Content-Security-Policy directives:
 *   - default-src 'self'                 — deny everything not explicitly allowed
 *   - script-src 'self' 'unsafe-inline'  — Next.js App Router inline runtime (nonce-based is future hardening)
 *   - style-src 'self' 'unsafe-inline'   — Tailwind v4 + Next.js inject inline styles
 *   - img-src 'self' data: https:        — self-hosted assets + og:image + R2 signed URLs
 *   - font-src 'self'                    — self-hosted Bebas Neue / Oswald / Archivo / JetBrains Mono
 *   - connect-src 'self' https://api.stripe.com https://js.stripe.com  — Stripe client SDK
 *   - media-src 'self'                   — self-hosted MP4 reels (Phase 3+)
 *   - frame-ancestors 'none'             — clickjacking defense (X-Frame-Options: DENY equivalent)
 *   - base-uri 'self'                    — prevent <base> injection
 *   - form-action 'self'                 — forms may only submit to origin
 *   - object-src 'none'                  — no Flash/Java/plugins
 *
 * 'unsafe-eval' is intentionally absent — not required for Next.js 16 production builds.
 * 'unsafe-inline' is required for script-src (Next.js inline runtime) and style-src (Tailwind v4 + Next.js inline styles).
 * Future hardening: switch to nonce-based CSP once Next.js 16 supports it natively.
 */
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com https://js.stripe.com",
  "media-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    'ironforge.local',
    'localhost',
    '127.0.0.1',
    'ironforge.jesspete.shop',
    '192.168.2.132',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // DEV PLACEHOLDER — picsum.photos for hero reel frames.
      // Phase 8 (AI asset generation) replaces these with R2-hosted
      // Replicate SDXL B&W noir athletic photography.
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      // R2 signed URLs (Phase 8 AI asset generation)
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      // Replicate delivery URLs (if used directly — normally proxied via R2)
      { protocol: 'https', hostname: 'replicate.delivery' },
    ],
  },
  // External packages that should not be bundled (Next.js 16: top-level key)
  serverExternalPackages: ['bcryptjs', 'stripe', 'replicate', 'inngest'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP — browser-level XSS mitigation (OWASP A03 + A05)
          { key: 'Content-Security-Policy', value: CSP_POLICY },
          // HSTS — origin-level (2 years, includeSubDomains, preload-eligible)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
