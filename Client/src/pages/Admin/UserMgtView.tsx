/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { LuGamepad2 } from "react-icons/lu";
import { FiClock } from "react-icons/fi";
import { TbCalendarClock } from "react-icons/tb";
import { useUserAnalyticsById } from "../../backend/analytics.service";
import { formatTime } from "../../utils/main";

const PAGE_SIZE = 5;

interface GameActivity {
  gameId: string;
  gameTitle: string;
  thumbnailUrl: string | null;
  sessionCount: number;
  totalPlayTime: number;
  lastPlayed: string;
}

const UserManagementView = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useUserAnalyticsById(userId ?? "");
  const response = data as any;

  const handleBack = () => {
    navigate("/admin/management");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#D946EF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !response) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">Failed to load user data</div>
      </div>
    );
  }

  // Get games array and handle pagination
  const games = response?.analytics?.gameActivity ?? [];
  const paginatedGames = games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="px-2 sm:px-4">
      <button
        className="flex items-center justify-center gap-2 text-[#475568] mb-2 border border-[#475568] rounded-lg w-auto py-2 px-3 shadow-md hover:bg-accent dark:text-white"
        onClick={handleBack}
      >
        <IoChevronBack />
        <p>Back</p>
      </button>
      <div className="flex flex-col lg:flex-row gap-6 py-6">
        <div className="w-full lg:w-72 flex flex-col items-center">
          <div className="w-full lg:w-72 bg-[#F1F5F9] rounded-2xl p-6 flex flex-col items-center mb-8 dark:bg-[#121C2D]">
            <img
              src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              alt="Profile"
              className="w-20 h-20 rounded-full border-2 border-[#D946EF]"
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center mt-4 text-center sm:text-left flex-wrap justify-center">
              <p className="mb-0 text-xl font-normal text-[#121C2D] dark:text-white tracking-wide text-center text-wrap flex">
                {`${response.user.firstName ?? ""} ${
                  response.user.lastName ?? ""
                }`}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`${
                    response.user.isActive ? "text-green-500" : "text-red-500"
                  } font-bold text-lg`}
                >
                  ●
                </span>
                <span className="text-gray-700  dark:text-white font-worksans text-lg tracking-wider">
                  {response.user.role.name}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 font-worksans dark:text-white flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              last login:{" "}
              <div className="flex items-center">
                <span className="bg-indigo-100 px-2 py-0 rounded text-gray-700 dark:bg-[#94A3B7] font-worksans text-sm font-bold tracking-wider">
                  <span className="dark:text-yellow-300 text-yellow-500 pr-2">
                    ●
                  </span>
                  {response.user.lastLoggedIn
                    ? new Date(response.user.lastLoggedIn).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
          {/* Stats Cards */}
          <div className="w-full space-y-3">
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex gap-4">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3 items-center h-fit w-fit">
                <FiClock className="w-8 h-8  text-white dark:text-[#OF1621]" />
              </div>
              <div className="flex flex-col justify-start">
                <span className="text-[#475568] mb-1 font-dmmono dark:text-white">
                  Minutes Played
                </span>
                <span className=" text-[#475568] font-worksans font-dmmono tracking-wider dark:text-white">
                  {formatTime(response.analytics?.totalTimePlayed ?? 0)}
                </span>
              </div>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex gap-4">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3 h-fit w-fit">
                <LuGamepad2 className="w-8 h-8 text-white dark:text-[#OF1621]" />
              </div>
              <div className="flex flex-col justify-start">
                <span className="text-[#475568] font-dmmono mb-1 dark:text-white">
                  Total Plays
                </span>
                <span className=" text-[#475568] font-worksans font-dmmono tracking-wider dark:text-white">
                  {response.analytics?.totalGamesPlayed ?? 0}
                </span>
              </div>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex-1 flex gap-4">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3 h-fit w-fit">
                <TbCalendarClock className="w-8 h-8 text-white dark:text-[#OF1621] " />
              </div>
              <div className="flex flex-col justify-start">
                <span className="text-[#475568] font-dmmono font mb-1 dark:text-white">
                  Sessions
                </span>
                <span className=" text-[#475568] font-worksans font-dmmono tracking-wider dark:text-white">
                  {response.analytics?.totalSessionCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT SIDE */}
        <div className="flex-1">
          {/* Profile Details */}
          <div className="bg-[#f6f8fc] rounded-2xl p-4 sm:p-6 mb-6 dark:bg-[#121C2D]">
            <h3 className="text-lg font-normal mb-4 text-[#121C2D] tracking-wide dark:text-white font-worksans">
              Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-16 space-y-border-b dark:text-white">
              <div className="text-fuchsia-500  tracking-wide">Name</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white">{`${response.user.firstName} ${response.user.lastName}`}</div>
              <div className="text-fuchsia-500  tracking-wide">Email</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white">
                {response.user.email}
              </div>
              <div className="text-fuchsia-500  tracking-wide">
                Mobile number
              </div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white">
                {response.user.phoneNumber ?? "-"}
              </div>
              <div className="text-fuchsia-500  tracking-wide">Country</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white">
                {response?.user?.country ?? "-"}
              </div>
            </div>
          </div>
          {/* Games */}
          <div className="bg-[#f6f8fc] rounded-2xl p-4 sm:p-6 dark:bg-[#121C2D]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left pb-2 text-[#121C2D] text-lg font-normal tracking-wider dark:text-white">
                      Games
                    </th>
                    <th className="text-left pb-2 text-[#121C2D] text-lg font-normal tracking-wider dark:text-white">
                      Minutes played
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!games.length ? (
                    <tr>
                      <td colSpan={2} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <LuGamepad2 className="w-12 h-12 text-gray-400" />
                          <p className="text-lg font-semibold text-gray-500">
                            No games played yet
                          </p>
                          <p className="text-gray-400">
                            This user hasn't played any games yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedGames.map((game: GameActivity, idx: number) => (
                      <tr
                        key={idx}
                        className="border-t border-gray-200 text-sm"
                      >
                        <td className="flex items-center gap-3 py-2">
                          {/* Default game icon */}
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <LuGamepad2 className="w-6 h-6 text-gray-400" />
                          </div>
                          <span className="text-[#121C2D]  tracking-wider dark:text-white">
                            {game.gameTitle ?? "Unknown Game"}
                          </span>
                        </td>
                        <td className="py-2  text-[#334154] font-worksans tracking-wider dark:text-white">
                          {formatTime(game.totalPlayTime ?? 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {games.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-3 bg-[#F1F5F9] dark:bg-[#121C2D] rounded-b-xl mt-4">
                <span className="text-sm text-[#121C2D] dark:text-white">
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, games.length)} from {games.length}{" "}
                  data
                </span>
                {Math.ceil(games.length / PAGE_SIZE) > 1 && (
                  <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
                    {Array.from(
                      { length: Math.ceil(games.length / PAGE_SIZE) },
                      (_, i) => (
                        <button
                          key={i + 1}
                          className={`w-7 h-7 rounded-full transition-colors ${
                            page === i + 1
                              ? "bg-[#D946EF] text-white dark:bg-gray-400"
                              : "bg-transparent text-[#D946EF] dark:text-gray-400 hover:bg-[#f3e8ff]"
                          }`}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
