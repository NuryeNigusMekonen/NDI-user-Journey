import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Fetch a protected_content row by key. Returns { payload, loading, error }.
// RLS allows this only for an authenticated session — so this is what keeps the
// test/dataset content out of an anonymous browser: the request simply returns
// nothing (or errors) unless the user is signed in.
export function useProtectedContent(key) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    supabase
      .from('protected_content')
      .select('payload')
      .eq('key', key)
      .single()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError('Could not load protected content.');
        else setPayload(data?.payload ?? null);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [key]);

  return { payload, loading, error };
}
