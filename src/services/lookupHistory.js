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
const LOCAL_STORAGE_KEY_PREFIX = 'eatlog_lookup_history_';

/**
 * Gets cached lookup history from localStorage.
 */
export function getLocalLookupHistory(userId) {
  if (typeof window === 'undefined') return [];
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves lookup history to localStorage for instant tab-switching cache.
 */
export function saveLocalLookupHistory(userId, items) {
  if (typeof window === 'undefined') return;
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify((items || []).slice(0, 30)));
  } catch (err) {
    console.warn('Could not save lookup history to localStorage:', err);
  }
}

/**
 * Saves a successful food lookup to the user's persistent lookup history in Firestore and localStorage.
 *
 * @param {string} userId - The Firebase Auth UID.
 * @param {Object} data - Nutritional data for the looked-up food.
 * @returns {Promise<Object>} The saved document reference / item data.
 */
export async function saveLookupToHistory(userId, data) {
  if (!userId || !data) return null;

  const docPayload = {
    userId,
    user_id: userId, // for backwards and rules compatibility
    food_summary: data.food_summary || 'Unknown Food',
    calories: Number(data.calories) || 0,
    protein_g: Number(data.protein_g) || 0,
    carbs_g: Number(data.carbs_g) || 0,
    fat_g: Number(data.fat_g) || 0,
    fiber_g: Number(data.fiber_g) || 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), docPayload);
  const result = {
    id: docRef.id,
    ...docPayload,
    createdAt: new Date().toISOString(),
  };

  // Update local cache
  const cached = getLocalLookupHistory(userId);
  const updated = [result, ...cached.filter((i) => i.id !== result.id && i.food_summary !== result.food_summary)];
  saveLocalLookupHistory(userId, updated);

  return result;
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
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    if (docs.length > 0) {
      saveLocalLookupHistory(userId, docs);
    }
    return docs;
  } catch (err) {
    console.warn('Ordered Firestore query failed (index pending?), applying fallback sort:', err);
    try {
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

      const sliced = items.slice(0, 20);
      if (sliced.length > 0) {
        saveLocalLookupHistory(userId, sliced);
      }
      return sliced;
    } catch {
      return getLocalLookupHistory(userId);
    }
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

      const finalItems = items.slice(0, 20);
      if (finalItems.length > 0) {
        saveLocalLookupHistory(userId, finalItems);
      }
      onUpdate(finalItems);
    },
    (err) => {
      console.warn('Firestore lookup history listener error, using local cache:', err);
      const local = getLocalLookupHistory(userId);
      if (local.length > 0) {
        onUpdate(local);
      }
      if (onError) onError(err);
    }
  );
}

/**
 * Deletes a lookup item from Firestore history by its document ID.
 *
 * @param {string} historyId - The document ID in lookup_history.
 * @param {string} [userId] - The user ID to sync with local cache.
 * @returns {Promise<boolean>}
 */
export async function deleteLookupFromHistory(historyId, userId) {
  if (!historyId) return false;

  if (userId) {
    const cached = getLocalLookupHistory(userId);
    saveLocalLookupHistory(userId, cached.filter((i) => i.id !== historyId));
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, historyId));
  } catch (err) {
    console.warn('Could not delete from Firestore (local cache removed):', err);
  }
  return true;
}
