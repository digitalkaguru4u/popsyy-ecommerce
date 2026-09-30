import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  const loadWishlist = useCallback(async () => {
    try { const r = await api.get('/account/wishlist'); setWishlist(r.ids.map(String)); } catch { setWishlist([]); }
  }, []);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);
  useEffect(() => { if (user) loadWishlist(); else setWishlist([]); }, [user, loadWishlist]);

  const login = async (email, password) => { const r = await api.post('/auth/login', { email, password }); setUser(r.user); window.dispatchEvent(new Event('popsyy:auth')); return r.user; };
  const adminLogin = async (email, password) => { const r = await api.post('/auth/admin/login', { email, password }); setUser(r.user); return r.user; };
  const register = async (payload) => { const r = await api.post('/auth/register', payload); setUser(r.user); window.dispatchEvent(new Event('popsyy:auth')); return r.user; };
  const logout = async () => { await api.post('/auth/logout').catch(() => {}); setUser(null); window.dispatchEvent(new Event('popsyy:auth')); };

  const toggleWishlist = async (productId) => {
    const r = await api.post(`/account/wishlist/${productId}`);
    setWishlist(r.ids.map(String));
    return r.added;
  };

  const value = useMemo(() => ({ user, setUser, ready, login, adminLogin, register, logout, wishlist, toggleWishlist, isAdmin: user?.role === 'admin' }), [user, ready, wishlist]); // eslint-disable-line react-hooks/exhaustive-deps
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
