import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';

const FALLBACK_CATEGORIES = [
  "Accessories", "Aksesoris HP", "Beauty/Makeup", "FOOD", "Health",
  "Home Living", "Men Fashion", "Moms&Baby", "Toys", "Woman Fashion",
  "TAP Brand", "SUPERGOAT", "Matchmaking030625", "Unknown Source", "Database Jeff"
];

const SETTINGS_DOC = doc(db, 'settings', 'categories');

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const snap = await getDoc(SETTINGS_DOC);
        let list: string[] = [];

        if (snap.exists()) {
          list = snap.data()?.list || [];
        }

        // AUTO-SCAN: Ambil kategori unik langsung dari data leads yang ada
        // Ini memastikan kategori lama seperti "Things To Do" ikutan masuk
        const leadsSnap = await getDocs(collection(db, 'leads'));
        const existingCats = new Set<string>(list);
        leadsSnap.forEach(d => {
          const cat = d.data().category;
          if (cat && typeof cat === 'string') existingCats.add(cat.trim());
        });

        const finalMerged = Array.from(new Set([...FALLBACK_CATEGORIES, ...Array.from(existingCats)]))
          .filter(c => c && c !== 'Tambah Baru')
          .sort((a, b) => a.localeCompare(b));

        if (!cancelled) {
          setCategories(finalMerged);
          // Update gudang pusat dengan hasil scan terbaru
          await setDoc(SETTINGS_DOC, { list: finalMerged }, { merge: true });
        }
      } catch (e) {
        // Silently fall back to hardcoded list on error
        if (!cancelled) setCategories(FALLBACK_CATEGORIES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  /**
   * Add a new category to Firestore if it doesn't exist yet.
   * Call this after saving a lead with a custom category.
   */
  const addCategory = async (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    try {
      await updateDoc(SETTINGS_DOC, { list: arrayUnion(trimmed) });
      setCategories(prev => Array.from(new Set([...prev, trimmed])).sort((a, b) => a.localeCompare(b)));
    } catch {
      // Non-critical — the lead was already saved; category just won't appear until next visit
    }
  };

  return { categories, loading, addCategory };
}
