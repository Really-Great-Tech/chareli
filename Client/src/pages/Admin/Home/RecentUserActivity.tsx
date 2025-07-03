// import { Card } from "../../../components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../../../components/ui/table";
// import { Button } from "../../../components/ui/button";
// import { useState, useMemo } from "react";
// import {
//   useUsersAnalytics,
//   type FilterState,
// } from "../../../backend/analytics.service";
// import { formatTime } from "../../../utils/main";
// import { NoResults } from "../../../components/single/NoResults";
// import { FiUsers } from "react-icons/fi";
// import { RiEqualizer2Line } from "react-icons/ri";
// import { RecentUserActivityFilterSheet } from "../../../components/single/RecentUserActivityFilter-Sheet";

// interface RecentActivityFilterState {
//   registrationDates: {
//     startDate: string;
//     endDate: string;
//   };
//   lastLoginDates: {
//     startDate: string;
//     endDate: string;
//   };
//   sessionCount: string;
//   timePlayed: {
//     min: number;
//     max: number;
//   };
//   gameTitle: string[];
//   gameCategory: string[];
//   country: string[];
//   ageGroup: string;
//   userStatus: string;
//   sortBy: string;
// }

// export function RecentUserActivity() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const usersPerPage = 5;
//   const [filters, setFilters] = useState<RecentActivityFilterState>({
//     registrationDates: {
//       startDate: "",
//       endDate: "",
//     },
//     lastLoginDates: {
//       startDate: "",
//       endDate: "",
//     },
//     sessionCount: "",
//     timePlayed: {
//       min: 0,
//       max: 0,
//     },
//     gameTitle: [],
//     gameCategory: [],
//     country: [],
//     ageGroup: "",
//     userStatus: "",
//     sortBy: "lastLogin",
//   });

//   // Convert RecentActivityFilterState to FilterState for the API
//   const apiFilters: FilterState = useMemo(() => ({
//     registrationDates: filters.registrationDates,
//     lastLoginStartDate: filters.lastLoginDates.startDate,
//     lastLoginEndDate: filters.lastLoginDates.endDate,
//     userStatus: filters.userStatus,
//     sortBy: filters.sortBy,
//     sessionCount: filters.sessionCount,
//     timePlayed: filters.timePlayed,
//     gameTitle: filters.gameTitle,
//     gameCategory: filters.gameCategory,
//     country: filters.country,
//     ageGroup: filters.ageGroup,
//     sortByMaxTimePlayed: false, // We use the new sortBy parameter instead
//   }), [filters]);

//   const { data: usersWithAnalytics, isLoading } = useUsersAnalytics(apiFilters);

//   const handleFiltersChange = (newFilters: RecentActivityFilterState) => {
//     setFilters(newFilters);
//     setCurrentPage(1); // Reset to first page when filters change
//   };

//   const handleFilterReset = () => {
//     setFilters({
//       registrationDates: {
//         startDate: "",
//         endDate: "",
//       },
//       lastLoginDates: {
//         startDate: "",
//         endDate: "",
//       },
//       sessionCount: "",
//       timePlayed: {
//         min: 0,
//         max: 0,
//       },
//       gameTitle: [],
//       gameCategory: [],
//       country: [],
//       ageGroup: "",
//       userStatus: "",
//       sortBy: "lastLogin",
//     });
//     setCurrentPage(1);
//   };

//   // All filtering and sorting is now handled by the backend
//   const allUsers = usersWithAnalytics || [];

//   const getUsersForPage = (page: number) => {
//     const startIdx = (page - 1) * usersPerPage;
//     const endIdx = startIdx + usersPerPage;
//     return allUsers.slice(startIdx, endIdx);
//   };

//   const usersToShow = getUsersForPage(currentPage);
//   const totalPages = Math.ceil(allUsers.length / usersPerPage);

