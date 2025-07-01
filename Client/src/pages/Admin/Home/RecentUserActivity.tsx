import { Card } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useState, useMemo } from "react";
import {
  useUsersAnalytics,
  type UserAnalytics,
} from "../../../backend/analytics.service";
import { formatTime } from "../../../utils/main";
import { NoResults } from "../../../components/single/NoResults";
import { FiUsers } from "react-icons/fi";

export function RecentUserActivity() {
  const { data: usersWithAnalytics, isLoading } = useUsersAnalytics();
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Sort users by lastLoggedIn (most recent first)
  const allUsers = useMemo<UserAnalytics[]>(() => {
    if (!usersWithAnalytics) return [];
    return [...usersWithAnalytics].sort(
      (a, b) =>
        new Date(b.lastLoggedIn).getTime() - new Date(a.lastLoggedIn).getTime()
    );
  }, [usersWithAnalytics]);

  const getUsersForPage = (page: number) => {
    const startIdx = (page - 1) * usersPerPage;
    const endIdx = startIdx + usersPerPage;
    return allUsers.slice(startIdx, endIdx);
  };

  const usersToShow = getUsersForPage(currentPage);
  const totalPages = Math.ceil(allUsers.length / usersPerPage);

  return (
    <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
      <div className="flex justify-between p-4 text-3xl">
        <p className="text-2xl dark:text-[#D946EF]">Recent User Activity</p>
      </div>
      <div className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="text-base font-worksans">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Games Played</TableHead>
              <TableHead>Time Played</TableHead>
              <TableHead>Session count</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="font-worksans">
                <TableCell
                  colSpan={7}
                  className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF] mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : !usersToShow.length ? (
              <TableRow className="font-worksans">
                <TableCell
                  colSpan={7}
                  className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]"
                >
                  <NoResults
                    title="No user activity"
                    message="There are no user activity records to display at this time."
                    icon={<FiUsers className="w-12 h-12 text-gray-400" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              usersToShow.map((user, idx) => (
                <TableRow key={idx} className="font-worksans text-sm">
                  <TableCell>{`${user.firstName || ""} ${
                    user.lastName || ""
                  }`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{user.analytics.totalGamesPlayed}</TableCell>
                  <TableCell>
                    {formatTime(user.analytics.totalTimePlayed)}
                  </TableCell>
                  <TableCell>{user.analytics.totalSessionCount}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <div className="bg-[#94A3B7] p-2 rounded-lg">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                        <span className="rounded px-2 py-1 text-white font-semibold text-sm">
                          {new Date(user.lastLoggedIn).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </span>
                      </div>
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {usersToShow.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
            <span className="text-sm font-worksans order-2 sm:order-1">
              Showing {(currentPage - 1) * usersPerPage + 1}-
              {Math.min(currentPage * usersPerPage, allUsers.length)} from{" "}
              {allUsers.length} data
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 order-1 sm:order-2">
                {/* Previous button */}
                <button
                  className={`w-8 h-8 rounded-full transition-colors border border-[#D946EF] ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-[#F3E8FF] text-black dark:text-white"
                  }`}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>

                {/* Mobile: Show only current page info */}
                <div className="sm:hidden flex items-center gap-1 px-3 py-1 rounded-full border border-[#D946EF]">
                  <span className="text-sm text-black dark:text-white">
                    {currentPage} / {totalPages}
                  </span>
                </div>

                {/* Desktop: Show page numbers with smart truncation */}
                <div className="hidden sm:flex items-center gap-1 rounded-full border border-[#D946EF] p-1">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    
                    if (totalPages <= maxVisiblePages) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <button
                            key={i}
                            className={`w-8 h-8 rounded-full transition-colors ${
                              currentPage === i
                                ? "bg-[#D946EF] text-white"
                                : "hover:bg-[#F3E8FF] text-black dark:text-white"
                            }`}
                            onClick={() => setCurrentPage(i)}
                          >
                            {i}
                          </button>
                        );
                      }
                    } else {
                      // Smart truncation for many pages
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, currentPage + 2);
                      
                      // First page
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            className={`w-8 h-8 rounded-full transition-colors ${
                              currentPage === 1
                                ? "bg-[#D946EF] text-white"
                                : "hover:bg-[#F3E8FF] text-black dark:text-white"
                            }`}
                            onClick={() => setCurrentPage(1)}
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
                              currentPage === i
                                ? "bg-[#D946EF] text-white"
                                : "hover:bg-[#F3E8FF] text-black dark:text-white"
                            }`}
                            onClick={() => setCurrentPage(i)}
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
                              currentPage === totalPages
                                ? "bg-[#D946EF] text-white"
                                : "hover:bg-[#F3E8FF] text-black dark:text-white"
                            }`}
                            onClick={() => setCurrentPage(totalPages)}
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
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-[#F3E8FF] text-black dark:text-white"
                  }`}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
