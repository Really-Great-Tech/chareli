import {
  useDashboardAnalytics,
  type DashboardFilters,
} from '../../backend/analytics.service';
import { Card } from '../ui/card';
import { HiOutlineUsers } from 'react-icons/hi2';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface UserTypeBreakdownProps {
  filters?: DashboardFilters;
}

export function UserTypeBreakdown({ filters }: UserTypeBreakdownProps) {
  const { data: dashboardData, isLoading } = useDashboardAnalytics(filters);

  if (isLoading) {
    return (
      <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
        <div className="p-4">Loading user type breakdown...</div>
      </Card>
    );
  }

  if (!dashboardData?.userTypeBreakdown) {
    return null;
  }

  const breakdown = dashboardData.userTypeBreakdown;

  // Data for session breakdown
  const sessionData = [
    {
      name: 'Authenticated',
      value: breakdown.authenticatedSessions,
      percentage: breakdown.authenticatedSessionsPercentage,
      fill: '#475568',
    },
    {
      name: 'Anonymous',
      value: breakdown.anonymousSessions,
      percentage: breakdown.anonymousSessionsPercentage,
      fill: '#94A3B8',
    },
  ];

  // Data for time played breakdown
  const timeData = [
    {
      name: 'Authenticated',
      value: breakdown.authenticatedTimePlayed,
      percentage: breakdown.authenticatedTimePercentage,
      fill: '#475568',
    },
    {
      name: 'Anonymous',
      value: breakdown.anonymousTimePlayed,
      percentage: breakdown.anonymousTimePercentage,
      fill: '#94A3B8',
    },
  ];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {payload[0].payload.name === 'Authenticated' ||
            payload[0].payload.name === 'Anonymous'
              ? `${payload[0].value.toLocaleString()} sessions`
              : formatTime(payload[0].value)}
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
      <div className="p-3">
        <div className="flex items-center gap-3 mb-4">
          <HiOutlineUsers
            size={32}
            className="text-[#64748A] dark:text-white"
          />
          <div>
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold">
              User Type Breakdown
            </p>
            <p className="text-sm text-[#64748A] dark:text-gray-400">
              Authenticated vs Anonymous visitors
            </p>
          </div>
        </div>

        <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sessions Breakdown */}
            <div>
              <h4 className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300 text-center">
                Sessions by User Type
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sessionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.percentage.toFixed(1)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {sessionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value, entry: any) => (
                      <span className="text-sm dark:text-white">
                        {value}: {entry.payload.value.toLocaleString()}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Time Played Breakdown */}
            <div>
              <h4 className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300 text-center">
                Time Played by User Type
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={timeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.percentage.toFixed(1)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {timeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value, entry: any) => (
                      <span className="text-sm dark:text-white">
                        {value}: {formatTime(entry.payload.value)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(
                    breakdown.authenticatedSessions +
                    breakdown.anonymousSessions
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(
                    breakdown.authenticatedTimePlayed +
                      breakdown.anonymousTimePlayed
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