//   // Count active filters
//   const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
//     if (key === 'sortBy') return value !== 'lastLogin'; // Only count if not default
//     if (typeof value === "object" && !Array.isArray(value)) {
//       return Object.values(value).some((v) => v !== "" && v !== 0);
//     }
//     if (Array.isArray(value)) {
//       return value.length > 0;
//     }
//     return value !== "" && value !== 0;
//   }).length;

//   return (
//     <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
//       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4">
//         <p className="text-2xl dark:text-[#D946EF]">Recent User Activity</p>
//         <div className="flex justify-end">
//           <RecentUserActivityFilterSheet
//             filters={filters}
//             onFiltersChange={handleFiltersChange}
//             onReset={handleFilterReset}
//           >
//             <Button
//               variant="outline"
//               className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-5 cursor-pointer"
//             >
//               Filter
//               <div className="text-[#D946EF] bg-[#FAE8FF] px-2 sm:px-3 py-1 rounded-full text-sm">
//                 {activeFiltersCount}
//               </div>
//               <RiEqualizer2Line size={24} className="sm:size-8" />
//             </Button>
//           </RecentUserActivityFilterSheet>
//         </div>
//       </div>
//       <div className="px-4 pb-4">
//         <Table>
//           <TableHeader>
//             <TableRow className="text-base font-worksans">
//               <TableHead>Name</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Registration Date</TableHead>
//               <TableHead>Games Played</TableHead>
//               <TableHead>Time Played</TableHead>
//               <TableHead>Session count</TableHead>
//               <TableHead>Last Login</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               <TableRow className="font-worksans">
//                 <TableCell
//                   colSpan={7}
//                   className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]"
//                 >
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF] mx-auto"></div>
//                 </TableCell>
//               </TableRow>
//             ) : !usersToShow.length ? (
//               <TableRow className="font-worksans">
//                 <TableCell
//                   colSpan={7}
//                   className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]"
//                 >
//                   <NoResults
//                     title="No user activity"
//                     message="There are no user activity records to display at this time."
//                     icon={<FiUsers className="w-12 h-12 text-gray-400" />}
//                   />
//                 </TableCell>
//               </TableRow>
//             ) : (
//               usersToShow.map((user, idx) => (
//                 <TableRow key={idx} className="font-worksans text-sm">
//                   <TableCell>{`${user.firstName || ""} ${
//                     user.lastName || ""
//                   }`}</TableCell>
//                   <TableCell>{user.email}</TableCell>
//                   <TableCell>
//                     {new Date(user.createdAt).toLocaleDateString()}
//                   </TableCell>
//                   <TableCell>{user.analytics.totalGamesPlayed}</TableCell>
//                   <TableCell>
//                     {formatTime(user.analytics.totalTimePlayed)}
//                   </TableCell>
//                   <TableCell>{user.analytics.totalSessionCount}</TableCell>
//                   <TableCell>
//                     <span className="flex items-center gap-2">
//                       <div className="bg-[#94A3B7] p-2 rounded-lg">
//                         <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
//                         <span className="rounded px-2 py-1 text-white font-semibold text-sm">
//                           {new Date(user.lastLoggedIn).toLocaleTimeString(
//                             "en-US",
//                             {
//                               hour: "2-digit",
//                               minute: "2-digit",
//                               hour12: true,
//                             }
//                           )}
//                         </span>
//                       </div>
//                     </span>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//         {usersToShow.length > 0 && (
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
//             <span className="text-sm font-worksans order-2 sm:order-1">
//               Showing {(currentPage - 1) * usersPerPage + 1}-
//               {Math.min(currentPage * usersPerPage, allUsers.length)} from{" "}
//               {allUsers.length} data
//             </span>
//             {totalPages > 1 && (
//               <div className="flex items-center gap-1 order-1 sm:order-2">
//                 {/* Previous button */}
//                 <button
//                   className={`w-8 h-8 rounded-full transition-colors border border-[#D946EF] ${
//                     currentPage === 1
//                       ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
//                       : "hover:bg-[#F3E8FF] text-black dark:text-white"
//                   }`}
//                   onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                   disabled={currentPage === 1}
//                 >
//                   ‹
//                 </button>

