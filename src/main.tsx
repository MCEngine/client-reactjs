import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.js';
import { App } from './App.js';

const container = document.getElementById('root');
if (container === null) throw new Error('No #root element to mount into.');

createRoot(container).render(
  <StrictMode>
    <AuthProvider baseUrl={import.meta.env.VITE_API_BASE_URL ?? ''}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
