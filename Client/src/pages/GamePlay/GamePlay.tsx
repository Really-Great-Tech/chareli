import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { LuExpand, LuX, LuChevronLeft } from "react-icons/lu";
import KeepPlayingModal from "../../components/modals/KeepPlayingModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useGameById } from "../../backend/games.service";
import {
  useCreateAnalytics,
  useUpdateAnalytics,
} from "../../backend/analytics.service";
import GameLoadingScreen from "../../components/single/GameLoadingScreen";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const { data: game, isLoading, error } = useGameById(gameId || "");
  const { mutate: createAnalytics } = useCreateAnalytics();
  const analyticsIdRef = useRef<string | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  // Auto-expand to fullscreen on mobile devices
  useEffect(() => {
    if (isMobile) {
      setExpanded(true);
    }
  }, [isMobile]);

  // Prevent body scroll on mobile fullscreen to fix viewport issues
  useEffect(() => {
    if (isMobile && expanded) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isMobile, expanded]);

  console.log(isSignUpModalOpen, timeRemaining);

  // Reset loading states when gameId changes (for similar games navigation)
  useEffect(() => {
    setIsGameLoading(true);
    setLoadProgress(0);
    setTimeRemaining(null);

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [gameId]);

  // Scroll management: Keep users at the top (main game area) when they arrive
  useEffect(() => {
    // Scroll to top when component mounts or gameId changes
    window.scrollTo({ top: 0, behavior: "instant" });

    // Also ensure the game container is visible
    if (gameContainerRef.current) {
      gameContainerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, [gameId]);

  // Prevent auto-scroll when page loads
  useEffect(() => {
    // Override any potential scroll restoration
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Force scroll to top on initial load
    window.scrollTo(0, 0);

    return () => {
      // Restore scroll restoration when component unmounts
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, []);

  useEffect(() => {
    if (game?.gameFile?.s3Key) {
      const timer = setTimeout(() => {
        setIsGameLoading(false);
        setLoadProgress(100);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [game]);

  // Timer for non-authenticated users - starts after game is loaded
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (game && !isAuthenticated && game.config > 0 && !isGameLoading) {
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
  }, [game, isAuthenticated, isGameLoading]);

  // Create analytics record when game starts
  useEffect(() => {
    if (game && isAuthenticated) {
      createAnalytics(
        {
          gameId: game.id,
          activityType: "game_session",
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
      await updateAnalytics({
        id: analyticsIdRef.current,
        endTime,
      });
      // Clear ID after successful update to prevent duplicate updates
      analyticsIdRef.current = null;
    } catch (error) {
      console.error("Failed to update analytics:", error);
      // Clear ID even on error to prevent duplicate attempts
      analyticsIdRef.current = null;
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
        const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
        const url = `${baseURL}/api/analytics/${analyticsIdRef.current}/end`;
        const data = new Blob([JSON.stringify({ endTime })], {
          type: "application/json",
        });
        navigator.sendBeacon(url, data);
        analyticsIdRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (analyticsIdRef.current) {
        updateEndTime();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      const iframe = document.querySelector<HTMLIFrameElement>("#gameIframe");
      if (iframe) {
        iframe.src = "about:blank";
      }
    };
  }, []);

  // Handle game loading progress
  const handleLoadProgress = (progress: number) => {
    setLoadProgress(progress);
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl">Loading game...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl text-red-500">
            {error instanceof Error ? error.message : "Error loading game"}
          </span>
        </div>
      ) : game?.gameFile?.s3Key ? (
        <>
          <div
            ref={gameContainerRef}
            className={expanded ? "fixed inset-0 z-40 bg-black" : "relative"}
            style={!expanded ? { height: "calc(100vh - 64px)" } : undefined}
          >
            <div
              className={`relative ${
                expanded
                  ? "h-full w-full flex flex-col"
                  : "w-full h-full flex flex-col"
              } overflow-hidden`}
              // style={{ background: "#18181b" }}
            >
              {/* Back button - always shown, visible above modal */}
              <button
                onClick={() => {
                  if (analyticsIdRef.current) {
                    updateEndTime();
                  }
                  navigate(-1);
                }}
                className={`absolute top-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg hover:bg-white transition-all ${
                  isModalOpen ? "z-[80]" : "z-50"
                }`}
                style={{ minHeight: "44px", minWidth: "60px" }}
                title="Go Back"
              >
                <div className="bg-orange-600 rounded-full p-1.5">
                  <LuChevronLeft
                    className="w-5 h-5 text-white"
                    strokeWidth={3}
                  />
                </div>
              </button>
              {isGameLoading && (
                <GameLoadingScreen
                  game={game}
                  onProgress={handleLoadProgress}
                  progress={loadProgress}
                />
              )}
              {!isModalOpen ? (
                <iframe
                  src={`${game.gameFile.s3Key}`}
                  className="w-full flex-1"
                  style={{
                    display: "block",
                    // background: "transparent",
                    border: "none",
                    overflow: "hidden",
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title={game.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => {
                    setLoadProgress(100);
                  }}
                />
              ) : (
                <div className="w-full bg-gray-900 flex-1" />
              )}

              {/* Beautiful game platform overlay when time is up */}
              {isModalOpen && (
                <div
                  className="absolute inset-0 z-50 bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseUp={(e) => e.preventDefault()}
                  onMouseMove={(e) => e.preventDefault()}
                  onClick={(e) => e.preventDefault()}
                  onKeyDown={(e) => e.preventDefault()}
                  onKeyUp={(e) => e.preventDefault()}
                  onTouchStart={(e) => e.preventDefault()}
                  onTouchMove={(e) => e.preventDefault()}
                  onTouchEnd={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  tabIndex={-1}
                />
              )}
              <KeepPlayingModal
                open={isModalOpen}
                openSignUpModal={handleOpenSignUpModal}
                isGameLoading={isGameLoading}
              />
              {/* Control bar - always shown, styling changes based on expanded state */}
              <div
                className={`flex items-center justify-between px-6 py-2 bg-[#7C2D12] border-t border-orange-400 z-50 ${
                  !expanded ? "rounded-b-2xl" : ""
                }`}
                style={
                  expanded
                    ? {
                        paddingBottom:
                          "max(0.5rem, env(safe-area-inset-bottom))",
                        paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
                        paddingRight: "max(1.5rem, env(safe-area-inset-right))",
                      }
                    : undefined
                }
              >
                <span className="text-white text-sm font-semibold">
                  {game.title}
                </span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label="smile" className="text-xl">
                      😍
                    </span>
                    <span role="img" aria-label="smile" className="text-xl">
                      🥲
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Timer display for unauthenticated users */}
                    {!isAuthenticated &&
                      timeRemaining !== null &&
                      timeRemaining > 0 && (
                        <div className="flex items-center space-x-2 bg-orange-600/20 px-3 py-1 rounded-full border border-orange-400/30">
                          <span className="text-xs text-orange-300">⏱️</span>
                          <span className="text-white text-sm font-medium">
                            {Math.floor(timeRemaining / 60)}:
                            {(timeRemaining % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                      )}
                    {/* Hide expand button on mobile since it's auto-fullscreen */}
                    {!isMobile && (
                      <button
                        className="text-white hover:text-orange-400 transition-colors"
                        onClick={() => setExpanded((e) => !e)}
                        title={expanded ? "Exit Fullscreen" : "Expand"}
                      >
                        <LuExpand className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      className="text-white hover:text-orange-400 transition-colors"
                      onClick={() => {
                        if (analyticsIdRef.current) {
                          updateEndTime();
                        }
                        if (expanded) {
                          navigate(-1);
                        } else {
                          navigate("/");
                        }
                      }}
                      title="Close Game"
                    >
                      <LuX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl">
            Game not found or no game file available
          </span>
        </div>
      )}
    </div>
  );
}
