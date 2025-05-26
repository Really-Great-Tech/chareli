import { useState, useMemo } from "react";

// UI Components
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { PopUpSheet } from "../../../components/single/PopUp-Sheet";
import { AcceptInvitationModal } from "../../../components/modals/AdminModals/AcceptInvitationModal";
import PieChart from "../../../components/charts/piechart";

// Icons
import { FaRegClock, FaRegStar } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { IoGameControllerOutline, IoHourglassOutline } from "react-icons/io5";
import { HiOutlineUsers, HiMiniArrowDownLeft, HiMiniArrowUpRight } from "react-icons/hi2";
import { TbCalendarClock } from "react-icons/tb";

// Assets
import click from '../../../assets/click.svg';
import gameImg from "../../../assets/gamesImg/1.svg";

// Services & Utils
import { useGamesAnalytics, useUsersAnalytics, type GameAnalytics } from "../../../backend/analytics.service";
import { useSignupAnalyticsData } from "../../../backend/signup.analytics.service";

interface UserAnalytics {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoggedIn: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  analytics: {
    totalGamesPlayed: number;
    totalSessionCount: number;
    totalTimePlayed: number;
    mostPlayedGame: {
      gameId?: string;
      gameTitle?: string;
      sessionCount?: number;
    };
  };
}
import { formatTime } from "../../../utils/main";
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

  const [isAcceptInviteOpen, setIsAcceptInviteOpen] = useState(false);

  const { data: gamesWithAnalytics, isLoading: gamesLoading } = useGamesAnalytics();
  const { data: usersWithAnalytics, isLoading: usersLoading } = useUsersAnalytics();
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 5;

  // Sort users by lastLoggedIn (most recent first)
  const allUsers = useMemo<UserAnalytics[]>(() => {
    if (!usersWithAnalytics) return [];
    return [...usersWithAnalytics].sort((a, b) => 
      new Date(b.lastLoggedIn).getTime() - new Date(a.lastLoggedIn).getTime()
    );
  }, [usersWithAnalytics]);

  const getUsersForPage = (page: number) => {
    const startIdx = (page - 1) * usersPerPage;
    const endIdx = startIdx + usersPerPage;
    return allUsers.slice(startIdx, endIdx);
  };

  const usersToShow = getUsersForPage(userPage);
  const totalUserPages = Math.ceil(allUsers.length / usersPerPage);

  // Sort games by total sessions (most played first)
  const allGames = useMemo<GameAnalytics[]>(() => {
    if (!gamesWithAnalytics) return [];
    return [...gamesWithAnalytics].sort((a, b) => 
      (b.analytics?.totalSessions || 0) - (a.analytics?.totalSessions || 0)
    );
  }, [gamesWithAnalytics]);

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
    <div>
      {/* <div className="px-6 pb-3">
        <Button className="bg-[#D946EF] text-white" onClick={() => setIsAcceptInviteOpen(true)}>Invite</Button>
      </div> */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            className="dark:bg-[#334154] bg-[#F1F5F9] rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="tracking-widest">

              {/* top */}
              <div className="flex justify-between mb-6">
                <div className="">
                  <span className="font-semibold text-[#64748A] dark:text-white text-base">{card.title}</span>
                  <div className={`font-bold text-xl ${card.color}`}>{card.value}</div>
                </div>

                <span className="text-3xl text-[#64748A] dark:text-white">{card.icon}</span>
              </div>

              {/* bottom */}
              <div className="flex md:flex-1 justify-between items-center pr-2">

                <div className={`flex flex-row gap-1 items-center text-[14px] ${card.changeType === "up" ? "text-white bg-[#D946EF] pl-1 pr-1 pt-1 pb-1 rounded-lg dark:bg-[#64748A]" : "text-white bg-[#D946EF] dark:bg-[#64748A] pl-2 pr-2 pt-1 pb-1 rounded-lg"
                  }`}>
                  {card.changeType === "up" ? <HiMiniArrowUpRight /> : <HiMiniArrowDownLeft />}
                  <span
                    className={``}
                  >
                    {card.change}
                  </span>
                </div>

                <span className="text-gray-400 text-[10px] font-pincuk dark:text-white">{card.description}</span>
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
                  
                  <SignupClickInsights />
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
                  {gamesLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : gamesToShow.map((game, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
            src={game.thumbnailFile?.url || gameImg}
                            alt={game.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <span className="font-semibold text-lg">{game.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans">{game.analytics?.totalSessions || 0}</TableCell>
                      <TableCell className="font-sans">{formatTime(game.analytics?.totalPlayTime || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm">
                  Showing {currentPage === 2 ? "6-7" : `${(currentPage - 1) * gamesPerPage + 1}-${Math.min(currentPage * gamesPerPage, allGames.length)}`} from {allGames.length} data
                </span>
                <div className="flex items-center gap-2 rounded-full space-x-4 border border-[#D946EF]">
                  {[1, 2, 3, 4].map((page) => (
                    <button
                      key={page}
                      className={`w-10 h-10 rounded-full ${currentPage === page ? "bg-gray-300" : ""} text-balck`}
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
              {/* Recent User Activity Table */}
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
                        {usersLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                          </TableRow>
                        ) : usersToShow.map((user, idx) => (
                          <TableRow key={idx} className="font-sans">
                            <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{user.analytics.totalGamesPlayed}</TableCell>
                            <TableCell>{formatTime(user.analytics.totalTimePlayed)}</TableCell>
                            <TableCell>{user.analytics.totalSessionCount}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <div className="bg-[#94A3B7] p-2 rounded-lg">
                                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                                  <span className="rounded px-2 py-1 text-white font-semibold text-sm">
                                    {new Date(user.lastLoggedIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        Showing {(userPage - 1) * usersPerPage + 1}-{Math.min(userPage * usersPerPage, allUsers.length)} from {allUsers.length} data
                      </span>
                      <div className="flex items-center gap-2 rounded-full space-x-4 border border-[#D946EF] dark:text-white">
                        {Array.from({ length: totalUserPages }, (_, i) => (
                          <button
                            key={i + 1}
                            className={`w-11 h-11 rounded-full ${userPage === i + 1 ? "bg-gray-300 dark:text-white" : ""} text-black dark:text-white`}
                            onClick={() => setUserPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
            </div>
          </Card>
        </div>
      </div>

      <AcceptInvitationModal open={isAcceptInviteOpen} onOpenChange={setIsAcceptInviteOpen} isExistingUser={true} />
    </div>
  );
}

// Separate component for signup click insights
function SignupClickInsights() {
  const { data: signupAnalytics, isLoading: analyticsLoading } = useSignupAnalyticsData();
  const { data: usersWithAnalytics, isLoading: usersLoading } = useUsersAnalytics();
  
  if (analyticsLoading || usersLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  if (!signupAnalytics || !usersWithAnalytics) {
    return <div className="text-center py-4">No data available</div>;
  }

  // Total registered users is the verified count
  const verifiedCount = usersWithAnalytics.length;
  const didntRegisterCount = signupAnalytics.totalClicks - verifiedCount;

  const chartData = [
    { name: "Didn't register", value: didntRegisterCount, fill: "#F3C7FA" },
    { name: "Verified users", value: verifiedCount, fill: "#D24CFB" }
  ];

  return <PieChart data={chartData} />;
}
