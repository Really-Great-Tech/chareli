import { useState, useCallback } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { NoResults } from "../../../components/single/NoResults";
import { FiActivity } from "react-icons/fi";
import { RiEqualizer2Line } from "react-icons/ri";
import { useUserActivityLog, type ActivityLogFilterState } from "../../../backend/analytics.service";
import ActivityLogExportModal from "../../../components/modals/AdminModals/ActivityLogExportModal";
import { ActivityLogFilterSheet } from "../../../components/single/ActivityLogFilter-Sheet";
import { usePermissions } from "../../../hooks/usePermissions";
import { formatTime } from "../../../utils/main";

export default function UserActivityLog() {
  const permissions = usePermissions();
  const [filters, setFilters] = useState<ActivityLogFilterState>({
    dateRange: {
      startDate: "",
      endDate: "",
    },
    userStatus: "",
    userName: "",
    gameTitle: [],
    activityType: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: activities, isLoading, error } = useUserActivityLog(filters);
  const activitiesPerPage = 5;
  const [activityPage, setActivityPage] = useState(1);

  const handleFiltersChange = useCallback((newFilters: ActivityLogFilterState) => {
    setFilters(prev => {
      // Only update if filters actually changed to prevent unnecessary re-renders
      if (JSON.stringify(prev) !== JSON.stringify(newFilters)) {
        setActivityPage(1); // Reset to first page when filters change
        return newFilters;
      }
      return prev;
    });
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({
      dateRange: {
        startDate: "",
        endDate: "",
      },
      userStatus: "",
      userName: "",
      gameTitle: [],
      activityType: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setActivityPage(1);
  }, []);

  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="p-4">Loading user activity data...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="p-4 text-red-500">
            Error loading user activity data
          </div>
        </Card>
      </div>
    );
  }

  const allActivities = activities || [];
  const totalActivityPages = Math.ceil(
    allActivities.length / activitiesPerPage
  );
  const startIdx = (activityPage - 1) * activitiesPerPage;
  const endIdx = startIdx + activitiesPerPage;
  const activitiesToShow = allActivities.slice(startIdx, endIdx);

  const formatTimeStamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
      <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4">
          <p className="text-xl md:text-2xl dark:text-[#D946EF]">
            User Activity Log
          </p>
          {(permissions.canFilter || permissions.canExport) && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {permissions.canFilter && (
                <ActivityLogFilterSheet
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleFilterReset}
                >
                  <Button
                    variant="outline"
                    className="border-[#475568] text-[#475568] flex items-center justify-center gap-2 dark:text-white py-3 sm:py-5 cursor-pointer w-full sm:w-auto"
                  >
                    <span className="text-sm sm:text-base">Filter</span>
                    <div className="text-[#D946EF] bg-[#FAE8FF] px-2 py-1 rounded-full text-xs sm:text-sm">
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
                    <RiEqualizer2Line size={20} className="sm:size-6" />
                  </Button>
                </ActivityLogFilterSheet>
              )}
              {permissions.canExport && (
                <ActivityLogExportModal
                  data={allActivities}
                  filters={filters}
                  title="Export Activity Log"
                  description="Choose the format you'd like to export your activity log data"
                />
              )}
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="text-base ">
                <TableHead>Name</TableHead>
                <TableHead>User Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Last Game Played</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Last Session Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!activitiesToShow.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 bg-[#F8FAFC] dark:bg-[#0F1221]"
                  >
                    <NoResults
                      title="No activity logs"
                      message="There are no user activity records to display at this time."
                      icon={<FiActivity className="w-12 h-12 text-gray-400" />}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                activitiesToShow.map((row: any, idx) => (
                  <TableRow key={idx} className=" text-sm tracking-wider">
                    <TableCell className="">
                      <p className="font-dmmono">
                        {row.name?.trim() ? row.name : "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`flex items-center gap-1 px-1 py-1 rounded-[4px] font-dmmono text-sm tracking-wider w-fit ${
                          row.userStatus === "Online"
                            ? "bg-[#4BA366] text-white"
                            : "bg-[#CBD5E0] text-white"
                        }`}
                        style={{ justifyContent: "center" }}
                      >
                        <div
                          className={`min-w-[8px] min-h-[8px] rounded-full ${
                            row.userStatus === "Online"
                              ? "bg-white"
                              : "bg-[#E74C3C]"
                          }`}
                          style={{ aspectRatio: "1/1" }}
                        />
                        {row.userStatus ?? "Offline"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-dmmono">{row.activity ?? "-"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-dmmono">{row.lastGamePlayed ?? "-"}</p>
                    </TableCell>
                    <TableCell>
                      {row.startTime ? (
                        <span className="flex items-center gap-2 bg-[#AEB8C6] rounded-lg px-2 py-1 w-fit  text-sm tracking-wider text-white font-dmmono">
                          <div
                            className="min-w-[8px] min-h-[8px] rounded-full bg-[#2ECC40]"
                            style={{ aspectRatio: "1/1" }}
                          />
                          {formatTimeStamp(row.startTime)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.endTime ? (
                        <span className="flex items-center gap-2 bg-[#AEB8C6] rounded-lg px-2 py-1 w-fit  text-sm tracking-wider font-dmmono text-white">
                          <div
                            className="min-w-[8px] min-h-[8px] rounded-full bg-[#E74C3C]"
                            style={{ aspectRatio: "1/1" }}
                          />
                          {formatTimeStamp(row.endTime)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.lastSessionDuration ? (
                        <span className="flex items-center gap-2 px-2 py-1 w-fit text-sm tracking-wider text-white font-dmmono">
                          <div
                            style={{ aspectRatio: "1/1" }}
                          />
                          {formatTime(row.lastSessionDuration)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {activitiesToShow.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3">
              <span className="text-sm order-2 sm:order-1">
                Showing {startIdx + 1}-{Math.min(endIdx, allActivities.length)}{" "}
                from {allActivities.length} data
              </span>
              {totalActivityPages > 1 && (
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  {/* Previous button */}
                  <button
                    className={`w-8 h-8 rounded-full transition-colors border border-[#D946EF] ${
                      activityPage === 1
                        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-[#F3E8FF] text-black dark:text-white"
                    }`}
                    onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                    disabled={activityPage === 1}
                  >
                    ‹
                  </button>

                  {/* Mobile: Show only current page info */}
                  <div className="sm:hidden flex items-center gap-1 px-3 py-1 rounded-full border border-[#D946EF]">
                    <span className="text-sm text-black dark:text-white">
                      {activityPage} / {totalActivityPages}
                    </span>
                  </div>

                  {/* Desktop: Show page numbers with smart truncation */}
                  <div className="hidden sm:flex items-center gap-1 rounded-full border border-[#D946EF] p-1">
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;
                      
                      if (totalActivityPages <= maxVisiblePages) {
                        // Show all pages if total is small
                        for (let i = 1; i <= totalActivityPages; i++) {
                          pages.push(
                            <button
                              key={i}
                              className={`w-8 h-8 rounded-full transition-colors ${
                                activityPage === i
                                  ? "bg-[#D946EF] text-white"
                                  : "hover:bg-[#F3E8FF] text-black dark:text-white"
                              }`}
                              onClick={() => setActivityPage(i)}
                            >
                              {i}
                            </button>
                          );
                        }
                      } else {
                        // Smart truncation for many pages
                        const startPage = Math.max(1, activityPage - 2);
                        const endPage = Math.min(totalActivityPages, activityPage + 2);
                        
                        // First page
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              className={`w-8 h-8 rounded-full transition-colors ${
                                activityPage === 1
                                  ? "bg-[#D946EF] text-white"
                                  : "hover:bg-[#F3E8FF] text-black dark:text-white"
                              }`}
                              onClick={() => setActivityPage(1)}
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
                                activityPage === i
                                  ? "bg-[#D946EF] text-white"
                                  : "hover:bg-[#F3E8FF] text-black dark:text-white"
                              }`}
                              onClick={() => setActivityPage(i)}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        // Last page
                        if (endPage < totalActivityPages) {
                          if (endPage < totalActivityPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalActivityPages}
                              className={`w-8 h-8 rounded-full transition-colors ${
                                activityPage === totalActivityPages
                                  ? "bg-[#D946EF] text-white"
                                  : "hover:bg-[#F3E8FF] text-black dark:text-white"
                              }`}
                              onClick={() => setActivityPage(totalActivityPages)}
                            >
                              {totalActivityPages}
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
                      activityPage === totalActivityPages
                        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-[#F3E8FF] text-black dark:text-white"
                    }`}
                    onClick={() => setActivityPage(Math.min(totalActivityPages, activityPage + 1))}
                    disabled={activityPage === totalActivityPages}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
