import { useState } from "react";
import { DonutChart } from "../../../components/charts/donutChart";
import { Card } from "../../../components/ui/card";
import usersLine from "../../../assets/users-line.svg"
import HorizontalBarChart from "../../../components/charts/barChart";

import click from '../../../assets/click.svg'
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

import { FaChevronUp } from "react-icons/fa6";
import { FaChevronDown } from "react-icons/fa6";
import { RiEqualizer2Line } from "react-icons/ri";

export default function Analytics() {
  return (
    <div>
      {/* donut chart */}
       <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex px-8">
            <p className="text-3xl">Registration insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <img src={usersLine} alt="users" className="w-10 h-10 dark:text-white" />
              <p className="text-lg text-[#64748A] dark:text-white">Total number of registered users</p>
              </div>

              <DonutChart />
              </div>
            </div>
          </Card>
        </Card>
      </div>
      {/* bar chart */}
       <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Click insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <img src={click} alt="users" className="w-10 h-10 dark:text-white" />
              <p className="text-lg text-[#64748A] dark:text-white">Total clicks on Sign-up form</p>
              </div>

              <HorizontalBarChart/>
              </div>
            </div>
          </Card>
        </Card>
      </div>

      {/* activity */}
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
            {(() => {
              // Mock activity data
              const allActivities = Array.from({ length: 16 }, (_, idx) => ({
                name: "John Doe",
                status: idx % 2 === 0 ? "Online" : "Offline",
                activity: idx % 2 === 0 ? "Logged in" : "Signed up",
                lastGame: idx % 2 === 0 ? "War Shooting" : "Temple Run",
                start: idx % 2 === 0 ? "09:34" : "10:34",
                end: idx % 2 === 0 ? "12:59" : "13:45",
              }));
              const activitiesPerPage = 5;
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [activityPage, setActivityPage] = useState(1);
              const totalActivityPages = Math.ceil(allActivities.length / activitiesPerPage);
              const startIdx = (activityPage - 1) * activitiesPerPage;
              const endIdx = startIdx + activitiesPerPage;
              const activitiesToShow = allActivities.slice(startIdx, endIdx);

              return (
                <>
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
                      {activitiesToShow.map((row, idx) => (
                        <TableRow key={idx} className="font-pincuk">
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            <span
                              className={`flex items-center gap-2 px-1 py-1 rounded-lg font-pincuk text-sm ${
                                row.status === "Online"
                                  ? "bg-[#4BA366] text-white"
                                  : "bg-[#D3D8DF] text-white"
                              }`}
                              style={{ width: "60px", justifyContent: "center" }}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  row.status === "Online" ? "bg-white" : "bg-[#E74C3C]"
                                }`}
                              />
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell>{row.activity}</TableCell>
                          <TableCell>{row.lastGame}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 bg-[#AEB8C6] rounded-lg px-2 py-1 w-fit font-pincuk text-sm text-white">
                              <span className="w-2 h-2 rounded-full bg-[#2ECC40]" />
                              {row.start}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2 bg-[#AEB8C6] rounded-lg px-2 py-1 w-fit font-pincuk text-sm text-white">
                              <span className="w-2 h-2 rounded-full bg-[#E74C3C]" />
                              {row.end}
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
                    <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
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
                </>
              );
            })()}
          </div>
        </Card>
      </div>

      {/* game activity */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full pl-4">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Game Activity</p>
          </div>
          {/* content */}
          {(() => {
            // Mock data for demonstration
            const allGames = Array.from({ length: 16 }, (_, idx) => ({
              img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=48&h=48",
              name: "War Shooting",
              totalPlays: idx % 3 === 0 ? 1467 : 541,
              avgPlayTime: idx % 3 === 0 ? 563 : 246,
              status: idx % 4 === 0 ? "Inactive" : "Active",
              popularity: idx % 2 === 0 ? "up" : "down",
            }));
            const gamesPerPage = 10;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [gamePage, setGamePage] = useState(1);
            const totalGamePages = Math.ceil(allGames.length / gamesPerPage);
            const startIdx = (gamePage - 1) * gamesPerPage;
            const endIdx = startIdx + gamesPerPage;
            const gamesToShow = allGames.slice(startIdx, endIdx);

            return (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="text-lg font-bold">
                      <TableHead>Game</TableHead>
                      <TableHead>Total Plays</TableHead>
                      <TableHead>Average Play Time</TableHead>
                      <TableHead>Game Status</TableHead>
                      <TableHead>Popularity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gamesToShow.map((game, idx) => (
                      <TableRow key={idx} className="font-pincuk">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img src={game.img} alt={game.name} className="w-12 h-12 rounded-lg object-cover" />
                            <span className="font-bold">{game.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{game.totalPlays}</TableCell>
                        <TableCell>{game.avgPlayTime}</TableCell>
                        <TableCell>
                          {game.status === "Active" ? (
                            <span className="inline-flex items-center gap-2 p-1 rounded bg-[#419E6A] text-white font-pincuk text-sm">
                              <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 p-1 rounded bg-[#CBD5E0] text-[#22223B] font-pincuk text-sm">
                              <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {game.popularity === "up" ? (
                            <span className="text-green-500 text-2xl"><FaChevronUp /></span>
                          ) : (
                            <span className="text-red-500 text-2xl"><FaChevronDown /></span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4 pr-4">
                  <span className="text-sm">
                    Showing {startIdx + 1}-{Math.min(endIdx, allGames.length)} from {allGames.length} data
                  </span>
                  <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF] dark:text-white">
                    {Array.from({ length: totalGamePages }, (_, i) => (
                      <button
                        key={i + 1}
                        className={`w-7 h-7 rounded-full ${gamePage === i + 1 ? "bg-[#D946EF] text-white dark:bg-gray-400" : "bg-transparent text-[#D946EF] dark:text-gray-400 hover:bg-[#f3e8ff]"}`}
                        onClick={() => setGamePage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </Card>
      </div>
    </div>
  )
}
