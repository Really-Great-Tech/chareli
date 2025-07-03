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
import { Input } from "../../../components/ui/input";
import { UserManagementFilterSheet } from "../../../components/single/UserMgtFilter-Sheet";
import { Button } from "../../../components/ui/button";
import { RiEqualizer2Line } from "react-icons/ri";
import { Search, Trash2 } from "lucide-react";
import ExportModal from "../../../components/modals/AdminModals/ExportModal";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { useNavigate } from "react-router-dom";
import {
  useUsersAnalytics,
} from "../../../backend/analytics.service";
import { useDeleteUser } from "../../../backend/user.service";
import type {
  FilterState,
} from "../../../backend/analytics.service";
import { NoResults } from "../../../components/single/NoResults";
import { formatTime, canDeleteUser, getDeletionErrorMessage } from "../../../utils/main";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../../backend/constants";
import { useAuth } from "../../../context/AuthContext";

export default function UserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const deleteUser = useDeleteUser();
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
    gameTitle: [],
    gameCategory: [],
    country: [],
    ageGroup: "",
    sortByMaxTimePlayed: false,
  });

  const { data: users, isLoading } = useUsersAnalytics(filters);
  const usersPerPage = 12;

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
      gameTitle: [],
      gameCategory: [],
      country: [],
      ageGroup: "",
      sortByMaxTimePlayed: false,
    });
    setPage(1);
  };

  // Handle delete user with permission check
  const handleDeleteUser = (user: any) => {
    if (!canDeleteUser(currentUser, user)) {
      toast.error(getDeletionErrorMessage(currentUser, user));
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser.mutateAsync(userToDelete.id);
      
      // Invalidate all related queries to refresh data across the app
      await queryClient.invalidateQueries({ queryKey: [BackendRoute.USER] });
      await queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS] });
      await queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_DASHBOARD] });
      await queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USER_ACTIVITY] });
      await queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
      
      toast.success(`User ${userToDelete.firstName} ${userToDelete.lastName} deleted successfully`);
      setUserToDelete(null);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Filter users based on search query
  const getFilteredUsers = () => {
    if (!users) return [];
    
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      const phone = (user.phoneNumber || "").toLowerCase();
      const id = user.id.toLowerCase();
      
      return fullName.includes(query) || 
             email.includes(query) || 
             phone.includes(query) || 
             id.includes(query);
    });
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="px-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-[#D946EF] text-2xl sm:text-3xl font-worksans">
          User Management
        </h1>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-end">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page when searching
              }}
              className="pl-10 bg-white dark:bg-[#1E293B] border-gray-300 dark:border-gray-600 h-12"
            />
          </div>
          
          <UserManagementFilterSheet
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFilterReset}
            users={users}
          >
            <Button
              variant="outline"
              className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-5 cursor-pointer"
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
            <p className="text-xl dark:text-[#D946EF]">Recent User Activity</p>
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
                    <TableRow className="text-lg font-worksans">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Games Played</TableHead>
                      <TableHead>Time Played</TableHead>
                      <TableHead>Session count</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers &&
                      filteredUsers
                        .slice((page - 1) * usersPerPage, page * usersPerPage)
                        .map((user, idx) => (
                          <TableRow
                            key={idx}
                            className="font-worksans text-sm tracking-wider cursor-pointer hover:bg-[#f3e8ff] dark:hover:bg-[#23243a]"
                            onClick={() =>
                              navigate(`/admin/management/${user.id}`, {
                                state: { user },
                              })
                            }
                          >
                            <TableCell>{`${user.firstName || ""} ${
                              user.lastName || ""
                            }`}</TableCell>
                            <TableCell>{user.email || "-"}</TableCell>
                            <TableCell>{user.country || "-"}</TableCell>
                            <TableCell className="">
                              {user.phoneNumber || "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {user.analytics?.totalGamesPlayed || 0}
                            </TableCell>
                            <TableCell>
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
                            <TableCell>
                              {canDeleteUser(currentUser, user) ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click navigation
                                    handleDeleteUser(user);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-600 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
                  <span className="text-sm order-2 sm:order-1">
                    Showing {(page - 1) * usersPerPage + 1}-
                    {Math.min(page * usersPerPage, filteredUsers?.length || 0)}{" "}
                    from {filteredUsers?.length || 0} data
                  </span>
                  {Math.ceil((filteredUsers?.length || 0) / usersPerPage) > 1 && (
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
                          {page} / {Math.ceil((filteredUsers?.length || 0) / usersPerPage)}
                        </span>
                      </div>

                      {/* Desktop: Show page numbers with smart truncation */}
                      <div className="hidden sm:flex items-center gap-1 rounded-full border border-[#D946EF] p-1">
                        {(() => {
                          const pages = [];
                          const totalPages = Math.ceil((filteredUsers?.length || 0) / usersPerPage);
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
                          page === Math.ceil((filteredUsers?.length || 0) / usersPerPage)
                            ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                            : "hover:bg-[#F3E8FF] text-black dark:text-white"
                        }`}
                        onClick={() => setPage(Math.min(Math.ceil((filteredUsers?.length || 0) / usersPerPage), page + 1))}
                        disabled={page === Math.ceil((filteredUsers?.length || 0) / usersPerPage)}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        isDeleting={deleteUser.isPending}
        title="Delete User"
        description={
          userToDelete ? (
            <span>
              Are you sure you want to delete <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>? This action cannot be undone.
            </span>
          ) : ""
        }
        confirmButtonText="Delete User"
        loadingText="Deleting..."
      />
    </div>
  );
}
