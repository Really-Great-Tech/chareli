import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { LuExpand, LuX } from 'react-icons/lu';
import KeepPlayingModal from '../../components/modals/KeepPlayingModal';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGameById } from '../../backend/games.service';
import {
  useCreateAnalytics,
  useUpdateAnalytics,
} from '../../backend/analytics.service';
import type { SimilarGame } from '../../backend/types';
import GameLoadingScreen from '../../components/single/GameLoadingScreen';
import { useSecureGameLoader } from '../../hooks/useSecureGameLoader';

export default function GamePlay() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const {
    data: game,
    isLoading: isGameMetadataLoading,
    error: gameMetadataError,
  } = useGameById(gameId || '');
  const {
    iframeSrc,
    isLoading: isGameContentLoading,
    error: gameContentError,
  } = useSecureGameLoader(game);
  const { mutate: createAnalytics } = useCreateAnalytics();
  const analyticsIdRef = useRef<string | null>(null);

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const [expanded, setExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  console.log(isSignUpModalOpen, timeRemaining);

  // Timer for non-authenticated users - starts after game is loaded
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (game && !isAuthenticated && game.config > 0 && !isGameContentLoading) {
      setIsModalOpen(false);
      setTimeRemaining(game.config * 60);

      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            setIsModalOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
        setIsModalOpen(false);
      }
    };
  }, [game, isAuthenticated, isGameContentLoading]);

  // Create analytics record when game starts
  useEffect(() => {
    if (game && isAuthenticated) {
      createAnalytics(
        {
          gameId: game.id,
          activityType: 'game_session',
          startTime: new Date(),
        },
        {
          onSuccess: (response) => {
            analyticsIdRef.current = response.id;
          },
        }
      );
    }
  }, [game, isAuthenticated, createAnalytics]);

  const location = useLocation();
  const { mutate: updateAnalytics } = useUpdateAnalytics();

  // Function to update end time
  const updateEndTime = async () => {
    if (!analyticsIdRef.current) return;

    try {
      const endTime = new Date();
      updateAnalytics({
        id: analyticsIdRef.current,
        endTime,
      });
      // Clear ID after successful update to prevent duplicate updates
      analyticsIdRef.current = null;
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  };

  // Handle route changes
  useEffect(() => {
    if (analyticsIdRef.current) {
      updateEndTime();
    }
  }, [location]);

  // Handle tab visibility and cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && analyticsIdRef.current) {
        updateEndTime();
      }
    };

    const handleBeforeUnload = () => {
      if (analyticsIdRef.current) {
        const endTime = new Date();
        const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
        const url = `${baseURL}/api/analytics/${analyticsIdRef.current}/end`;
        const data = new Blob([JSON.stringify({ endTime })], {
          type: 'application/json',
        });
        navigator.sendBeacon(url, data);
        analyticsIdRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (analyticsIdRef.current) {
        updateEndTime();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      const iframe = document.querySelector<HTMLIFrameElement>('#gameIframe');
      if (iframe) {
        iframe.src = 'about:blank';
      }
    };
  }, []);

  if (isGameMetadataLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <span className="text-xl">Loading game details...</span>
      </div>
    );
  }

  if (gameMetadataError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <span className="text-xl text-red-500">
          Error loading game details.
        </span>
      </div>
    );
  }

  // Now handle the content loading part
  if (isGameContentLoading) {
    return (
      <GameLoadingScreen
        game={game as any}
        progress={50}
        onProgress={() => {}}
      />
    );
  }

  if (gameContentError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Error Loading Game
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{gameContentError}</p>
        <Button
          onClick={() => navigate('/')}
          className="mt-6 bg-[#D946EF] hover:bg-[#c026d3]"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={expanded ? 'fixed inset-0 z-40 bg-black' : 'relative'}>
        <div
          className={`relative ${
            expanded ? 'h-screen w-full' : 'w-full'
          } overflow-hidden`}
        >
          {iframeSrc ? (
            <iframe
              id="gameIframe"
              src={iframeSrc} // Use the secure blob URL from our hook
              className="w-full"
              style={{
                display: 'block',
                height: expanded ? 'calc(100% - 60px)' : '100vh',
                border: 'none',
              }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title={game?.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="flex items-center justify-center h-[80vh]">
              <span className="text-xl">Game file not available.</span>
            </div>
          )}
          {/* Non-Authenticated User Modal */}
          <KeepPlayingModal
            open={isModalOpen}
            openSignUpModal={handleOpenSignUpModal}
            isGameLoading={isGameContentLoading}
          />
          {/* Expanded Mode UI Bar */}

          {expanded && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 z-50">
              <span className="text-white text-sm font-semibold">
                {game?.title}
              </span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Ctext y='32' font-size='32'%3E%F0%9F%98%8D%3C/text%3E%3C/svg%3E"
                    alt="smiling face with heart-eyes"
                    className="text-xl w-6 h-6"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Ctext y='32' font-size='32'%3E%F0%9F%A5%B2%3C/text%3E%3C/svg%3E"
                    alt="smiling face with tear"
                    className="text-xl w-6 h-6"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    className="text-white hover:text-purple-400 transition-colors"
                    onClick={() => setExpanded((e) => !e)}
                    title={expanded ? 'Exit Fullscreen' : 'Expand'}
                  >
                    <LuExpand className="w-5 h-5" />
                  </button>
                  <button
                    className="text-white hover:text-purple-400 transition-colors"
                    onClick={() => {
                      if (analyticsIdRef.current) {
                        updateEndTime();
                      }
                      navigate(-1);
                    }}
                    title="Close Game"
                  >
                    <LuX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Non-Expanded Mode UI Bar */}
        {!expanded && (
          <div className="flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 rounded-b-2xl">
            <span className="text-white text-sm font-semibold">
              {game?.title}
            </span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Ctext y='32' font-size='32'%3E%F0%9F%98%8D%3C/text%3E%3C/svg%3E"
                  alt="smiling face with heart-eyes"
                  className="text-xl w-6 h-6"
                />
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Ctext y='32' font-size='32'%3E%F0%9F%A5%B2%3C/text%3E%3C/svg%3E"
                  alt="smiling face with tear"
                  className="text-xl w-6 h-6"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  className="text-white hover:text-purple-400 transition-colors"
                  onClick={() => setExpanded((e) => !e)}
                  title={expanded ? 'Exit Fullscreen' : 'Expand'}
                >
                  <LuExpand className="w-5 h-5" />
                </button>
                <button
                  className="text-white hover:text-purple-400 transition-colors"
                  onClick={() => {
                    if (analyticsIdRef.current) {
                      updateEndTime();
                    }
                    navigate(-1);
                  }}
                  title="Close Game"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Similar Games section */}
      {!expanded && game?.similarGames && game.similarGames.length > 0 && (
        <div className="dark:bg-[#18181b] p-2">
          <h2 className="text-2xl font-semibold dark:text-white text-[#18181b] mb-4 px-4">
            Similar Games
          </h2>
          <Card className="border-hidden shadow-none p-0 bg-transparent">
            <div className="grid gap-[8px] w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
              {game.similarGames.map((similarGame: SimilarGame) => (
                <div
                  key={similarGame.id}
                  className="relative p-[10px] group cursor-pointer w-full max-w-[360px]"
                >
                  <div className="relative">
                    <button
                      type="button"
                      tabIndex={0}
                      className="w-full h-[290px] min-h-[290px] max-h-[290px] object-cover rounded-[18px] border-4 border-transparent group-hover:border-[#D946EF] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] focus:outline-none"
                      style={{
                        background: `url(${similarGame.thumbnailFile?.storageKey}) center center / cover no-repeat`,
                      }}
                      onClick={() => {
                        if (analyticsIdRef.current) {
                          updateEndTime();
                        }
                        navigate(`/gameplay/${similarGame.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (analyticsIdRef.current) {
                            updateEndTime();
                          }
                          navigate(`/gameplay/${similarGame.id}`);
                        }
                      }}
                      aria-label={`Play ${similarGame.title}`}
                    >
                      <span className="sr-only">{`Play ${similarGame.title}`}</span>
                    </button>
                    {/* Game Info Overlay - Only visible on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-[14px] p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                      <h3 className="text-white font-bold text-lg mb-1 truncate">
                        {similarGame.title}
                      </h3>
                      {similarGame.description && (
                        <p className="text-gray-200 text-sm leading-tight">
                          {similarGame.description.length > 80
                            ? `${similarGame.description.substring(0, 80)}...`
                            : similarGame.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
