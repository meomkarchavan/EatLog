import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.{test,spec}.{js,jsx}'],
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_PROJECT_ID: 'eatlog-dev',
      VITE_FIREBASE_AUTH_DOMAIN: 'eatlog-dev.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'eatlog-dev.firebasestorage.app',
      VITE_FIREBASE_APP_ID: '1:634671381722:web:800fded24bfed2e9f579e3',
    },
  },
});
