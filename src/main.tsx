import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// NOTE: This app previously also wrapped everything in a Supabase-backed
// <AuthProvider> (src/contexts/AuthContext.tsx), on top of the custom
// Express/Prisma JWT auth (src/store.ts) AND Firebase (used only for the
// "Sign in with Google" button, then synced into the Prisma DB via
// /api/auth/firebase-sync). That Supabase AuthProvider was never actually
// consumed anywhere (`useContext(AuthContext)` had zero call sites) - it just
// ran a second, disconnected auth listener in the background. Real user
// accounts live in the Prisma database, not in Supabase Auth, so removing it
// here does not change any behavior; it removes a source of confusion about
// which system is the source of truth for "who is logged in". The custom
// JWT auth in src/store.ts remains the single source of truth. Firebase is
// kept only for Google sign-in and Supabase Storage (image uploads) - see
// src/lib/supabaseClient.ts / src/lib/supabaseStorage.ts.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

