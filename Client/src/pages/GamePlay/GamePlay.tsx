import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { LuExpand, LuX } from "react-icons/lu";
import KeepPlayingModal from "../../components/modals/KeepPlayingModal";
import { useParams, useNavigate } from "react-router-dom";
import { useGameById } from "../../backend/games.service";
import {
  useCreateAnalytics,
  useUpdateAnalytics,
} from "../../backend/analytics.service";
import type { SimilarGame } from "../../backend/types";
import GameLoadingScreen from "../../components/single/GameLoadingScreen";

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const { data: game, isLoading, error } = useGameById(gameId || "");
  const { mutate: createAnalytics } = useCreateAnalytics();
  const analyticsIdRef = useRef<string | null>(null);

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const [expanded, setExpanded] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  console.log(isSignUpModalOpen, timeRemaining);

  useEffect(() => {
    if (game?.gameFile?.s3Key) {
      const timer = setTimeout(() => {
        setIsGameLoading(false);
        setLoadProgress(100);
      }, 15000);

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
        setTimeRemaining(prev => {
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

  const { mutate: updateAnalytics } = useUpdateAnalytics();

  // Handle analytics for game end scenarios
  useEffect(() => {
    const updateEndTime = async () => {
      if (analyticsIdRef.current) {
        try {
          await updateAnalytics({
            id: analyticsIdRef.current,
            endTime: new Date(),
          });
        } catch (error) {
          console.error("Failed to update analytics:", error);
        }
      }
    };

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateEndTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      updateEndTime();
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const iframe = document.querySelector<HTMLIFrameElement>("#gameIframe");
      if (iframe) {
        iframe.src = "about:blank";
      }
    };
  }, [updateAnalytics]);

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
          <div className={expanded ? "fixed inset-0 z-40 bg-black" : "relative"}>
            <div
              className={`relative w-full ${
                expanded
                  ? "h-screen"
                  : "h-[calc(100vh-64px)]"
              } mx-auto rounded-2xl border-4 border-purple-400`}
              style={{ background: "#18181b" }}
            >
              {isGameLoading && (
                <GameLoadingScreen
                  game={game}
                  onProgress={handleLoadProgress}
                  progress={loadProgress}
                />
              )}
              <iframe
                src={`${game.gameFile.s3Key}`}
                className={`w-full h-full rounded-2xl`}
                style={{ display: "block", background: "transparent" }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title={game.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onLoad={() => {
                  setLoadProgress(100);
                }}
              />
              <KeepPlayingModal
                open={isModalOpen}
                openSignUpModal={handleOpenSignUpModal}
                isGameLoading={isGameLoading}
              />
              <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 ${expanded ? "z-50" : ""}`}>
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
                    <button
                      className="text-white hover:text-purple-400 transition-colors"
                      onClick={() => setExpanded((e) => !e)}
                      title={expanded ? "Exit Fullscreen" : "Expand"}
                    >
                      <LuExpand className="w-5 h-5" />
                    </button>
                    <button
                      className="text-white hover:text-purple-400 transition-colors"
                      onClick={() => navigate(-1)}
                      title="Close Game"
                    >
                      <LuX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Games section */}
          {!expanded && game.similarGames && game.similarGames.length > 0 && (
            <div className="bg-[#18181b] mt-4 rounded-2xl border-4 border-purple-400 p-4">
              <h2 className="text-2xl font-semibold text-white mb-4 px-4">
                Similar Games
              </h2>
              <Card className="border-hidden shadow-none p-4 bg-transparent max-w-[1000px] mx-auto">
                <div className="flex flex-wrap justify-center gap-6 w-full">
                  {game.similarGames.map((similarGame: SimilarGame) => (
                    <div
                      key={similarGame.id}
                      className="w-[180px] aspect-square"
                    >
                      <img
                        src={similarGame.thumbnailFile?.s3Key}
                        alt={similarGame.title}
                        className="w-full h-full object-cover border-2 border-purple-400/30 hover:border-[#D946EF] rounded-xl hover:rounded-2xl box-border transition-all duration-200 hover:scale-105 cursor-pointer"
                        onClick={() =>
                          navigate(`/gameplay/${similarGame.id}`)
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
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
