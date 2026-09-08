import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env.local / .env)
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.resolve(__dirname, '../.env.local')); } catch (_) {
    try { process.loadEnvFile(path.resolve(__dirname, '../.env')); } catch (_) {}
  }
}

const env = process.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Error: Missing Firebase environment variables in .env.local or environment.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function deleteUserByEmailAndPassword(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await deleteUser(userCredential.user);
    console.log(`✓ Successfully deleted user: ${email}`);
    return true;
  } catch (err) {
    console.error(`- Error deleting ${email}:`, err.message);
    return false;
  }
}
