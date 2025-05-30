import { useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { LuGamepad2 } from "react-icons/lu";
import { FiClock } from "react-icons/fi";
import { TbCalendarClock } from "react-icons/tb";
import type { UserAnalytics } from "../../backend/analytics.service";

const PAGE_SIZE = 5;

interface Game {
  name: string;
  minutes: number;
}

const UserManagementView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  
  const userData = location.state?.user as UserAnalytics | undefined;

  const handleBack = () => {
    navigate("/admin/management");
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">User data not found</div>
      </div>
    );
  }

  // Create games array from most played game
  const games: Game[] = userData.analytics?.mostPlayedGame ? [{
    name: userData.analytics.mostPlayedGame.gameTitle || 'Unknown Game',
    minutes: Math.floor((userData.analytics.totalTimePlayed || 0) / 60),
  }] : [];

  const paginatedGames = games.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="px-4">
      <button
        className="flex items-center justify-center gap-2 text-[#475568] mb-2 border border-[#475568] rounded-lg w-22 py-2 px-1 shadow-md hover:bg-accent dark:text-white"
        onClick={handleBack}
      >
        <IoChevronBack />
        <p>Back</p>
      </button>
      {/* Main flex container: left and right side by side */}
      <div className="flex gap-6 py-6">
        {/* LEFT SIDE */}
        <div className="w-72 flex flex-col items-center">
          {/* Profile Card */}
          <div className="w-72 bg-[#F1F5F9] rounded-2xl p-6 flex flex-col items-center mb-8 dark:bg-[#121C2D]">
            {/* Default avatar since we don't have user avatars yet */}
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-600">{userData.firstName[0]}{userData.lastName[0]}</span>
            </div>
            <div className="flex gap-3 items-center mt-4">
              <h2 className="mb-0 text-xl font-bold text-[#121C2D] dark:text-white trackking-wide">
                {`${userData.firstName} ${userData.lastName}`}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`${userData.isActive ? 'text-green-500' : 'text-red-500'} font-bold text-lg`}>●</span>
                <span className="text-gray-700 text-sm dark:text-white font-pincuk">{userData.role.name}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 font-sans font-semibold dark:text-white mr-1 flex items-center gap-2">
              last login:{" "}
              <div className="flex items-center">
                <span className="bg-indigo-100 px-2 py-0 rounded text-gray-700 dark:bg-[#94A3B7] font-pincuk">
                  <span className="text-yellow-500 font-bold text-lg">●</span>
                  {userData.lastLoggedIn ? new Date(userData.lastLoggedIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
              </div>
            </div>
          </div>
          {/* Stats Cards */}
          <div className="space-y-3">
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex gap-4 w-72">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3 items-center">
                <FiClock className="w-8 h-8  text-white dark:text-[#OF1621]" />
              </div>
              <div className="flex flex-col justify-start">
                <span className="text-[#475568] text-lg font mb-1 dark:text-white">
                  Minutes Played
                </span>
                <span className="text-sm text-[#475568] font-pincuk dark:text-white">
                  {Math.floor((userData.analytics?.totalTimePlayed || 0) / 60)} minutes
                </span>
              </div>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex gap-4 w-72">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3">
                <LuGamepad2 className="w-8 h-8 text-white dark:text-[#OF1621]" />
              </div>
              <div className="flex flex-col justify-start">
                <span className="text-[#475568] text-lg font mb-1 dark:text-white">
                  Total Plays
                </span>
                <span className="text-sm text-[#475568] font-pincuk dark:text-white">
                  {userData.analytics?.totalGamesPlayed || 0}
                </span>
              </div>
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl p-4 flex-1 flex gap-4 w-72">
              <div className="bg-[#F0ABFC] rounded-full px-3 py-3">
                <TbCalendarClock className="w-8 h-8 text-white dark:text-[#OF1621]" />
              </div>
              <div className="flex flex-col justify-start">
                <span className="text-[#475568] text-lg font mb-1 dark:text-white">
                  Sessions
                </span>
                <span className="text-sm text-[#475568] font-pincuk dark:text-white">
                  {userData.analytics?.totalSessionCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT SIDE */}
        <div className="flex-1">
          {/* Profile Details */}
          <div className="bg-[#f6f8fc] rounded-2xl p-6 mb-6 dark:bg-[#121C2D]">
            <h3 className="text-lg font-bold mb-4 text-[#121C2D] tracking-wide dark:text-white">Profile Details</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-96 space-y-border-b dark:text-white">
              <div className="text-fuchsia-500  tracking-wide">Name</div>
              <div className="text-[#334154] font-pincuk dark:text-white">{`${userData.firstName} ${userData.lastName}`}</div>
              <div className="text-fuchsia-500  tracking-wide">Email</div>
              <div className="text-[#334154] font-pincuk dark:text-white">{userData.email}</div>
              <div className="text-fuchsia-500  tracking-wide">
                Mobile number
              </div>
              <div className="text-[#334154] font-pincuk dark:text-white">{userData.phoneNumber || '-'}</div>
              <div className="text-fuchsia-500  tracking-wide">
                Country
              </div>
              <div className="text-[#334154] font-pincuk dark:text-white">{userData.country || '-'}</div>
            </div>
          </div>
          {/* Games */} 
          <div className="bg-[#f6f8fc] rounded-2xl p-6 dark:bg-[#121C2D]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-[#121C2D] text-lg tracking-wider dark:text-white">Games</th>
                  <th className="text-left pb-2 text-[#121C2D] text-lg tracking-wider dark:text-white">Minutes played</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGames.map((game: Game, idx: number) => (
                  <tr key={idx} className="border-t border-gray-200">
                    <td className="flex items-center gap-3 py-2">
                      {/* Default game icon */}
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <LuGamepad2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-[#121C2D] text-lg tracking-wider dark:text-white">{game.name}</span>
                    </td>
                    <td className="py-2 text-lg text-[#334154] font-pincuk dark:text-white">{game.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-between items-center px-4 py-3 bg-[#F1F5F9] dark:bg-[#121C2D] rounded-b-xl ">
              <span className="text-sm text-[#121C2D] dark:text-white">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, games.length)} from {games.length} data
              </span>
              <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
                {Array.from({ length: Math.ceil(games.length / PAGE_SIZE) }, (_, i) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
