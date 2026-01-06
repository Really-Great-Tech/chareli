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

  useEffect(() => {
    // Only track if analytics is enabled for this domain
    if (!(window as any).shouldLoadAnalytics) {
      return;
    }

    // Track pageview on route change via Cloudflare Zaraz
    if (typeof (window as any).zaraz !== 'undefined') {
      (window as any).zaraz.track('pageview', {
        page_path: location.pathname + location.search,
      });
    }

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
