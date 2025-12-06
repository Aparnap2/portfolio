import { useState, useEffect, useCallback, useRef } from 'react';

export const useAsync = (asyncFn, deps = [], cacheKey = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});
  const isInitialRender = useRef(true);

  const execute = useCallback(async () => {
    // Check cache first
    if (cacheKey && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      // Only show loading on initial render or if not cached
      if (isInitialRender.current || !cacheKey) {
        setLoading(true);
      }
      setError(null);

      const result = await asyncFn();

      // Cache the result if cacheKey provided
      if (cacheKey) {
        cacheRef.current[cacheKey] = result;
      }

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isInitialRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFn, cacheKey, ...deps]);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps]);

  return { data, loading, error, refetch: execute };
};