//                 {/* Mobile: Show only current page info */}
//                 <div className="sm:hidden flex items-center gap-1 px-3 py-1 rounded-full border border-[#D946EF]">
//                   <span className="text-sm text-black dark:text-white">
//                     {currentPage} / {totalPages}
//                   </span>
//                 </div>

//                 {/* Desktop: Show page numbers with smart truncation */}
//                 <div className="hidden sm:flex items-center gap-1 rounded-full border border-[#D946EF] p-1">
//                   {(() => {
//                     const pages = [];
//                     const maxVisiblePages = 5;
                    
//                     if (totalPages <= maxVisiblePages) {
//                       // Show all pages if total is small
//                       for (let i = 1; i <= totalPages; i++) {
//                         pages.push(
//                           <button
//                             key={i}
//                             className={`w-8 h-8 rounded-full transition-colors ${
//                               currentPage === i
//                                 ? "bg-[#D946EF] text-white"
//                                 : "hover:bg-[#F3E8FF] text-black dark:text-white"
//                             }`}
//                             onClick={() => setCurrentPage(i)}
//                           >
//                             {i}
//                           </button>
//                         );
//                       }
//                     } else {
//                       // Smart truncation for many pages
//                       const startPage = Math.max(1, currentPage - 2);
//                       const endPage = Math.min(totalPages, currentPage + 2);
                      
//                       // First page
//                       if (startPage > 1) {
//                         pages.push(
//                           <button
//                             key={1}
//                             className={`w-8 h-8 rounded-full transition-colors ${
//                               currentPage === 1
//                                 ? "bg-[#D946EF] text-white"
//                                 : "hover:bg-[#F3E8FF] text-black dark:text-white"
//                             }`}
//                             onClick={() => setCurrentPage(1)}
//                           >
//                             1
//                           </button>
//                         );
//                         if (startPage > 2) {
//                           pages.push(
//                             <span key="start-ellipsis" className="px-2 text-gray-500">
//                               ...
//                             </span>
//                           );
//                         }
//                       }
                      
//                       // Current range
//                       for (let i = startPage; i <= endPage; i++) {
//                         pages.push(
//                           <button
//                             key={i}
//                             className={`w-8 h-8 rounded-full transition-colors ${
//                               currentPage === i
//                                 ? "bg-[#D946EF] text-white"
//                                 : "hover:bg-[#F3E8FF] text-black dark:text-white"
//                             }`}
//                             onClick={() => setCurrentPage(i)}
//                           >
//                             {i}
//                           </button>
//                         );
//                       }
                      
//                       // Last page
//                       if (endPage < totalPages) {
//                         if (endPage < totalPages - 1) {
//                           pages.push(
//                             <span key="end-ellipsis" className="px-2 text-gray-500">
//                               ...
//                             </span>
//                           );
//                         }
//                         pages.push(
//                           <button
//                             key={totalPages}
//                             className={`w-8 h-8 rounded-full transition-colors ${
//                               currentPage === totalPages
//                                 ? "bg-[#D946EF] text-white"
//                                 : "hover:bg-[#F3E8FF] text-black dark:text-white"
//                             }`}
//                             onClick={() => setCurrentPage(totalPages)}
//                           >
//                             {totalPages}
//                           </button>
//                         );
//                       }
//                     }
                    
//                     return pages;
//                   })()}
//                 </div>

//                 {/* Next button */}
//                 <button
//                   className={`w-8 h-8 rounded-full transition-colors border border-[#D946EF] ${
//                     currentPage === totalPages
//                       ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
//                       : "hover:bg-[#F3E8FF] text-black dark:text-white"
//                   }`}
//                   onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                   disabled={currentPage === totalPages}
//                 >
//                   ›
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </Card>
//   );
// }
