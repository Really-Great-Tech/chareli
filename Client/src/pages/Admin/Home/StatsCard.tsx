/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaRegClock, FaRegStar } from "react-icons/fa";
import { IoHourglassOutline } from "react-icons/io5";
import { TbCalendarClock } from "react-icons/tb";
import {
  HiMiniArrowDown,
  HiMiniArrowUp,
  HiOutlineUsers,
} from "react-icons/hi2";
import { useDashboardAnalytics, type DashboardTimeRange } from "../../../backend/analytics.service";
import { Card } from "../../../components/ui/card";

import { formatTime } from "../../../utils/main";

interface StatsCardProps {
  timeRange?: DashboardTimeRange;
}

export default function StatsCard({ timeRange }: StatsCardProps) {
  const {
    data: dashboardAnalytics,
    isError,
    isLoading,
  } = useDashboardAnalytics(timeRange);

  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="p-4">Loading dashboard data...</div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="p-4 text-red-500">Error loading dashboard data</div>
        </Card>
      </div>
    );
  }

  const data = dashboardAnalytics as any;
  
  // Generate dynamic description based on time range
  const getTimeRangeDescription = () => {
    switch (timeRange?.period) {
      case 'last7days':
        return 'Over the last 7 days';
      case 'last30days':
        return 'Over the last 30 days';
      case 'custom':
        if (timeRange.startDate) {
          const start = new Date(timeRange.startDate).toLocaleDateString();
          if (timeRange.endDate) {
            const end = new Date(timeRange.endDate).toLocaleDateString();
            return `From ${start} to ${end}`;
          } else {
            return `From ${start} to present`;
          }
        }
        return 'Custom date range';
      default:
        return 'Over the last 24 hours';
    }
  };

  const timeDescription = getTimeRangeDescription();

  const cardData = [
    {
      title: "New Verified Users",
      value: data.totalRegisteredUsers.current,
      icon: <HiOutlineUsers size={32} />,
      change: `${data.totalRegisteredUsers.percentageChange ?? 0}%`,
      changeType:
        data.totalRegisteredUsers.percentageChange >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Daily Active Users",
      value: data.dailyActiveUsers.current,
      icon: <HiOutlineUsers size={32} />,
      change: "24h only",
      changeType: "up",
      description: "Always last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
      isStatic: true, // No percentage change
    },
    {
      title: "Total Time played",
      value: formatTime(data.totalTimePlayed.current),
      icon: <FaRegClock size={32} className="dark:text-white" />,
      change: `${data.totalTimePlayed.percentageChange ?? 0}%`,
      changeType: data.totalTimePlayed.percentageChange >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Sessions Played",
      value: data.totalSessions.current,
      icon: <TbCalendarClock size={36} />,
      change: `${data.totalSessions.percentageChange ?? 0}%`,
      changeType: data.totalSessions.percentageChange >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Average Session Time",
      value: formatTime(data.avgSessionDuration.current),
      icon: <IoHourglassOutline size={32} />,
      change: `${data.avgSessionDuration.percentageChange ?? 0}%`,
      changeType: data.avgSessionDuration.percentageChange >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },  
    {
      title: "Most Played Games",
      value: data.mostPlayedGames?.games?.length > 0 
        ? data.mostPlayedGames.games
        : "No games played",
      icon: <FaRegStar size={32} />,
      change: `${data.mostPlayedGames?.percentageChange ?? 0}%`,
      changeType: (data.mostPlayedGames?.percentageChange ?? 0) >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
      isGamesList: true,
    },
    {
      title: "Game Coverage",
      value: `${data.gameCoverage.current}%`,
      icon: <FaRegStar size={32} />,
      change: `${data.gameCoverage.percentageChange ?? 0}%`,
      changeType: data.gameCoverage.percentageChange >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Total Active Users",
      value: data.totalActiveUsers.current,
      icon: <HiOutlineUsers size={32} />,
      change: `${data.totalActiveUsers.percentageChange ?? 0}%`,
      changeType: data.totalActiveUsers.percentageChange >= 0 ? "up" : "down",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "User Retention",
      value: `${Math.round(data.retentionRate) ?? 0}%`,
      icon: <TbCalendarClock size={36} />,
      change: "0%",
      changeType: "up",
      description: timeDescription,
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cardData.map((card, idx) => (
        <div
          key={idx}
          className="dark:bg-[#334154] bg-[#F1F5F9] rounded-xl p-4"
        >
          <div className="tracking-widest h-full flex flex-col">
            {/* top */}
            <div className="flex justify-between mb-6">
              <div className="">
                <span className="font-semibold text-[#64748A] dark:text-white text-base">
                  {card.title}
                </span>
                <div className={`font-bold text-xl ${card.color}`}>
                  {card.isGamesList && Array.isArray(card.value) ? (
                    <div className="space-y-1">
                      {card.value.slice(0, 3).map((game: any, index: number) => {
                        const getRankIcon = (position: number) => {
                          switch (position) {
                            case 0: return <span className="text-yellow-500">🥇</span>;
                            case 1: return <span className="text-gray-400">🥈</span>;
                            case 2: return <span className="text-amber-600">🥉</span>;
                            default: return <span className="text-xs opacity-75">{position + 1}.</span>;
                          }
                        };
                        
                        return (
                          <div key={game.id || index} className="text-sm font-medium leading-tight flex items-center gap-1">
                            {getRankIcon(index)}
                            <span className="truncate">{game.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    card.value
                  )}
                </div>
              </div>
              <span className="text-3xl text-[#64748A] dark:text-white">
                {card.icon}
              </span>
            </div>

            {/* bottom */}
            <div className="flex md:flex-1 justify-between items-center pr-2 gap-3 min-h-[32px]">
              <div
                className={`flex flex-row gap-1 items-center text-[14px] flex-shrink-0 ${
                  card.changeType === "up"
                    ? "text-white bg-[#D946EF] pl-1 pr-1 pt-1 pb-1 rounded-lg dark:bg-[#64748A]"
                    : "text-white bg-[#D946EF] dark:bg-[#64748A] pl-2 pr-2 pt-1 pb-1 rounded-lg"
                }`}
              >
                {card.changeType === "up" ? (
                  <HiMiniArrowUp />
                ) : (
                  <HiMiniArrowDown />
                )}
                <span>{card.change}</span>
              </div>
              <div className="text-gray-400 text-[12px] font-worksans tracking-wider dark:text-white leading-tight text-right flex-shrink min-w-0 max-w-[140px] break-words">
                {card.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
