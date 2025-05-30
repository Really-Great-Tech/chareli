import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { backendService } from '../backend/api.service';
import type { User, LoginCredentials } from '../backend/types';
import { toast } from 'sonner';

interface LoginResponse {
  userId: string;
  hasEmail: boolean;
  hasPhone: boolean;
  email?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  keepPlayingRedirect: boolean;
  setKeepPlayingRedirect: (value: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  verifyOtp: (userId: string, otp: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keepPlayingRedirect, setKeepPlayingRedirect] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async (): Promise<User> => {
    try {
      setIsLoading(true);
      const userData = await backendService.get('/api/auth/me');
      setUser(userData.data as unknown as User);
      setIsLoading(false);
      return userData as unknown as User;
    } catch (error) {
      // Token might be invalid, clear tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await backendService.post('/api/auth/login', credentials);
    const { userId } = response.data;
    const userEmail = response.data.email || credentials.email; 
    const phoneNumber = response.data.phoneNumber;
    const hasEmail = !!userEmail;
    const hasPhone = !!phoneNumber;
    
    return { 
      userId, 
      hasEmail, 
      hasPhone,
      email: userEmail,
      phoneNumber
    };
  };

  const verifyOtp = async (userId: string, otp: string): Promise<User> => {
    const response = await backendService.post('/api/auth/verify-otp', { userId, otp });
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const isRoleIncluded = ['admin', 'superadmin'].includes(user?.role.name || '') || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: isRoleIncluded,
        isLoading,
        keepPlayingRedirect,
        setKeepPlayingRedirect,
        login,
        verifyOtp,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
