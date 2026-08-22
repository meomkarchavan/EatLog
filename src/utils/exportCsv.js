/**
 * exportCsv.js — Queries user's daily_logs and weight_logs from Firestore,
 * formats into a structured CSV, and triggers a browser download.
 */
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Escape a CSV field value. Wraps in quotes if it contains commas,
 * quotes, or newlines.
 */
function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser download of the given CSV string.
 */
function downloadCsv(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a date string for display in the CSV.
 */
function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  } catch {
    return isoStr;
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Export all user data as CSV.
 * Returns the filename used for download.
 */
export async function exportAllDataAsCsv() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  // --- Fetch daily_logs ---
  const mealsQuery = query(
    collection(db, 'daily_logs'),
    where('user_id', '==', uid),
    orderBy('timestamp', 'asc')
  );
  const mealsSnap = await getDocs(mealsQuery);
  const meals = mealsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // --- Fetch weight_logs ---
  const weightsQuery = query(
    collection(db, 'weight_logs'),
    where('user_id', '==', uid),
    orderBy('date', 'asc')
  );
  const weightsSnap = await getDocs(weightsQuery);
  const weights = weightsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // --- Build CSV ---
  const lines = [];

  // Section 1: Meal Logs
  lines.push('=== MEAL LOGS ===');
  lines.push(['Date', 'Time', 'Food', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fiber (g)', 'Input Method'].join(','));

  for (const m of meals) {
    lines.push([
      escapeCsv(formatDate(m.timestamp)),
      escapeCsv(formatTime(m.timestamp)),
      escapeCsv(m.food_summary),
      m.calories ?? 0,
      m.protein_g ?? 0,
      m.carbs_g ?? 0,
      m.fat_g ?? 0,
      m.fiber_g ?? 0,
      escapeCsv(m.input_method || 'text'),
    ].join(','));
  }

  // Blank separator
  lines.push('');

  // Section 2: Weight Logs
  lines.push('=== WEIGHT LOGS ===');
  lines.push(['Date', 'Weight (kg)'].join(','));

  for (const w of weights) {
    lines.push([
      escapeCsv(w.date || formatDate(w.timestamp)),
      w.weight_kg ?? '',
    ].join(','));
  }

  // Build filename
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const filename = `EatLog_Export_${today}.csv`;

  downloadCsv(lines.join('\n'), filename);

  return { filename, mealCount: meals.length, weightCount: weights.length };
}
