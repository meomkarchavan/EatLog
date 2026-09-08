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

const toMs = (ts) => (ts?.toDate ? ts.toDate().getTime() : new Date(ts || 0).getTime());

export function getLocalLookupHistory(userId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`eatlog_lookup_history_${userId || 'default'}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalLookupHistory(userId, items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`eatlog_lookup_history_${userId || 'default'}`, JSON.stringify((items || []).slice(0, 30)));
  } catch (err) {
    console.warn('Could not save lookup history to localStorage:', err);
  }
}

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

  const docRef = await addDoc(collection(db, 'lookup_history'), docPayload);
  const result = {
    id: docRef.id,
    ...docPayload,
    createdAt: new Date().toISOString(),
  };

  const cached = getLocalLookupHistory(userId);
  const updated = [result, ...cached.filter((i) => i.id !== result.id && i.food_summary !== result.food_summary)];
  saveLocalLookupHistory(userId, updated);

  return result;
}

export async function getLookupHistory(userId) {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, 'lookup_history'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    if (docs.length > 0) saveLocalLookupHistory(userId, docs);
    return docs;
  } catch (err) {
    console.warn('Ordered Firestore query failed, applying fallback sort:', err);
    try {
      const fallbackQuery = query(
        collection(db, 'lookup_history'),
        where('userId', '==', userId),
        limit(50)
      );
      const snapshot = await getDocs(fallbackQuery);
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      items.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      const sliced = items.slice(0, 20);
      if (sliced.length > 0) saveLocalLookupHistory(userId, sliced);
      return sliced;
    } catch {
      return getLocalLookupHistory(userId);
    }
  }
}

export function subscribeLookupHistory(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'lookup_history'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      items.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
      const finalItems = items.slice(0, 20);
      if (finalItems.length > 0) saveLocalLookupHistory(userId, finalItems);
      onUpdate(finalItems);
    },
    (err) => {
      console.warn('Firestore lookup history listener error, using local cache:', err);
      const local = getLocalLookupHistory(userId);
      if (local.length > 0) onUpdate(local);
      if (onError) onError(err);
    }
  );
}

export async function deleteLookupFromHistory(historyId, userId) {
  if (!historyId) return false;

  if (userId) {
    const cached = getLocalLookupHistory(userId);
    saveLocalLookupHistory(userId, cached.filter((i) => i.id !== historyId));
  }

  try {
    await deleteDoc(doc(db, 'lookup_history', historyId));
  } catch (err) {
    console.warn('Could not delete from Firestore (local cache removed):', err);
  }
  return true;
}
