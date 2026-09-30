import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const SettingsCtx = createContext({ settings: null, payments: null });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.allSettled([api.get('/content/settings'), api.get('/payments/config')]).then(([s, p]) => {
      if (s.status === 'fulfilled') setSettings(s.value.settings);
      if (p.status === 'fulfilled') setPayments(p.value);
      setReady(true);
    });
  }, []);
  return <SettingsCtx.Provider value={{ settings, payments, ready, setSettings }}>{children}</SettingsCtx.Provider>;
}
export const useSettings = () => useContext(SettingsCtx);
