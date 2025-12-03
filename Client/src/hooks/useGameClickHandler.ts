import { useNavigate } from 'react-router-dom';
import { useRecordGameClick } from '../backend/games.service';

interface UseGameClickHandlerOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  trackingEnabled?: boolean;
}

export const useGameClickHandler = (
  options: UseGameClickHandlerOptions = {}
) => {
  const navigate = useNavigate();
  const recordGameClick = useRecordGameClick();
  const { onSuccess, onError, trackingEnabled = true } = options;

  const handleGameClick = async (gameId: string, gameSlug?: string) => {
    navigate(`/gameplay/${gameSlug || gameId}`);

    if (trackingEnabled) {
      try {
        await recordGameClick.mutateAsync(gameId);
        onSuccess?.();
      } catch (error) {
        console.warn('Failed to track game click:', error);
        onError?.(error);
      }
    }
  };

  return {
    handleGameClick,
    isTracking: recordGameClick.isPending,
    trackingError: recordGameClick.error,
  };
};
