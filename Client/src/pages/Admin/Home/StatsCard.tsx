/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaRegClock, FaRegStar } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { IoHourglassOutline, IoGameControllerOutline } from "react-icons/io5";
import { TbCalendarClock } from "react-icons/tb";
import {
  HiMiniArrowDown,
  HiMiniArrowUp,
  HiOutlineUsers,
} from "react-icons/hi2";
import { useDashboardAnalytics } from "../../../backend/analytics.service";
import { Card } from "../../../components/ui/card";

import { formatTime } from "../../../utils/main";

export default function StatsCard() {
  const {
    data: dashboardAnalytics,
    isError,
    isLoading,
  } = useDashboardAnalytics();

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
  const cardData = [
    {
      title: "Unique Users",
      value: data.totalUsers.current,
      icon: <FaRegUser size={32} />,
      change: `${data.totalUsers.percentageChange ?? 0}%`,
      changeType: data.totalUsers.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Registered Users",
      value: data.totalRegisteredUsers.current,
      icon: <HiOutlineUsers size={32} />,
      change: `${data.totalRegisteredUsers.percentageChange ?? 0}%`,
      changeType:
        data.totalRegisteredUsers.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Total Games",
      value: data.totalGames.current,
      icon: <IoGameControllerOutline size={32} />,
      change: `${data.totalGames.percentageChange ?? 0}%`,
      changeType: data.totalGames.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Sessions",
      value: data.totalSessions.current,
      icon: <TbCalendarClock size={36} />,
      change: `${data.totalSessions.percentageChange ?? 0}%`,
      changeType: data.totalSessions.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Time played",
      value: formatTime(data.totalTimePlayed.current),
      icon: <FaRegClock size={32} className="dark:text-white" />,
      change: `${data.totalTimePlayed.percentageChange ?? 0}%`,
      changeType: data.totalTimePlayed.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Most Played",
      value: data.mostPlayedGame?.title ?? "No games played",
      icon: <FaRegStar size={32} />,
      change: `${data.mostPlayedGame?.percentageChange ?? 0}%`,
      changeType: data.mostPlayedGame?.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "User Retention",
      value: `${Math.round(data.retentionRate) ?? 0}%`,
      icon: <TbCalendarClock size={36} />,
      change: "0%",
      changeType: "up",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
    {
      title: "Avg. Session Duration",
      value: formatTime(data.avgSessionDuration.current),
      icon: <IoHourglassOutline size={32} />,
      change: `${data.avgSessionDuration.percentageChange ?? 0}%`,
      changeType: data.avgSessionDuration.percentageChange >= 0 ? "up" : "down",
      description: "Over the last 24 hours",
      color: "text-[#D946EF] dark:text-[#F0ABFC]",
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {card.value}
                </div>
              </div>
              <span className="text-3xl text-[#64748A] dark:text-white">
                {card.icon}
              </span>
            </div>

            {/* bottom */}
            <div className="flex md:flex-1 justify-between items-end pr-2 gap-2 min-h-[24px]">
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
              <span className="text-gray-400 text-[13px] font-worksans tracking-wider dark:text-white lg:line-clamp-2 lg:w-[100px] leading-4 text-right flex-shrink min-w-0">
                {card.description}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
