import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async fetcher whenever its identity changes (callers should wrap it in useCallback).
 * Returns data, loading/error state and a silent refresh function.
 */
export const useFetch = (fetcher, { initialData = null, enabled = true } = {}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) setLoading(true);
      setError('');
      try {
        setData(await fetcherRef.current());
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    load();
  }, [fetcher, load]);

  return { data, loading, error, refresh: load, setData };
};

export default useFetch;
