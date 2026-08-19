import test from 'node:test';
import assert from 'node:assert';
import { app, auth, db } from '../src/firebase.js';

test('Firebase App is initialized correctly', () => {
  assert.ok(app, 'Firebase app should be initialized');
  assert.strictEqual(app.name, '[DEFAULT]');
  assert.strictEqual(app.options.projectId, 'eatlog-dev');
});

test('Firebase Auth and Firestore services are created', () => {
  assert.ok(auth, 'Auth instance should be initialized');
  assert.ok(db, 'Firestore instance should be initialized');
});
