import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Ensure Firebase test environment has non-empty keys
process.env.VITE_FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForTestingAndInitialization';
process.env.VITE_FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'eatlog-dev';
process.env.VITE_FIREBASE_AUTH_DOMAIN = process.env.VITE_FIREBASE_AUTH_DOMAIN || 'eatlog.firebaseapp.com';

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock SVG getBBox for SVG text measurement in jsdom
if (typeof SVGElement !== 'undefined') {
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 20,
    height: 10,
  });
}
