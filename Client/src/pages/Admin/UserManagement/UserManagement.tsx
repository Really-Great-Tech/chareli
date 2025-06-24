import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Card } from "../../../components/ui/card";
import { UserManagementFilterSheet } from "../../../components/single/UserMgtFilter-Sheet";
import { Button } from "../../../components/ui/button";
import { RiEqualizer2Line } from "react-icons/ri";
import ExportModal from "../../../components/modals/AdminModals/ExportModal";
import { useNavigate } from "react-router-dom";
import {
  useUsersAnalytics,
  useGamesAnalytics,
} from "../../../backend/analytics.service";
import type {
  FilterState,
  GameAnalytics,
} from "../../../backend/analytics.service";
import { NoResults } from "../../../components/single/NoResults";
import { formatTime } from "../../../utils/main";

export default function UserManagement() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    registrationDates: {
      startDate: "",
      endDate: "",
    },
    sessionCount: "",
    timePlayed: {
      min: 0,
      max: 0,
    },
    gameTitle: "",
    gameCategory: "",
    country: "",
    sortByMaxTimePlayed: false,
  });

  const { data: users, isLoading } = useUsersAnalytics(filters);
  const { data: games } = useGamesAnalytics();
  const usersPerPage = 12;

  console.log("users for analytics", users);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleFilterReset = () => {
    setFilters({
      registrationDates: {
        startDate: "",
        endDate: "",
      },
      sessionCount: "",
      timePlayed: {
        min: 0,
        max: 0,
      },
      gameTitle: "",
      gameCategory: "",
      country: "",
      sortByMaxTimePlayed: false,
    });
    setPage(1);
  };

  // Filter users based on criteria
  let filteredUsers = users?.filter((user) => {
    if (
      filters.registrationDates.startDate &&
      new Date(user.createdAt) < new Date(filters.registrationDates.startDate)
    )
      return false;
    if (
      filters.registrationDates.endDate &&
      new Date(user.createdAt) > new Date(filters.registrationDates.endDate)
    )
      return false;
    if (
      filters.sessionCount &&
      user.analytics?.totalSessionCount < parseInt(filters.sessionCount)
    )
      return false;
    if (
      filters.timePlayed.min &&
      (user.analytics?.totalTimePlayed || 0) / 60 < filters.timePlayed.min
    )
      return false;
    if (
      filters.timePlayed.max &&
      (user.analytics?.totalTimePlayed || 0) / 60 > filters.timePlayed.max
    )
      return false;
    if (
      filters.gameCategory &&
      user.analytics?.mostPlayedGame?.gameId &&
      !games?.find(
        (g: GameAnalytics) =>
          g.id === user.analytics?.mostPlayedGame?.gameId &&
          g.category?.name === filters.gameCategory
      )
    )
      return false;
    if (
      filters.gameTitle &&
      user.analytics?.mostPlayedGame?.gameTitle !== filters.gameTitle
    )
      return false;
    if (filters.country && user.country !== filters.country) return false;
    return true;
  });

  if (filters.sortByMaxTimePlayed && filteredUsers) {
    filteredUsers = [...filteredUsers].sort(
      (a, b) =>
        (b.analytics?.totalTimePlayed || 0) -
        (a.analytics?.totalTimePlayed || 0)
    );
  }

  return (
    <div className="px-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-[#D946EF] text-2xl sm:text-3xl font-dmmono">
          User Management
        </h1>
        <div className="flex flex-wrap gap-3 justify-end">
          <UserManagementFilterSheet
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFilterReset}
            users={users}
          >
            <Button
              variant="outline"
              className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-5"
            >
              Filter
              <div className="text-[#D946EF] bg-[#FAE8FF] px-2 sm:px-3 py-1 rounded-full text-sm">
                {
                  Object.entries(filters).filter(([, value]) =>
                    typeof value === "object"
                      ? Object.values(value).some((v) => v !== "" && v !== 0)
                      : typeof value === "boolean"
                      ? value === true
                      : value !== ""
                  ).length
                }
              </div>
              <RiEqualizer2Line size={24} className="sm:size-8" />
            </Button>
          </UserManagementFilterSheet>
          <ExportModal
            data={filteredUsers || []}
            title="Export User Data"
            description="Choose the format you'd like to export your user data"
          />
        </div>
      </div>
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="flex justify-between p-4 text-3xl">
            <p className="text-3xl dark:text-[#D946EF]">Recent User Activity</p>
            {/* <p className="text-xl cursor-pointer">View All</p> */}
          </div>
          {/* table */}
          <div className="px-4 pb-4">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : !filteredUsers?.length ? (
              <NoResults
                title={users?.length ? "No matching results" : "No users found"}
                message={
                  users?.length
                    ? "Try adjusting your filters or search criteria"
                    : "There are no users in the system yet"
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xl text-bold">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Games Played</TableHead>
                      <TableHead>Time Played</TableHead>
                      <TableHead>Session count</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers &&
                      filteredUsers
                        .slice((page - 1) * usersPerPage, page * usersPerPage)
                        .map((user, idx) => (
                          <TableRow
                            key={idx}
                            className="font-worksans text-md tracking-wider cursor-pointer hover:bg-[#f3e8ff] dark:hover:bg-[#23243a]"
                            onClick={() =>
                              navigate(`/admin/management/${user.id}`, {
                                state: { user },
                              })
                            }
                          >
                            <TableCell className="text-lg">{`${
                              user.firstName || ""
                            } ${user.lastName || ""}`}</TableCell>
                            <TableCell className="text-lg">
                              {user.email || "-"}
                            </TableCell>
                            <TableCell className="text-lg">
                              {user.country || "-"}
                            </TableCell>
                            <TableCell className="">
                              {user.phoneNumber || "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {user.analytics?.totalGamesPlayed || 0}
                            </TableCell>
                            <TableCell className="text-lg">
                              {formatTime(user.analytics?.totalTimePlayed || 0)}
                            </TableCell>
                            <TableCell>
                              {user.analytics?.totalSessionCount || 0}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <div className="bg-[#94A3B7] p-2 rounded-lg">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full ${
                                      user.lastLoggedIn
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  <span className="rounded px-2 py-1 text-white font-semibold text-sm">
                                    {user.lastLoggedIn
                                      ? new Date(
                                          user.lastLoggedIn
                                        ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "Never logged in"}
                                  </span>
                                </div>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm">
                    Showing {(page - 1) * usersPerPage + 1}-
                    {Math.min(page * usersPerPage, filteredUsers?.length || 0)}{" "}
                    from {filteredUsers?.length || 0} data
                  </span>
                  <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
                    {Array.from(
                      {
                        length: Math.ceil(
                          (filteredUsers?.length || 0) / usersPerPage
                        ),
                      },
                      (_, i) => (
                        <button
                          key={i + 1}
                          className={`w-7 h-7 rounded-full ${
                            page === i + 1
                              ? "bg-[#D946EF] text-white"
                              : "bg-transparent text-[#D946EF]"
                          } hover:bg-[#f3e8ff]`}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
