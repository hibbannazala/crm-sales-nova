import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const FALLBACK_CATEGORIES = [
  "Accessories", "Aksesoris HP", "Beauty/Makeup", "FOOD", "Health",
  "Home Living", "Men Fashion", "Moms&Baby", "Toys", "Woman Fashion",
  "TAP Brand", "SUPERGOAT", "Matchmaking030625", "Unknown Source", "Database Jeff"
];

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const { data: snap } = await supabase.from('settings').select('list').eq('id', 'categories').single();
        let list: string[] = [];

        if (snap) {
          list = snap.list || [];
        }

        const { data: leadsSnap } = await supabase.from('leads').select('category');
        const existingCats = new Set<string>(list);
        if (leadsSnap) {
          leadsSnap.forEach(d => {
            const cat = d.category;
            if (cat && typeof cat === 'string') existingCats.add(cat.trim());
          });
        }

        const finalMerged = Array.from(new Set([...FALLBACK_CATEGORIES, ...Array.from(existingCats)]))
          .filter(c => c && c !== 'Tambah Baru')
          .sort((a, b) => a.localeCompare(b));

        if (!cancelled) {
          setCategories(finalMerged);
          await supabase.from('settings').upsert({ id: 'categories', list: finalMerged });
        }
      } catch (e) {
        if (!cancelled) setCategories(FALLBACK_CATEGORIES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const addCategory = async (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    try {
      const newList = Array.from(new Set([...categories, trimmed])).sort((a, b) => a.localeCompare(b));
      await supabase.from('settings').upsert({ id: 'categories', list: newList });
      setCategories(newList);
    } catch {
    }
  };

  return { categories, loading, addCategory };
}
