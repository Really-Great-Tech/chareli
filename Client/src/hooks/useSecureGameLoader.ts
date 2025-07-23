import { useState, useEffect } from 'react';
import { backendService } from '../backend/api.service';
import type { GameData } from '../backend/types';

/**
 * A custom hook to securely load game content into an iframe.
 * It handles the 'fetch-then-blob' pattern required for passing
 * authentication headers to a resource loaded in an iframe.
 *
 * @param game The game metadata object.
 * @returns An object with the iframe source, loading state, and any errors.
 */
export const useSecureGameLoader = (game: GameData | undefined | null) => {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs whenever the game object changes.
    if (!game?.gameFile?.storageKey) {
      // If there's no game or no file key, we can't proceed.
      setIsLoading(false);
      return;
    }

    // Construct the full URL to the asset via our Cloudflare Worker.
    const gameUrl = `${import.meta.env.VITE_GAMES_CDN_URL}/${
      game.gameFile.storageKey
    }`;

    // This will hold the generated blob URL for cleanup.
    let objectUrl: string | null = null;

    const loadGame = async () => {
      // Reset state for the new game load.
      setIsLoading(true);
      setError(null);

      try {
        // Use our authenticated axios instance. Its interceptor will add the
        // 'Authorization: Bearer <token>' header to this request.
        const response = await backendService.get(gameUrl, {
          responseType: 'blob', // We need the raw file data.
        });

        // The Worker has verified our token and returned the game's HTML.
        const blob = new Blob([response as any], { type: 'text/html' });
        objectUrl = URL.createObjectURL(blob);
        setIframeSrc(objectUrl);
      } catch (err: any) {
        console.error('Failed to fetch secure game content:', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError(
            'Your session may have expired. Please log in again to play.'
          );
        } else {
          setError('This game could not be loaded. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();

    // The cleanup function is critical to prevent memory leaks.
    // It revokes the blob URL when the component unmounts or the game changes.
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setIframeSrc(null);
      }
    };
    // We only want to re-run this entire process if the game file's key changes.
  }, [game?.gameFile?.storageKey]);

  return { iframeSrc, isLoading, error };
};
