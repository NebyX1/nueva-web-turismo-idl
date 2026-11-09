import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const giannaProxy = {
  '/api': {
    target: process.env.GIANNA_BACKEND_URL || env.GIANNA_BACKEND_URL || 'http://127.0.0.1:5000',
    changeOrigin: true,
    timeout: 120000,
    proxyTimeout: 120000,
  },
};

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: { plugins: [tailwindcss()], server: { proxy: giannaProxy }, preview: { proxy: giannaProxy } },
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
