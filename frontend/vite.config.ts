import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // By default, only env variables prefixed with `VITE_` are exposed.
  // We need to load all env vars for Sentry plugin configuration.
  const env = loadEnv(mode, process.cwd(), '');

  const sentryEnabled =
    !!env.SENTRY_AUTH_TOKEN &&
    !!env.SENTRY_ORG &&
    !!env.SENTRY_PROJECT;

  console.log('🔍 Sentry Plugin Status:', sentryEnabled ? '✅ ENABLED' : '❌ DISABLED');
  if (sentryEnabled) {
    console.log('   Organization:', env.SENTRY_ORG);
    console.log('   Project:', env.SENTRY_PROJECT);
    console.log('   Release:', env.VITE_APP_VERSION || 'not set');
  }

  return {
    plugins: [
      {
        name: 'html-random-version',
        transformIndexHtml(html: string) {
          return html.replace('%VITE_APP_VERSION%', env.VITE_APP_VERSION || 'local');
        },
      },
      react(),
      sentryEnabled && sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        release: {
          name: env.VITE_APP_VERSION || 'local',
        },
        sourcemaps: {
          assets: "./dist/**",
          filesToDeleteAfterUpload: "./dist/**/*.map",
        },
      })
    ].filter(Boolean),
    build: {
      sourcemap: true, // required for Sentry mapping
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-components': ['@headlessui/react', '@heroicons/react', 'lucide-react'],
            'form-handling': ['react-hook-form', '@hookform/resolvers', 'yup'],
            'data-visualization': ['recharts'],
            'utilities': ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
