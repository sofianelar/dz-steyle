import { useEffect, useState } from 'react';
import { supabase } from './supabase';
export function useSettings() {
  const [s, setS] = useState({});
  useEffect(() => {
    supabase.from('store_settings').select('*').then(({ data }) => {
      const m = {}; (data || []).forEach(r => { m[r.key] = r.value; }); setS(m);
    });
  }, []);
  return s;
}
