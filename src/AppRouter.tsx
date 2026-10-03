import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CookieConsent } from './components/CookieConsent';
import { StudioPage } from './pages/StudioPage';

/**
 * The React bundle only serves the studio. Every public page is server-rendered
 * HTML (see src/server/pages.ts) so crawlers see text without running JS.
 * `/account` mounts its own shell and is added in a later task.
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/" element={<StudioPage />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
};