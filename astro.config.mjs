import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// Static pages; only /api/collect runs on the server (it holds the Google credentials from .env).
export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  env: {
    schema: {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_PRIVATE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SHEET_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
