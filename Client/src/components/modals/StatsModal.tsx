import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { FiClock, FiInfo } from "react-icons/fi";
import { LuGamepad2 } from "react-icons/lu";
import { BsController } from "react-icons/bs";
import statImg from "../../assets/stat-img.svg";
import { useCurrentUserStats } from "../../backend/analytics.service";
import { formatTime } from "../../utils/main";

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function StatsModal({ open, onClose }: StatsModalProps) {
  const { data: stats, isLoading, isError } = useCurrentUserStats();

  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <CustomDialogContent className="bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-4 sm:p-6 max-w-[95vw] sm:max-w-[90vw] w-full sm:w-[600px] border-none">
          <div className="text-center text-red-500 text-sm sm:text-base">
            Error loading statistics. Please try again later.
          </div>
        </CustomDialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <CustomDialogContent className="bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-4 sm:p-6 max-w-[95vw] sm:max-w-[90vw] w-full sm:w-[600px] border-none font-dmmono tracking-wider">
        {/* Close Button */}
        <button
          className="absolute -top-3 -right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={onClose}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-xl sm:text-2xl font-bold">×</span>
        </button>

        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-[#C026D3] font-dmmono">
          User Stats
        </h2>

        {/* Scrollable Content */}
        <div className="max-h-[80vh] sm:max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide w-full">
          {/* Stats Summary */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-6 sm:mb-8">
            {isLoading ? (
              <div className="w-full text-center py-4">
                <div className="inline-block h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-solid border-[#C026D3] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              </div>
            ) : !stats ? (
              <div className="w-full text-center py-6 sm:py-8">
                <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-[#E879F9] rounded-full p-3">
                      <BsController className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold dark:text-white text-[#0F1621]">
                      No Game Stats Yet
                    </h3>
                    <p className="text-center dark:text-[#bdbdbd] text-[#334154] text-sm sm:text-base max-w-md">
                      Start playing games to see your statistics here! Your
                      gaming journey begins with your first play.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-4 sm:p-6 w-full flex items-start">
                  <div className="bg-[#E879F9] rounded-full p-2 sm:p-3 flex items-center justify-center">
                    <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <div className="dark:text-white text-[#0F1621] font-bold text-base sm:text-lg">
                      Minutes Played
                    </div>
                    <div className="dark:text-white text-[#0F1621] text-lg sm:text-xl">
                      {formatTime(stats.totalSeconds || 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-4 sm:p-6 w-full">
                  <div className="bg-[#E879F9] rounded-full p-2 sm:p-3">
                    <LuGamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white dark:text-[#0F1621]" />
                  </div>
                  <div className="flex flex-col ml-4 sm:ml-6">
                    <span className="dark:text-white text-[#0F1621] font-bold text-base sm:text-lg tracking-widest mb-2">
                      Total Plays
                    </span>
                    <div className="">
                      <span className="dark:text-white text-[#0F1621] text-lg sm:text-xl font-thin font-sans">
                        {stats.totalPlays || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Games Played */}
          {isLoading ? (
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-4 sm:p-6 text-center">
              <div className="inline-block h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-solid border-[#C026D3] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          ) : !stats ? null : (
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-4 sm:p-6">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#C026D3]">
                Games Played
              </h3>

              <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-lg sm:text-xl font-bold dark:text-white text-[#0F1621] hidden sm:block">
                  Game
                </div>
                <div className="text-lg sm:text-xl font-bold dark:text-white text-[#0F1621] hidden sm:block">
                  Total Time Spent
                </div>
                <div className="text-lg sm:text-xl font-bold dark:text-white text-[#0F1621] hidden sm:block">
                  Last Played
                </div>
              </div>

              {!stats.gamesPlayed ||
              stats.gamesPlayed.length === 0 ||
              !stats.gamesPlayed.some(
                (game) => game && game.gameId && game.title
              ) ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-[#E879F9] rounded-full p-3">
                      <FiInfo className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="dark:text-[#bdbdbd] text-[#334154] text-sm sm:text-base">
                      You haven't played any games yet. Jump into a game to
                      start tracking your progress!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#35364d]">
                  {stats.gamesPlayed.map((game) => (
                    <div
                      key={game.gameId}
                      className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center"
                    >
                      <div className="flex items-center">
                        <img
                          src={game.thumbnailUrl || statImg}
                          alt={game.title || "Game"}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg mr-3"
                          onError={(e) => {
                            e.currentTarget.src = statImg;
                          }}
                        />
                        <div>
                          <span className="font-bold text-base sm:text-lg block sm:inline">
                            {game.title}
                          </span>
                          <div className="sm:hidden text-sm dark:text-[#bdbdbd] text-[#334154] mt-1">
                            <span className="font-bold">Time: </span>
                            {formatTime(game.totalSeconds || 0)}
                            <br />
                            <span className="font-bold">Last Played: </span>
                            {game.lastPlayed
                              ? formatRelativeTime(new Date(game.lastPlayed))
                              : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="dark:text-[#bdbdbd] text-[#334154] hidden sm:block">
                        {formatTime(game.totalSeconds || 0)}
                      </div>
                      <div className="dark:text-[#bdbdbd] text-[#334154] hidden sm:block">
                        {game.lastPlayed
                          ? formatRelativeTime(new Date(game.lastPlayed))
                          : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
