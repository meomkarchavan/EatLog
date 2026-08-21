# Vercel Environment Variables Checklist

Add the following environment variables to your **Vercel Project Settings** under **Settings → Environment Variables** (for Production):

| Variable Name | Required For |
| :--- | :--- |
| `GEMINI_API_KEY` | Backend Gemini 3.6 Flash multimodal AI parsing (`/api/logMeal`) |
| `VITE_FIREBASE_API_KEY` | Firebase Client SDK Authentication & Firestore |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Client SDK Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project Configuration (`eatlog-924b6`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App Application ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics / Measurement ID (Optional) |

> **Note:** Copy the actual values from your local `.env.local` file directly into the Vercel dashboard.
