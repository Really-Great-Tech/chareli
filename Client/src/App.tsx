import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routing/routes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";

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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="font-boogaloo">
            <Toaster
              position="bottom-right"
              richColors
              toastOptions={{
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
