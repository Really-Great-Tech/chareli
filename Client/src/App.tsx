import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routing/routes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import CanonicalTag from "./components/single/CanonicalTag";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Analytics tracking component for Google Analytics and Facebook Pixel
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track pageview on route change for Google Analytics
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-M661H945TQ', {
        page_path: location.pathname + location.search,
      });
    }
    
    // Track pageview on route change for Facebook Pixel
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'PageView');
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
                    background: "white",
                    color: "#6A7282",
                    fontSize: "17px",
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
