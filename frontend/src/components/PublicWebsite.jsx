import React, { useState, useEffect } from 'react';
import Header from './Header';
import MobileDrawer from './MobileDrawer';
import HeroBanner from './HeroBanner';
import SchedulePreview from './SchedulePreview';
import AboutUsSection from './AboutUsSection';
import BigScreenVideo from './BigScreenVideo';
import MurtikarSection from './MurtikarSection';
import GallerySection from './GallerySection';
import ScheduleSection from './ScheduleSection';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import DevoteeReviews from './DevoteeReviews';
import Footer from './Footer';

export default function PublicWebsite({ onOpenAdmin }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Determine initial active view based on URL pathname or hash
  const getViewFromLocation = () => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    const hash = window.location.hash.toLowerCase();

    if (path.startsWith('/gallery') || hash.startsWith('#gallery')) return 'gallery';
    if (path === '/schedule' || hash === '#schedule') return 'schedule';
    if (path === '/about' || hash === '#about') return 'about';
    if (path === '/contact' || hash === '#contact') return 'contact';
    return 'home';
  };

  const [activeView, setActiveView] = useState(getViewFromLocation);

  // Sync document title and browser URL path
  const updateTitleAndUrl = (view, sectionId, pushState = true) => {
    let title = "Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
    let targetPath = "/";

    if (view === 'gallery') {
      const yearMatch = window.location.pathname.match(/\/gallery\/(\d{4})/i);
      if (yearMatch) {
        title = `${yearMatch[1]} Gallery | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026`;
        targetPath = `/gallery/${yearMatch[1]}`;
      } else {
        title = "Gallery | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
        targetPath = "/gallery";
      }
    } else if (view === 'schedule') {
      title = "Schedule & Events | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
      targetPath = "/schedule";
    } else if (view === 'about') {
      title = "About Us | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
      targetPath = "/about";
    } else if (view === 'contact') {
      title = "Contact Us | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
      targetPath = "/contact";
    } else if (view === 'home') {
      if (sectionId === 'reels') {
        title = "Reels & Highlights | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
        targetPath = "/reels";
      } else if (sectionId === 'aarti') {
        title = "Live Aarti & Broadcast | Yuva Yuvak Mandal 🚩 Ganpati Mahotsav 2026";
        targetPath = "/aarti";
      }
    }

    document.title = title;

    if (pushState && window.location.pathname !== targetPath) {
      window.history.pushState({}, title, targetPath);
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const newView = getViewFromLocation();
      setActiveView(newView);
      updateTitleAndUrl(newView, null, false);
    };

    const initialView = getViewFromLocation();
    updateTitleAndUrl(initialView, null, false);

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Precise Section Entrance Animation:
  // - Hero triggers on initial page load (with 0.25s delay).
  // - Sections below hero (Schedule, About Us, Murtikar, etc.) ONLY trigger when the user scrolls down to them.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isDisposed = false;

    const checkEntrance = () => {
      if (isDisposed) return;
      const elements = document.querySelectorAll('.mobile-entrance-fade-up:not(.mobile-in-view)');
      if (!elements || elements.length === 0) return;

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      elements.forEach((el) => {
        const isHero = el.closest('#hero') || el.classList.contains('hero-content-wrap');

        if (isHero) {
          // Hero content animates on page load
          el.classList.add('mobile-in-view');
          return;
        }

        const rect = el.getBoundingClientRect();

        if (activeView !== 'home') {
          // On subpages (Gallery, Schedule page, About page, Contact), animate on load if in view
          if (rect.top <= viewportHeight * 0.85) {
            el.classList.add('mobile-in-view');
          }
          return;
        }

        // On Home Page: sections below hero ONLY trigger when user has scrolled down (scrollY > 20)
        // and the section has scrolled comfortably into view
        const reachedTriggerPoint = rect.top <= viewportHeight * 0.85 && rect.bottom >= 40;
        if (scrollY > 20 && reachedTriggerPoint) {
          el.classList.add('mobile-in-view');
        }
      });
    };

    // 1. Initial check (animates Hero, keeps below-the-fold sections waiting for user scroll)
    const initialTimer = setTimeout(checkEntrance, 60);
    const secondaryTimer = setTimeout(checkEntrance, 250);

    // 2. Scroll and resize listeners (triggers each section dynamically as user scrolls down)
    window.addEventListener('scroll', checkEntrance, { passive: true });
    window.addEventListener('resize', checkEntrance, { passive: true });

    // 3. Fallback IntersectionObserver with strict negative bottom margin (-60px)
    let observer = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const scrollY = window.scrollY || window.pageYOffset || 0;
          const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              const isHero = el.closest('#hero') || el.classList.contains('hero-content-wrap');
              const rect = entry.boundingClientRect;

              if (isHero) {
                el.classList.add('mobile-in-view');
                observer.unobserve(el);
              } else if (activeView !== 'home') {
                if (rect.top <= viewportHeight * 0.85) {
                  el.classList.add('mobile-in-view');
                  observer.unobserve(el);
                }
              } else if (scrollY > 20 && rect.top <= viewportHeight * 0.85 && rect.bottom >= 40) {
                el.classList.add('mobile-in-view');
                observer.unobserve(el);
              }
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -60px 0px'
        }
      );

      document.querySelectorAll('.mobile-entrance-fade-up:not(.mobile-in-view)').forEach((el) => {
        observer.observe(el);
      });
    }

    return () => {
      isDisposed = true;
      clearTimeout(initialTimer);
      clearTimeout(secondaryTimer);
      window.removeEventListener('scroll', checkEntrance);
      window.removeEventListener('resize', checkEntrance);
      if (observer) observer.disconnect();
    };
  }, [activeView]);

  const handleNavigate = (view, sectionId) => {
    setActiveView(view);
    updateTitleAndUrl(view, sectionId, true);

    if (view === 'home') {
      if (sectionId && sectionId !== 'hero') {
        setTimeout(() => {
          const elem = document.getElementById(sectionId);
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
      <Header 
        onGoHome={() => handleNavigate('home', null)}
        onNavigate={handleNavigate}
        activeView={activeView}
      />

      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onNavigate={handleNavigate}
        activeView={activeView}
      />

      <main style={{ width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
        {activeView === 'gallery' && (
          <GallerySection onBackToHome={() => handleNavigate('home', null)} />
        )}
        {activeView === 'schedule' && (
          <ScheduleSection onBackToHome={() => handleNavigate('home', null)} />
        )}
        {activeView === 'about' && (
          <AboutPage onBackToHome={() => handleNavigate('home', null)} />
        )}
        {activeView === 'contact' && (
          <ContactPage onBackToHome={() => handleNavigate('home', null)} />
        )}

        <div style={{ display: activeView === 'home' ? 'block' : 'none' }}>
          <HeroBanner activeView={activeView} />
          <SchedulePreview onViewFullSchedule={() => handleNavigate('schedule', null)} />
          <AboutUsSection onViewFullAbout={() => handleNavigate('about', null)} />
          <BigScreenVideo isAdmin={false} />
          <MurtikarSection />
        </div>
      </main>

      <DevoteeReviews />
      <Footer onNavigate={handleNavigate} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
