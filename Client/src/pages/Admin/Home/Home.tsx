import { FaRegClock, FaRegStar } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { IoGameControllerOutline } from "react-icons/io5";
import { IoHourglassOutline } from "react-icons/io5";
import { PopUpSheet } from "../../../components/single/PopUp-Sheet";


// import sessionIcon from '../../../assets/session-icon.svg'
// import users from '../../../assets/users.svg'
import click from '../../../assets/click.svg'
import { HiOutlineUsers } from "react-icons/hi2";
import { TbCalendarClock } from "react-icons/tb";

import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import  PieChart from "../../../components/charts/piechart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import React, { useState } from "react";
// import LineChart from "../../../components/charts/LineChart";

const cardData = [
  {
    title: "Total Users",
    value: "389",
    icon: <FaRegUser size={32} />,
    change: "+9%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "Registered Users",
    value: "456",
    icon: <HiOutlineUsers size={32} />,
    change: "+7%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "Total Games",
    value: "200",
    icon: <IoGameControllerOutline size={32} />,
    change: "-10%",
    changeType: "down",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "Sessions",
    value: "100",
    icon: <TbCalendarClock size={36} />,
    change: "+9%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "Time played",
    value: "600 minutes",
    icon: <FaRegClock size={32} className="dark:text-white" />,
    change: "+9%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "Most Played",
    value: "War shooting",
    icon: <FaRegStar size={32} />,
    change: "+2%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "User Retention",
    value: "43%",
    icon: <TbCalendarClock size={36} />,
    change: "-4%",
    changeType: "down",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
  {
    title: "Avg. Session Duration",
    value: "12 min 5s",
    icon: <IoHourglassOutline size={32} />,
    change: "+1.3min",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF] dark:text-[#F0ABFC]",
  },
];

export default function Home() {
  // Mock data for 20 games
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const allGames = Array.from({ length: 20 }, (_, _idx) => ({
    name: "War Shooting",
    plays: 289,
    minutes: 400,
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=48&h=48"
  }));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 5;
  // const totalPages = Math.ceil(allGames.length / gamesPerPage);

  // For page 2, only show 2 games as requested
  const getGamesForPage = (page: number) => {
    const startIdx = (page - 1) * gamesPerPage;
    const endIdx = startIdx + gamesPerPage;
    return allGames.slice(startIdx, endIdx);
  };

  const gamesToShow = getGamesForPage(currentPage);
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
      {cardData.map((card, idx) => (
        <div
          key={idx}
          className="dark:bg-[#334154] bg-[#F1F5F9] rounded-xl p-6 flex flex-col gap-2"
        >
          <div className="tracking-widest">

        {/* left */}
            <div className="flex justify-between mb-6">
            <div className="">
            <span className="font-semibold text-lg text-[#64748A] dark:text-white">{card.title}</span>
            <div className={`font-bold text-2xl ${card.color}`}>{card.value}</div>
            </div>
            
            <span className="text-3xl text-[#64748A] dark:text-white">{card.icon}</span>
            </div>

        {/* right */}
            <div className="flex justify-between items-center">
            <span
              className={`${
                card.changeType === "up" ? "text-white bg-[#D946EF] pl-2 pr-2 pt-1 pb-1 rounded-lg dark:bg-[#64748A]" : "text-white bg-[#D946EF] dark:bg-[#64748A] pl-2 pr-2 pt-1 pb-1 rounded-lg"
              }`}
            >
              {card.changeType === "up" ? "↑" : "↓"} {card.change}
            </span>
            <span className="text-gray-400 text-sm font-pincuk dark:text-white">{card.description}</span>
            </div>
          </div>
        </div>
      ))}
      {/* pop up */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl dark:text-[#D946EF]">Dynamic Popup System</p>
            <PopUpSheet>
              <Button className="bg-[#D946EF] hover:text-[#D946EF] hover:bg-[#F3E8FF] dark:text-white">
                Create New Pop-up
              </Button>
            </PopUpSheet>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="justify-end flex flex-col p-3 space-y-4">
              <p className="text-lg">User View</p>
              <p className="text-lg">Pop-Up will appear after 3 seconds</p>
              <Button className="w-32 bg-[#D946EF] hover:text-[#D946EF] hover:bg-[#F3E8FF] dark:text-white">Show Pop-up Now</Button>
            </div>
          </Card>
        </Card>
      </div>

      {/* insights */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Click insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <img src={click} alt="click" className="w-10 h-10 dark:text-white" />
              <p className="text-lg text-[#64748A] dark:text-white">Total clicks on Sign-up form</p>
              </div>

              <PieChart/>
              </div>
            </div>
          </Card>
        </Card>
      </div>

      {/* most played */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
         
          <div className="flex justify-between p-4 text-3xl">
            <p className="text-3xl dark:text-[#D946EF]">Most Played Games</p>
            {/* <p className="text-xl">View All</p> */}
          </div>
          {/* table */}
          <div className="px-4 pb-4">
           
            <Table>
              <TableHeader>
                <TableRow className="text-xl text-[]">
                  <TableHead>Game</TableHead>
                  <TableHead>Total Plays</TableHead>
                  <TableHead>Minutes played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gamesToShow.map((game, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={game.img}
                          alt="game"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <span className="font-semibold text-lg">{game.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans">{game.plays}</TableCell>
                    <TableCell className="font-sans">{game.minutes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">
                Showing {currentPage === 2 ? "6-7" : `${(currentPage - 1) * gamesPerPage + 1}-${Math.min(currentPage * gamesPerPage, allGames.length)}`} from {allGames.length} data
              </span>
              <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 border border-[#D946EF]">
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    className={`w-7 h-7 rounded-full ${currentPage === page ? "bg-gray-300" : ""} text-balck`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* peak */}
      {/* <div className="col-span-1 md:col-span-2 lg:col-span-4"> */}
        {/* <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full"> */}
          {/* content */}
          {/* <LineChart/>
        </Card>
      </div> */}

      {/* recent */}
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
              const allUsers = Array.from({ length: 20 }, (_, _idx) => ({
                name: "John Doe",
                email: "john@email.com",
                registration: "12/08/2025",
                games: 34,
                time: "120 minutes",
                sessions: 20,
                lastLogin: "16:59"
              }));
              const usersPerPage = 5;
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
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Games Played</TableHead>
                        <TableHead>Time Played</TableHead>
                        <TableHead>Session count</TableHead>
                        <TableHead>Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersToShow.map((user, idx) => (
                        <TableRow key={idx} className="font-sans">
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.registration}</TableCell>
                          <TableCell>{user.games}</TableCell>
                          <TableCell>{user.time}</TableCell>
                          <TableCell>{user.sessions}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <div className="bg-[#94A3B7] p-2 rounded-lg">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
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
  );
}
