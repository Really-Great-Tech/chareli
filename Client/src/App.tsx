import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routing/routes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CanonicalTag from './components/single/CanonicalTag';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnalyticsTracker />
        <CanonicalTag />
        <ThemeProvider>
          <AuthProvider>
            <div className="font-dmmono">
              <Toaster
                position="bottom-right"
                richColors
                closeButton
                toastOptions={{
                  duration: 10000,
                  style: {
                    background: 'white',
                    color: '#6A7282',
                    fontSize: '17px',
                    // border: "1px solid #6A7282",
                  },
                }}
              />
              <AppRoutes />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
