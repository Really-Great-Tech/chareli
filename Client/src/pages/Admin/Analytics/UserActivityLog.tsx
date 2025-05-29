import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { RiEqualizer2Line } from "react-icons/ri";
import { useUserActivityLog } from "../../../backend/analytics.service";

export default function UserActivityLog() {
  const { data: activities, isLoading, error } = useUserActivityLog();
  const activitiesPerPage = 5;
  const [activityPage, setActivityPage] = useState(1);

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
          <div className="p-4 text-red-500">Error loading user activity data</div>
        </Card>
      </div>
    );
  }

  const allActivities = activities || [];
  const totalActivityPages = Math.ceil(allActivities.length / activitiesPerPage);
  const startIdx = (activityPage - 1) * activitiesPerPage;
  const endIdx = startIdx + activitiesPerPage;
  const activitiesToShow = allActivities.slice(startIdx, endIdx);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
      <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
        <div className="flex justify-between items-center p-4">
          <p className="text-3xl dark:text-[#D946EF]">User Activity Log</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-2"
            >
              Filter
              <RiEqualizer2Line size={32} />
            </Button>
            <Button className="bg-[#D946EF] text-white hover:bg-[#c026d3] tracking-wider py-2">
              Export
            </Button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="text-lg font-bold">
                <TableHead>Name</TableHead>
                <TableHead>User Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Last Game Played</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activitiesToShow.map((row: any, idx) => (
                <TableRow key={idx} className="font-pincuk">
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            <span
                              className={`flex items-center gap-2 px-1 py-1 rounded-lg font-pincuk text-sm ${
                                row.userStatus === "Online"
                                  ? "bg-[#4BA366] text-white"
                                  : "bg-[#D3D8DF] text-white"
                              }`}
                              style={{ width: "60px", justifyContent: "center" }}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  row.userStatus === "Online" ? "bg-white" : "bg-[#E74C3C]"
                                }`}
                              />
                              {row.userStatus || "Offline"}
                            </span>
                          </TableCell>
                          <TableCell>{row.activity}</TableCell>
                          <TableCell>{row.lastGamePlayed || "N/A"}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 bg-[#AEB8C6] rounded-lg px-2 py-1 w-fit font-pincuk text-sm text-white">
                              <span className="w-2 h-2 rounded-full bg-[#2ECC40]" />
                              {row.startTime ? formatTime(row.startTime) : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 bg-[#AEB8C6] rounded-lg px-2 py-1 w-fit font-pincuk text-sm text-white">
                              <span className="w-2 h-2 rounded-full bg-[#E74C3C]" />
                              {row.endTime ? formatTime(row.endTime) : "N/A"}
                            </span>
                          </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">
              Showing {startIdx + 1}-{Math.min(endIdx, allActivities.length)} from {allActivities.length} data
            </span>
            <div className="flex items-center rounded-xl pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
              {Array.from({ length: totalActivityPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`w-7 h-7 rounded-full ${activityPage === i + 1 ? "bg-[#D946EF] dark:text-white" : ""} text-black dark:text-white`}
                  onClick={() => setActivityPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
