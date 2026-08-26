import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'lookup_history';

/**
 * Saves a successful food lookup to the user's persistent lookup history in Firestore.
 *
 * @param {string} userId - The Firebase Auth UID.
 * @param {Object} data - Nutritional data for the looked-up food.
 * @returns {Promise<Object>} The saved document reference / item data.
 */
export async function saveLookupToHistory(userId, data) {
  if (!userId || !data) return null;

  const docPayload = {
    userId,
    food_summary: data.food_summary || 'Unknown Food',
    calories: Number(data.calories) || 0,
    protein_g: Number(data.protein_g) || 0,
    carbs_g: Number(data.carbs_g) || 0,
    fat_g: Number(data.fat_g) || 0,
    fiber_g: Number(data.fiber_g) || 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), docPayload);
  return {
    id: docRef.id,
    ...docPayload,
    createdAt: new Date(),
  };
}

/**
 * Fetches the user's past lookups ordered by createdAt descending (limit 20).
 *
 * @param {string} userId - The Firebase Auth UID.
 * @returns {Promise<Array>} List of persistent lookup documents.
 */
export async function getLookupHistory(userId) {
  if (!userId) return [];

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Deletes a lookup item from Firestore history by its document ID.
 *
 * @param {string} historyId - The document ID in lookup_history.
 * @returns {Promise<boolean>}
 */
export async function deleteLookupFromHistory(historyId) {
  if (!historyId) return false;
  await deleteDoc(doc(db, COLLECTION_NAME, historyId));
  return true;
}
