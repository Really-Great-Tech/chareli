import './App.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './routing/routes'
import { AuthProvider } from './context/AuthContext'
import { ConfigProvider } from './context/ConfigContext'
import { Toaster } from 'sonner'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ConfigProvider>
            <div className='font-boogaloo'>
            <Toaster position="bottom-right" richColors />
            <AppRoutes />
            </div>
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App;
