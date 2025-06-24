import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routing/routes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import { useEffect } from "react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    function updateTheme() {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');  
      } else {
        document.documentElement.classList.remove('dark');   
      }
    }

    updateTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="font-dmmono">
            <Toaster
              position="bottom-right"
              richColors
              toastOptions={{
                duration: 6000,
                style: {
                  background: "white",
                  color: "#C026D3",
                  // border: "1px solid #E328AF",
                },
              }}
            />
            <AppRoutes />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
