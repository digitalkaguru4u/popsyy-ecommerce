import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import './index.css';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </ToastProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>
);
