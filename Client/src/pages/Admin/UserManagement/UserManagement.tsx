import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Card } from "../../../components/ui/card";
import { UserManagementFilterSheet } from '../../../components/single/UserMgtFilter-Sheet';
import { Button } from '../../../components/ui/button';
import { RiEqualizer2Line } from 'react-icons/ri';
import { PiExportBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

export default function UserManagement() {
  const navigate = useNavigate();
  return (
    <div className='px-8'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#D946EF] text-3xl font-boogaloo">User Management</h1>
        <div className="flex gap-3">
          <UserManagementFilterSheet>
            <Button
              variant="outline"
              className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-6"
            >
              Filter
              <div className='text-[#D946EF] bg-[#FAE8FF] px-3 py-1 rounded-full'>3</div>
              <RiEqualizer2Line size={32} />
            </Button>
          </UserManagementFilterSheet>
            <Button className="bg-[#D946EF] text-white hover:bg-[#c026d3] tracking-wider py-6">
              Export
              <PiExportBold className='w-6 h-6 text-xl'/>
            </Button>
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
            {/** Pagination logic for users */}
            {(() => {
              // Mock user data: 20 users for 4 pages
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const allUsers = Array.from({ length: 20 }, (_, idx) => ({
                name: "John Doe",
                email: "john@email.com",
                phone: "233567923890",
                country: ["Ireland", "France", "USA", "Israel", "Australia"][Math.floor(idx / 4)],
                registration: "12/08/2025",
                games: 34,
                time: "120 minutes",
                sessions: 20,
                lastLogin: "16:59"
              }));
              const usersPerPage = 12;
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [userPage, setUserPage] = React.useState(1);
              const totalUserPages = 4; // Only 4 pages
              const startIdx = (userPage - 1) * usersPerPage;
              const endIdx = startIdx + usersPerPage;
              const usersToShow = allUsers.slice(startIdx, endIdx);

              return (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xl text-bold">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Games Played</TableHead>
                        <TableHead>Time Played</TableHead>
                        <TableHead>Session count</TableHead>
                        <TableHead>Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersToShow.map((user, idx) => (
                        <TableRow
                          key={idx}
                          className="font-sans cursor-pointer hover:bg-[#f3e8ff] dark:hover:bg-[#23243a]"
                          onClick={() => navigate(`/admin/management/${startIdx + idx + 1}`)}
                        >
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.country}</TableCell>
                          <TableCell>{user.registration}</TableCell>
                          <TableCell>{user.games}</TableCell>
                          <TableCell>{user.time}</TableCell>
                          <TableCell>{user.sessions}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <div className="bg-[#94A3B7] p-2 rounded-lg">
                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="rounded px-2 py-1 text-white font-semibold text-sm">{user.lastLogin}</span>
                              </div>
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm">
                      Showing {startIdx + 1}-{Math.min(endIdx, allUsers.length)} from {allUsers.length} data
                    </span>
                    <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
                      {Array.from({ length: totalUserPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`w-7 h-7 rounded-full ${userPage === i + 1 ? "bg-gray-300 dark:text-white" : ""} text-black dark:text-white`}
                          onClick={() => setUserPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      </div>
    </div>
  )
}
