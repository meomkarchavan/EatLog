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
  onSnapshot,
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
 * Includes resilient fallback client sorting if composite index is pending.
 *
 * @param {string} userId - The Firebase Auth UID.
 * @returns {Promise<Array>} List of persistent lookup documents.
 */
export async function getLookupHistory(userId) {
  if (!userId) return [];

  try {
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
  } catch (err) {
    console.warn('Ordered Firestore query failed (index pending?), applying fallback sort:', err);
    const fallbackQuery = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      limit(50)
    );
    const snapshot = await getDocs(fallbackQuery);
    const items = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    items.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return items.slice(0, 20);
  }
}

/**
 * Subscribes to real-time updates of the user's persistent lookup history.
 *
 * @param {string} userId - The Firebase Auth UID.
 * @param {Function} onUpdate - Callback invoked with sorted array of lookup history docs.
 * @param {Function} [onError] - Optional error handler callback.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeLookupHistory(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(items.slice(0, 20));
    },
    (err) => {
      console.error('Firestore lookup history listener error:', err);
      if (onError) onError(err);
    }
  );
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
