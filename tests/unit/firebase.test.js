import { describe, it, expect } from 'vitest';
import { app, auth, db } from '../../src/firebase.js';

describe('Firebase Client SDK Module', () => {
  it('initializes Firebase App correctly', () => {
    expect(app).toBeDefined();
    expect(app.name).toBe('[DEFAULT]');
  });

  it('creates Auth and Firestore instances', () => {
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
  });
});
