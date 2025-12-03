import { useState, useEffect, useRef, useCallback } from "react";
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
import { trackGameplay } from "../../utils/analytics";
import { useSystemConfigByKey } from "../../backend/configuration.service";

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const { data: game, isLoading, error } = useGameById(gameId || "");
  const { mutate: createAnalytics } = useCreateAnalytics();
  const analyticsIdRef = useRef<string | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameStartTimeRef = useRef<Date | null>(null);
  const gameLoadStartTimeRef = useRef<Date | null>(null);
  const updateEndTimeRef = useRef<((reason?: string) => Promise<void>) | null>(
    null
  );

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const { data: freeTimeConfig } = useSystemConfigByKey(
    "bulk_free_time_settings"
  );

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
    gameLoadStartTimeRef.current = new Date();

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

    // Check if free time is disabled for guests
    const isFreeTimeDisabled =
      freeTimeConfig?.value?.disableFreeTimeForGuests === true;

    // Only start timer if:
    // 1. Game exists
    // 2. User is not authenticated
    // 3. Game has free time configured (game.config > 0)
    // 4. Game is loaded
    // 5. Free time is NOT disabled for guests
    if (
      game &&
      !isAuthenticated &&
      game.config > 0 &&
      !isGameLoading &&
      !isFreeTimeDisabled
    ) {
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
  }, [game, isAuthenticated, isGameLoading, freeTimeConfig]);

  // Create analytics record when game starts
  useEffect(() => {
    if (game && isAuthenticated) {
      const startTime = new Date();
      gameStartTimeRef.current = startTime;

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

      // Track game start in Google Analytics
      trackGameplay.gameStart(game.id, game.title);
    }
  }, [game, isAuthenticated, createAnalytics]);

  const location = useLocation();
  const { mutate: updateAnalytics } = useUpdateAnalytics();

  // Function to update end time
  const updateEndTime = useCallback(
    async (reason?: string) => {
      if (!analyticsIdRef.current) return;

      try {
        const endTime = new Date();
        const startTime = gameStartTimeRef.current;

        // Calculate duration for Google Analytics
        let durationSeconds = 0;
        if (startTime) {
          durationSeconds = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000
          );
        }

        await updateAnalytics({
          id: analyticsIdRef.current,
          endTime,
        });

        // Track game end in Google Analytics
        if (game) {
          trackGameplay.gameEnd(game.id, game.title, durationSeconds);

          // If user exited early, track that too
          if (reason) {
            trackGameplay.gameExit(
              game.id,
              game.title,
              durationSeconds,
              reason
            );
          }
        }

        // Clear ID after successful update to prevent duplicate updates
        analyticsIdRef.current = null;
        gameStartTimeRef.current = null;
      } catch (error) {
        console.error("Failed to update analytics:", error);
        // Clear ID even on error to prevent duplicate attempts
        analyticsIdRef.current = null;
        gameStartTimeRef.current = null;
      }
    },
    [game, updateAnalytics]
  );

  // Store latest updateEndTime in ref to avoid dependency issues
  updateEndTimeRef.current = updateEndTime;

  // Handle route changes
  useEffect(() => {
    if (analyticsIdRef.current && updateEndTimeRef.current) {
      updateEndTimeRef.current("route_change");
    }
  }, [location]);

  // Handle tab visibility and cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        analyticsIdRef.current &&
        updateEndTimeRef.current
      ) {
        updateEndTimeRef.current("tab_hidden");
      }
    };

    const handleBeforeUnload = () => {
      if (analyticsIdRef.current && game) {
        const endTime = new Date();
        const startTime = gameStartTimeRef.current;
        let durationSeconds = 0;

        if (startTime) {
          durationSeconds = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000
          );
        }

        // Track in Google Analytics using gtag() directly
        // Note: gtag() is the recommended way for GA4, even on page unload
        const win = window as Window & {
          gtag?: (
            command: "config" | "event" | "js" | "set",
            targetId: string | Date,
            config?: Record<string, unknown>
          ) => void;
          shouldLoadAnalytics?: boolean;
        };

        if (typeof win.gtag !== "undefined" && win.shouldLoadAnalytics) {
          try {
            // Track game exit event
            trackGameplay.gameExit(
              game.id,
              game.title,
              durationSeconds,
              "page_unload"
            );
          } catch (error) {
            console.error("Failed to send analytics beacon:", error);
          }
        }

        const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
        const url = `${baseURL}/api/analytics/${analyticsIdRef.current}/end`;
        const data = new Blob([JSON.stringify({ endTime })], {
          type: "application/json",
        });
        navigator.sendBeacon(url, data);
        analyticsIdRef.current = null;
        gameStartTimeRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (analyticsIdRef.current && updateEndTimeRef.current) {
        updateEndTimeRef.current("component_unmount");
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      const iframe = document.querySelector<HTMLIFrameElement>("#gameIframe");
      if (iframe) {
        iframe.src = "about:blank";
      }
    };
  }, [game]);

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
                  if (analyticsIdRef.current && updateEndTimeRef.current) {
                    updateEndTimeRef.current("back_button");
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

                    // Track game loaded event
                    if (game && gameLoadStartTimeRef.current) {
                      const loadTime =
                        new Date().getTime() -
                        gameLoadStartTimeRef.current.getTime();
                      trackGameplay.gameLoaded(game.id, game.title, loadTime);
                    }
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
                <h2 className="text-white text-sm font-semibold m-0 font-worksans">
                  {game.title}
                </h2>
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
                        if (
                          analyticsIdRef.current &&
                          updateEndTimeRef.current
                        ) {
                          updateEndTimeRef.current("close_button");
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
