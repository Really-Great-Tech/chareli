/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { LuGamepad2 } from "react-icons/lu";
import { FiClock } from "react-icons/fi";
import { TbCalendarClock } from "react-icons/tb";
import { RiDeleteBin6Line } from "react-icons/ri";
import { LazyImage } from "../../components/ui/LazyImage";
import { Button } from "../../components/ui/button";
import { DeleteConfirmationModal } from "../../components/modals/DeleteConfirmationModal";
import { useUserAnalyticsById } from "../../backend/analytics.service";
import { useDeleteUser } from "../../backend/user.service";
import { formatTime } from "../../utils/main";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
// import { useQueryClient } from "@tanstack/react-query";
// import { BackendRoute } from "../../backend/constants";

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
  // const queryClient = useQueryClient();
  const { user: currentUser, logout } = useAuth();
  const { userId } = useParams();
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { data, isLoading, isError } = useUserAnalyticsById(userId ?? "");
  const deleteUser = useDeleteUser();
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
            <div className="flex flex-col gap-3 items-center mt-4 text-center w-full">
              <p className="mb-0 text-xl font-normal text-[#121C2D] dark:text-white tracking-wide text-center break-words w-full px-2" title={`${response.user.firstName ?? ""} ${response.user.lastName ?? ""}`}>
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
                <span className="text-gray-700 dark:text-white font-worksans text-lg tracking-wider break-words" title={response.user.role.name}>
                  {response.user.role.name}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 font-worksans dark:text-white flex flex-col items-center gap-2 text-center w-full">
              <span>last login:</span>
              <div className="flex items-center justify-center w-full">
                <span className="bg-indigo-100 px-2 py-1 rounded text-gray-700 dark:bg-[#94A3B7] font-worksans text-sm font-bold tracking-wider break-words max-w-full">
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
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full mt-4">
              {/* Hide delete button if admin trying to delete superadmin */}
              {!(currentUser?.role.name === 'admin' && response?.user?.role?.name === 'superadmin') ? (
                <Button
                  className="flex items-center justify-center gap-2 w-full bg-[#EF4444] text-white tracking-wider hover:bg-[#dc2626] cursor-pointer"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete <RiDeleteBin6Line />
                </Button>
              ) : (
                <div className="flex items-center justify-center w-full py-2 px-4 bg-gray-300 text-gray-600 rounded-md">
                  <span className="text-sm font-medium">Protected Account</span>
                </div>
              )}
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
              <div className="text-fuchsia-500 tracking-wide">Name</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white break-words" title={`${response.user.firstName} ${response.user.lastName}`}>
                {`${response.user.firstName} ${response.user.lastName}`}
              </div>
              <div className="text-fuchsia-500 tracking-wide">Email</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white break-all" title={response.user.email}>
                {response.user.email}
              </div>
              <div className="text-fuchsia-500 tracking-wide">
                Mobile number
              </div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white break-all" title={response.user.phoneNumber ?? "-"}>
                {response.user.phoneNumber ?? "-"}
              </div>
              <div className="text-fuchsia-500 tracking-wide">Country</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white break-words" title={response?.user?.country ?? "-"}>
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
                          {/* Game thumbnail */}
                          {game.thumbnailUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                              <LazyImage
                                src={game.thumbnailUrl}
                                alt={game.gameTitle}
                                className="w-full h-full object-cover"
                                loadingClassName="rounded-lg"
                                spinnerColor="#D946EF"
                                rootMargin="50px"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <LuGamepad2 className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <span className="text-[#121C2D]  tracking-wider dark:text-white">
                            {game.gameTitle ?? "-"}
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 py-3 bg-[#F1F5F9] dark:bg-[#121C2D] rounded-b-xl mt-4">
                <span className="text-sm text-[#121C2D] dark:text-white order-2 sm:order-1">
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, games.length)} from {games.length}{" "}
                  data
                </span>
                {Math.ceil(games.length / PAGE_SIZE) > 1 && (
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    {/* Previous button */}
                    <button
                      className={`w-8 h-8 rounded-full transition-colors border border-[#D946EF] ${
                        page === 1
                          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                          : "hover:bg-[#F3E8FF] text-black dark:text-white"
                      }`}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      ‹
                    </button>

                    {/* Mobile: Show only current page info */}
                    <div className="sm:hidden flex items-center gap-1 px-3 py-1 rounded-full border border-[#D946EF]">
                      <span className="text-sm text-black dark:text-white">
                        {page} / {Math.ceil(games.length / PAGE_SIZE)}
                      </span>
                    </div>

                    {/* Desktop: Show page numbers with smart truncation */}
                    <div className="hidden sm:flex items-center gap-1 rounded-full border border-[#D946EF] p-1">
                      {(() => {
                        const pages = [];
                        const totalPages = Math.ceil(games.length / PAGE_SIZE);
                        const maxVisiblePages = 5;
                        
                        if (totalPages <= maxVisiblePages) {
                          // Show all pages if total is small
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <button
                                key={i}
                                className={`w-8 h-8 rounded-full transition-colors ${
                                  page === i
                                    ? "bg-[#D946EF] text-white"
                                    : "hover:bg-[#F3E8FF] text-black dark:text-white"
                                }`}
                                onClick={() => setPage(i)}
                              >
                                {i}
                              </button>
                            );
                          }
                        } else {
                          // Smart truncation for many pages
                          const startPage = Math.max(1, page - 2);
                          const endPage = Math.min(totalPages, page + 2);
                          
                          // First page
                          if (startPage > 1) {
                            pages.push(
                              <button
                                key={1}
                                className={`w-8 h-8 rounded-full transition-colors ${
                                  page === 1
                                    ? "bg-[#D946EF] text-white"
                                    : "hover:bg-[#F3E8FF] text-black dark:text-white"
                                }`}
                                onClick={() => setPage(1)}
                              >
                                1
                              </button>
                            );
                            if (startPage > 2) {
                              pages.push(
                                <span key="start-ellipsis" className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }
                          }
                          
                          // Current range
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                className={`w-8 h-8 rounded-full transition-colors ${
                                  page === i
                                    ? "bg-[#D946EF] text-white"
                                    : "hover:bg-[#F3E8FF] text-black dark:text-white"
                                }`}
                                onClick={() => setPage(i)}
                              >
                                {i}
                              </button>
                            );
                          }
                          
                          // Last page
                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push(
                                <span key="end-ellipsis" className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }
                            pages.push(
                              <button
                                key={totalPages}
                                className={`w-8 h-8 rounded-full transition-colors ${
                                  page === totalPages
                                    ? "bg-[#D946EF] text-white"
                                    : "hover:bg-[#F3E8FF] text-black dark:text-white"
                                }`}
                                onClick={() => setPage(totalPages)}
                              >
                                {totalPages}
                              </button>
                            );
                          }
                        }
                        
                        return pages;
                      })()}
                    </div>

                    {/* Next button */}
                    <button
                      className={`w-8 h-8 rounded-full transition-colors border border-[#D946EF] ${
                        page === Math.ceil(games.length / PAGE_SIZE)
                          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                          : "hover:bg-[#F3E8FF] text-black dark:text-white"
                      }`}
                      onClick={() => setPage(Math.min(Math.ceil(games.length / PAGE_SIZE), page + 1))}
                      disabled={page === Math.ceil(games.length / PAGE_SIZE)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={async () => {
          // Check if admin is deleting themselves
          const isDeletingSelf = currentUser?.id === userId;
          
          try {
            await deleteUser.mutateAsync(userId || "");
            
            toast.success(`User ${response.user.firstName} ${response.user.lastName} deleted successfully`);
            
            // If admin deleted themselves, log them out and redirect to home
            if (isDeletingSelf) {
              setTimeout(() => {
                logout(true); // Silent logout (no additional toast)
                navigate("/");
              }, 1000); // Give time for the success toast to be seen
            } else {
              navigate("/admin/management");
            }
          } catch (error: any) {
            // Check if it's a permission error for trying to delete superadmin
            if (error?.response?.data?.message?.includes('cannot delete superadmin')) {
              toast.error("Admin cannot delete superadmin accounts");
            } else {
              toast.error("Failed to delete user");
            }
          }
        }}
        isDeleting={deleteUser.isPending}
        title="Delete User"
        description={
          response?.user ? (
            <span>
              Are you sure you want to delete <strong>{response.user.firstName} {response.user.lastName}</strong>? This action cannot be undone.
            </span>
          ) : ""
        }
        confirmButtonText="Delete User"
        loadingText="Deleting..."
      />
    </div>
  );
};

export default UserManagementView;
