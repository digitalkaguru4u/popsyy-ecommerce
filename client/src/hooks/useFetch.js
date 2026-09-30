import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

// Tiny data hook with in-memory cache for GETs (keeps navigation snappy)
const cache = new Map();

export function useFetch(path, { enabled = true, cacheKey, ttl = 30000 } = {}) {
  const key = cacheKey || path;
  const cached = key && cache.get(key);
  const [data, setData] = useState(cached && Date.now() - cached.t < ttl ? cached.d : null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!data && enabled && Boolean(path));
  const ctrl = useRef();

  const load = useCallback(async () => {
    if (!path || !enabled) return;
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const d = await api.get(path, { signal: ctrl.current.signal });
      cache.set(key, { d, t: Date.now() });
      setData(d);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e);
    } finally {
      setLoading(false);
    }
  }, [path, enabled, key]);

  useEffect(() => {
    const c = key && cache.get(key);
    if (c && Date.now() - c.t < ttl) { setData(c.d); setLoading(false); return undefined; }
    load();
    return () => ctrl.current?.abort();
  }, [load, key, ttl]);

  return { data, error, loading, reload: () => { cache.delete(key); return load(); }, setData };
}

export const invalidate = (prefix) => { [...cache.keys()].forEach((k) => { if (k.startsWith(prefix)) cache.delete(k); }); };
