import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CookieConsent } from './components/CookieConsent';
import { StudioPage } from './pages/StudioPage';
import { AccountPage } from './pages/AccountPage';

/**
 * The React bundle only serves the studio and the account page. Every public
 * page is server-rendered HTML (see src/server/pages.ts) so crawlers see text
 * without running JS.
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/" element={<StudioPage />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
};