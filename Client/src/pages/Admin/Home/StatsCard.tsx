/* eslint-disable @typescript-eslint/no-explicit-any */
import { Clock, Star, Hourglass, CalendarClock, Users, ArrowUp, ArrowDown } from 'lucide-react';
import {
  useDashboardAnalytics,
  type DashboardFilters,
} from '../../../backend/analytics.service';
import { Card } from '../../../components/ui/card';

import { formatTime } from '../../../utils/main';

interface StatsCardProps {
  filters?: DashboardFilters;
}

export default function StatsCard({ filters }: StatsCardProps) {
  const {
    data: dashboardAnalytics,
    isError,
    isLoading,
  } = useDashboardAnalytics(filters);

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
    const timeRange = filters?.timeRange;
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
      title: 'New Verified Users',
      value: data.totalRegisteredUsers.current,
      icon: <Users size={32} />,
      change: `${data.totalRegisteredUsers.percentageChange ?? 0}%`,
      changeType:
        data.totalRegisteredUsers.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Daily Active Users',
      value: data.dailyActiveUsers.current,
      icon: <Users size={32} />,
      change: '24h only',
      changeType: 'up',
      description: 'Always last 24 hours',
      color: 'text-[#64748A] dark:text-white',
      isStatic: true, // No percentage change
    },
    {
      title: 'Daily Anonymous Visitors',
      value: data.dailyAnonymousVisitors.current,
      icon: <Users size={32} />,
      change: '24h only',
      changeType: 'up',
      description: 'Anonymous users (24h)',
      color: 'text-[#64748A] dark:text-white',
      isStatic: true, // No percentage change
    },
    {
      title: 'Total Visitors',
      value: data.totalVisitors.current,
      icon: <Users size={32} />,
      change: `${data.totalVisitors.percentageChange ?? 0}%`,
      changeType: data.totalVisitors.percentageChange >= 0 ? 'up' : 'down',
      description: 'Auth + Anonymous',
      color: 'text-[#64748A] dark:text-white',
    },

    {
      title: 'Total Time played',
      value: formatTime(data.totalTimePlayed.current),
      icon: <Clock size={32} className="dark:text-white" />,
      change: `${data.totalTimePlayed.percentageChange ?? 0}%`,
      changeType: data.totalTimePlayed.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Sessions Played',
      value: data.totalSessions.current,
      icon: <CalendarClock size={36} />,
      change: `${data.totalSessions.percentageChange ?? 0}%`,
      changeType: data.totalSessions.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Average Session Time',
      value: formatTime(data.avgSessionDuration.current),
      icon: <Hourglass size={32} />,
      change: `${data.avgSessionDuration.percentageChange ?? 0}%`,
      changeType: data.avgSessionDuration.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Anonymous Sessions',
      value: data.anonymousSessions.current,
      icon: <CalendarClock size={36} />,
      change: `${data.anonymousSessions.percentageChange ?? 0}%`,
      changeType: data.anonymousSessions.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Anonymous Time Played',
      value: formatTime(data.anonymousTimePlayed.current),
      icon: <Clock size={32} className="dark:text-white" />,
      change: `${data.anonymousTimePlayed.percentageChange ?? 0}%`,
      changeType:
        data.anonymousTimePlayed.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Most Played Games',
      value:
        data.mostPlayedGames?.games?.length > 0
          ? data.mostPlayedGames.games
          : 'No games played',
      icon: <Star size={32} />,
      change: `${data.mostPlayedGames?.percentageChange ?? 0}%`,
      changeType:
        (data.mostPlayedGames?.percentageChange ?? 0) >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
      isGamesList: true,
    },
    {
      title: 'Game Coverage',
      value: `${data.gameCoverage.current}%`,
      icon: <Star size={32} />,
      change: `${data.gameCoverage.percentageChange ?? 0}%`,
      changeType: data.gameCoverage.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'Total Active Users',
      value: data.totalActiveUsers.current,
      icon: <Users size={32} />,
      change: `${data.totalActiveUsers.percentageChange ?? 0}%`,
      changeType: data.totalActiveUsers.percentageChange >= 0 ? 'up' : 'down',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
    {
      title: 'User Retention',
      value: `${Math.round(data.retentionRate) ?? 0}%`,
      icon: <CalendarClock size={36} />,
      change: '0%',
      changeType: 'up',
      description: timeDescription,
      color: 'text-[#64748A] dark:text-white',
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
                      {card.value
                        .slice(0, 3)
                        .map((game: any, index: number) => {
                          const getRankIcon = (position: number) => {
                            switch (position) {
                              case 0:
                                return (
                                  <span className="text-yellow-500">🥇</span>
                                );
                              case 1:
                                return (
                                  <span className="text-gray-400">🥈</span>
                                );
                              case 2:
                                return (
                                  <span className="text-amber-600">🥉</span>
                                );
                              default:
                                return (
                                  <span className="text-xs opacity-75">
                                    {position + 1}.
                                  </span>
                                );
                            }
                          };

                          return (
                            <div
                              key={game.id || index}
                              className="text-sm font-medium leading-tight flex items-center gap-1"
                            >
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
                  card.changeType === 'up'
                    ? 'text-white bg-[#475568] pl-1 pr-1 pt-1 pb-1 rounded-lg dark:bg-[#64748A]'
                    : 'text-white bg-[#475568] dark:bg-[#64748A] pl-2 pr-2 pt-1 pb-1 rounded-lg'
                }`}
              >
                {card.changeType === 'up' ? (
                  <ArrowUp />
                ) : (
                  <ArrowDown />
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
