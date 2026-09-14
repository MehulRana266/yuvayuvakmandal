import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { SiteDataProvider } from './context/SiteDataContext';
import PublicWebsite from './components/PublicWebsite';
import AdminWebsite from './components/AdminWebsite';
import DonationReceiptPage from './components/DonationReceiptPage';

export default function App() {
  const [currentModule, setCurrentModule] = useState(() => {
    if (
      window.location.pathname === '/admin' || 
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin' ||
      window.location.search.includes('admin')
    ) {
      return 'admin';
    }
    if (
      window.location.pathname.startsWith('/receipt') ||
      window.location.search.includes('receipt') ||
      (window.location.search.includes('no=') && window.location.search.includes('d='))
    ) {
      return 'receipt';
    }
    return 'public';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      if (
        window.location.pathname === '/admin' || 
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin')
      ) {
        setCurrentModule('admin');
      } else if (
        window.location.pathname.startsWith('/receipt') ||
        window.location.search.includes('receipt') ||
        (window.location.search.includes('no=') && window.location.search.includes('d='))
      ) {
        setCurrentModule('receipt');
      } else {
        setCurrentModule('public');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        switchToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const switchToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentModule('admin');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const switchToPublic = () => {
    window.history.pushState({}, '', '/');
    setCurrentModule('public');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  return (
    <LanguageProvider>
      <SiteDataProvider>
        {currentModule === 'admin' ? (
          <AdminWebsite onGoToPublicSite={switchToPublic} />
        ) : currentModule === 'receipt' ? (
          <DonationReceiptPage onGoToHome={switchToPublic} />
        ) : (
          <PublicWebsite onOpenAdmin={switchToAdmin} />
        )}
      </SiteDataProvider>
    </LanguageProvider>
  );
}

