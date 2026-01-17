import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CanonicalTag from '../components/single/CanonicalTag';

// Analytics tracking component for Cloudflare Zaraz and Facebook Pixel
const AnalyticsTracker = () => {
  const location = useLocation();

  // Track page visit once per session to count total visitors
  useEffect(() => {
    const trackPageVisit = async () => {
      // Check if we've already tracked this session
      const hasTracked = sessionStorage.getItem('page_visit_tracked');
      if (hasTracked) return;

      try {
        const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

        // Get or create visitor session ID
        let sessionId = sessionStorage.getItem('visitor_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('visitor_session_id', sessionId);
        }

        const url = `${baseURL}/api/analytics/homepage-visit`;
        const isDevelopment = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

        if (isDevelopment) {
          // Use regular fetch for development (sendBeacon has CORS issues on localhost)
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          }).catch(() => {}); // Silently fail
        } else {
          // Use sendBeacon for production (works during page unload)
          const data = new Blob([JSON.stringify({ sessionId })], {
            type: 'application/json',
          });
          navigator.sendBeacon(url, data);
        }

        // Mark as tracked for this session
        sessionStorage.setItem('page_visit_tracked', 'true');
      } catch (error) {
        console.warn('Failed to track page visit:', error);
      }
    };

    trackPageVisit();
  }, []); // Run once on mount

  useEffect(() => {
    // Only track if analytics is enabled for this domain
    if (!(window as any).shouldLoadAnalytics) {
      return;
    }

    // Note: GA4 automatically tracks page_view events via Zaraz
    // No need to manually track pageviews - removed to prevent duplication

    // Track pageview on route change for Facebook Pixel
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'PageView');
    }

    const officialDomain = import.meta.env.VITE_OFFICIAL_DOMAIN;

    if (officialDomain) {
      // Construct the authoritative URL
      // We remove trailing slashes to be consistent
      const path = location.pathname === '/' ? '' : location.pathname;
      const canonicalUrl = `https://${officialDomain}${path}`;

      // Find existing tag or create new one
      let link = document.querySelector("link[rel='canonical']");

      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }

      // Update the href
      link.setAttribute('href', canonicalUrl);
    }
  }, [location]);

  return null;
};

/**
 * RootLayout - A wrapper layout that provides analytics tracking and canonical tags
 * for all routes. This is used as the root element in createBrowserRouter.
 */
const RootLayout = () => {
  return (
    <>
      <AnalyticsTracker />
      <CanonicalTag />
      <Outlet />
    </>
  );
};

export default RootLayout;
