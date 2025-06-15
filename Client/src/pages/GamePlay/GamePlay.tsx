// Client/src/pages/GamePlay/GamePlay.tsx

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/card';
import { LuExpand, LuX } from 'react-icons/lu';
import KeepPlayingModal from '../../components/modals/KeepPlayingModal';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGameById,
  useAuthorizeGameSession,
} from '../../backend/games.service';
import {
  useCreateAnalytics,
  useUpdateAnalytics,
} from '../../backend/analytics.service';
import type { SimilarGame, GameData } from '../../backend/types';
import GameLoadingScreen from '../../components/single/GameLoadingScreen';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';

// A type for the game data which can be null initially
type GameType = GameData | null | undefined;

export default function GamePlay() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    data: game,
    isLoading: isGameDetailsLoading,
    error: gameDetailsError,
  } = useGameById(gameId || '');
  const { mutate: authorizeSession, isPending: isAuthorizing } =
    useAuthorizeGameSession();

  const [isSessionAuthorized, setIsSessionAuthorized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isGameIframeLoading, setIsGameIframeLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const analyticsIdRef = useRef<string | null>(null);
  const { mutate: createAnalytics } = useCreateAnalytics();
  const { mutate: updateAnalytics } = useUpdateAnalytics();

  // Effect to authorize the session once game details are loaded
  useEffect(() => {
    if (game && !isSessionAuthorized && isAuthenticated) {
      authorizeSession(game.id, {
        onSuccess: () => {
          setIsSessionAuthorized(true);
          toast.success('Game session authorized!');
        },
        onError: () => {
          toast.error('Failed to authorize game session. Please try again.');
          navigate('/'); // Redirect if authorization fails
        },
      });
    } else if (!isAuthenticated) {
      // For guests, we can consider them "authorized" to see the timed preview
      setIsSessionAuthorized(true);
    }
  }, [game, isSessionAuthorized, isAuthenticated, authorizeSession, navigate]);

  // Effect to start analytics session
  useEffect(() => {
    if (
      isSessionAuthorized &&
      isAuthenticated &&
      game &&
      !analyticsIdRef.current
    ) {
      createAnalytics(
        {
          gameId: game.id,
          activityType: 'game_session',
          startTime: new Date(),
        },
        {
          onSuccess: (response) => {
            analyticsIdRef.current = response.data.id;
          },
        }
      );
    }
  }, [isSessionAuthorized, isAuthenticated, game, createAnalytics]);

  // Timer for non-authenticated users
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      isSessionAuthorized &&
      !isAuthenticated &&
      game?.config &&
      game.config > 0 &&
      !isGameIframeLoading
    ) {
      setTimeRemaining(game.config * 60);
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            setIsModalOpen(true);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionAuthorized, isAuthenticated, game, isGameIframeLoading]);

  // Cleanup effect for analytics
  useEffect(() => {
    const updateEndTime = () => {
      if (analyticsIdRef.current) {
        updateAnalytics({ id: analyticsIdRef.current, endTime: new Date() });
        analyticsIdRef.current = null;
      }
    };

    window.addEventListener('beforeunload', updateEndTime);

    return () => {
      updateEndTime(); // Also runs on component unmount
      window.removeEventListener('beforeunload', updateEndTime);
    };
  }, [updateAnalytics]);

  // Main Loading and Error states
  if (isGameDetailsLoading || (isAuthenticated && isAuthorizing)) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E328AF]"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          {isAuthorizing
            ? 'Authorizing your session...'
            : 'Loading game details...'}
        </p>
      </div>
    );
  }

  if (gameDetailsError) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          We couldn't load the game details. Please try again later.
        </p>
        <Button
          onClick={() => navigate('/')}
          className="bg-[#D946EF] text-white"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  const currentGame = game as GameType;

  return (
    <div>
      {currentGame?.gameFile?.s3Key && isSessionAuthorized ? (
        <>
          <div
            className={expanded ? 'fixed inset-0 z-40 bg-black' : 'relative'}
          >
            <div
              className={`relative ${
                expanded ? 'h-screen w-full' : 'w-full'
              } overflow-hidden`}
            >
              {isGameIframeLoading && (
                <GameLoadingScreen
                  game={{
                    ...currentGame,
                    thumbnailFile: currentGame?.thumbnailFile
                      ? { s3key: currentGame.thumbnailFile.s3Key }
                      : undefined,
                  }}
                  onProgress={setLoadProgress}
                  progress={loadProgress}
                />
              )}
              <iframe
                id="gameIframe"
                src={currentGame.gameFile.s3Key}
                className="w-full"
                style={{
                  display: 'block',
                  height: expanded ? 'calc(100% - 60px)' : '100vh',
                  border: 'none',
                  visibility: isGameIframeLoading ? 'hidden' : 'visible',
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title={currentGame.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                scrolling="no"
                onLoad={() => setIsGameIframeLoading(false)}
              />
              <KeepPlayingModal
                open={isModalOpen}
                openSignUpModal={() => {
                  setIsModalOpen(false);
                  navigate('/');
                }}
                isGameLoading={isGameIframeLoading}
              />
              {expanded && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 z-50">
                  <span className="text-white text-sm font-semibold">
                    {currentGame.title}
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      className="text-white hover:text-purple-400"
                      onClick={() => setExpanded((e) => !e)}
                      title="Exit Fullscreen"
                    >
                      <LuExpand className="w-5 h-5" />
                    </button>
                    <button
                      className="text-white hover:text-purple-400"
                      onClick={() => navigate(-1)}
                      title="Close Game"
                    >
                      <LuX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!expanded && (
              <div className="flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 rounded-b-2xl">
                <span className="text-white text-sm font-semibold">
                  {currentGame.title}
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    className="text-white hover:text-purple-400"
                    onClick={() => setExpanded((e) => !e)}
                    title="Expand"
                  >
                    <LuExpand className="w-5 h-5" />
                  </button>
                  <button
                    className="text-white hover:text-purple-400"
                    onClick={() => navigate(-1)}
                    title="Close Game"
                  >
                    <LuX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Similar Games Section */}
          {!expanded &&
            currentGame.similarGames &&
            currentGame.similarGames.length > 0 && (
              <div className="dark:bg-[#18181b] p-2">
                <h2 className="text-2xl font-semibold dark:text-white text-[#18181b] mb-4 px-4">
                  Similar Games
                </h2>
                <Card className="border-hidden shadow-none p-0 bg-transparent">
                  <div className="grid gap-[8px] w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
                    {currentGame.similarGames.map(
                      (similarGame: SimilarGame) => (
                        <div
                          key={similarGame.id}
                          className="relative p-[10px] group cursor-pointer w-full max-w-[360px]"
                          onClick={() =>
                            navigate(`/gameplay/${similarGame.id}`)
                          }
                        >
                          <img
                            src={similarGame.thumbnailFile?.s3Key}
                            alt={similarGame.title}
                            loading="lazy"
                            className="w-full h-[290px] object-cover rounded-[18px] border-4 border-transparent group-hover:border-[#D946EF]"
                          />
                        </div>
                      )
                    )}
                  </div>
                </Card>
              </div>
            )}
        </>
      ) : (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl">
            Game not found or no game file available.
          </span>
        </div>
      )}
    </div>
  );
}
