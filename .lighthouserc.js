module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/#programs',
        'http://localhost:3000/#coaches',
        'http://localhost:3000/#stories',
        'http://localhost:3000/#booking',
        'http://localhost:3000/#memberships',
      ],
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready in',
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        // Q4 THE VISIONARY targets (Skills KB §8)
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Core Web Vitals (Skills KB §8)
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],

        // Specific checks
        'uses-responsive-images': ['warn', { minScore: 0.9 }],
        'uses-optimized-images': ['warn', { minScore: 0.9 }],
        'uses-text-compression': ['error', { minScore: 1.0 }],
        'no-vulnerable-libraries': ['error', { minScore: 1.0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
