import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendHeartbeat } from '../backend/user.service';


export const useHeartbeat = () => {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendManualHeartbeat = async () => {
    if (isAuthenticated) {
      try {
        await sendHeartbeat();
        return true;
      } catch (error) {
        console.error('Failed to send manual heartbeat:', error);
        return false;
      }
    }
    return false;
  };

  const startHeartbeat = (intervalMs: number = 60000) => {
    if (!isAuthenticated) return;
    stopHeartbeat();
    sendManualHeartbeat();
    intervalRef.current = setInterval(() => {
      sendManualHeartbeat();
    }, intervalMs);
  };


  const stopHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  return {
    sendManualHeartbeat,
    startHeartbeat,
    stopHeartbeat,
    isActive: !!intervalRef.current
  };
};
