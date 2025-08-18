import click from "../../../assets/click.svg";
import { Card } from "../../../components/ui/card";
import { AcceptInvitationModal } from "../../../components/modals/AdminModals/AcceptInvitationModal";
import { DashboardTimeFilter } from "../../../components/single/DashboardTimeFilter";
import { DashboardCountryFilter } from "../../../components/single/DashboardCountryFilter";
import StatsCard from "./StatsCard";
import PieChart from "../../../components/charts/piechart";
import { useState } from "react";
import { useSignupAnalyticsData } from "../../../backend/signup.analytics.service";
import {
  useDashboardAnalytics,
  type DashboardTimeRange,
} from "../../../backend/analytics.service";
import { MostPlayedGames } from "./MostPlayedGames";
import { usePermissions } from "../../../hooks/usePermissions";
// import { RecentUserActivity } from './RecentUserActivity';

export default function Home() {
  const permissions = usePermissions();
  const [isAcceptInviteOpen, setIsAcceptInviteOpen] = useState(false);
  // Separate state for stats cards filter
  const [statsTimeRange, setStatsTimeRange] = useState<DashboardTimeRange>({
    period: "last24hours",
  });
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  // Separate state for insights filter
  const [insightsTimeRange, setInsightsTimeRange] =
    useState<DashboardTimeRange>({ period: "last30days" });

  const { data: analyticsData } = useSignupAnalyticsData();
  return (
    <div>
      {/* stats cards */}
      <div className="px-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          {permissions.canFilter && (
            <div className="flex flex-col sm:flex-row gap-2">
              <DashboardTimeFilter
                value={statsTimeRange}
                onChange={setStatsTimeRange}
              />
              <DashboardCountryFilter
                value={countryFilter}
                onChange={setCountryFilter}
              />
            </div>
          )}
        </div>
      </div>
      <div className="px-6">
        <StatsCard
          filters={{ timeRange: statsTimeRange, countries: countryFilter }}
        />

        <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6 mt-6">
          <MostPlayedGames />
        </div>

        {/* insights */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6 mt-6">
          <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
            <div className="flex p-3 justify-between">
              <p className="text-lg sm:text-2xl">Click insights</p>
              <DashboardTimeFilter
                value={insightsTimeRange}
                onChange={setInsightsTimeRange}
              />
            </div>
            {/* inner card */}
            <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
              <div className="flex flex-col space-y-8">
                <div className="">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <img
                      src={click}
                      alt="click"
                      className="w-8 h-8 sm:w-10 sm:h-10 dark:text-white flex-shrink-0"
                    />
                    <p className="text-sm sm:text-lg text-[#64748A] dark:text-white">
                      Total clicks on Sign-up button (
                      {analyticsData?.totalClicks})
                    </p>
                  </div>

                  <SignupClickInsights timeRange={insightsTimeRange} />
                </div>
              </div>
            </Card>
          </Card>
        </div>

        {/* <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6">
          <RecentUserActivity />
        </div> */}
      </div>

      <AcceptInvitationModal
        open={isAcceptInviteOpen}
        onOpenChange={setIsAcceptInviteOpen}
        isExistingUser={true}
      />
    </div>
  );
}

// Separate component for signup click insights
function SignupClickInsights({ timeRange }: { timeRange: DashboardTimeRange }) {
  // Use the new filtering approach - pass only the time range filter
  const filters = { timeRange };

  const { data: signupAnalytics, isLoading: analyticsLoading } =
    useSignupAnalyticsData(filters);
  // const { data: usersWithAnalytics, isLoading: usersLoading } = useUsersAnalytics();
  const { data: dashboardAnalytics, isLoading: usersLoading } =
    useDashboardAnalytics(filters);

  if (analyticsLoading || usersLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!signupAnalytics || !dashboardAnalytics) {
    return <div className="text-center py-4">No data available</div>;
  }

  // For clicks insight, we need users who completed first login in the selected period
  // The dashboard API returns users who REGISTERED in the period, but we need users who FIRST LOGGED IN
  const registeredInPeriod =
    dashboardAnalytics?.totalRegisteredUsers?.current || 0;

  // Use the periodClicks from signup analytics (already filtered by time range)
  const totalClicks = signupAnalytics?.periodClicks || 0;

  // For now, use registered users as a proxy for verified users
  // This is the closest we can get with current data structure
  const verifiedCount = registeredInPeriod;
  const didntVerifyCount = Math.max(0, totalClicks - verifiedCount);

  const chartData = [
    { name: "Didn't verify", value: didntVerifyCount, fill: "#C17600" },
    { name: "Verified users", value: verifiedCount, fill: "#DC8B18" },
  ];

  return <PieChart data={chartData} totalClicks={totalClicks} />;
}

// // Separate component for signup click insights
// function SignupClickInsights({ filters }: { filters: { timeRange: DashboardTimeRange } }) {
//   // Use the new filter-based API for signup analytics
//   const signupFilters = {
//     timeRange: filters.timeRange
//   };

//   const { data: signupAnalytics, isLoading: analyticsLoading } = useSignupAnalyticsData(signupFilters);
//   const { data: dashboardAnalytics, isLoading: usersLoading } = useDashboardAnalytics({ timeRange: filters.timeRange });

//   if (analyticsLoading || usersLoading) {
//     return <div className="text-center py-4">Loading...</div>;
//   }

//   if (!signupAnalytics || !dashboardAnalytics) {
//     return <div className="text-center py-4">No data available</div>;
//   }

//   // For clicks insight, we need users who completed first login in the selected period
//   // The dashboard API returns users who REGISTERED in the period, but we need users who FIRST LOGGED IN
//   const registeredInPeriod = dashboardAnalytics?.totalRegisteredUsers?.current || 0;

//   // Use the periodClicks from signup analytics (already filtered by time range)
//   const totalClicks = signupAnalytics?.periodClicks || 0;

//   // For now, use registered users as a proxy for verified users
//   // This is the closest we can get with current data structure
//   const verifiedCount = registeredInPeriod;
//   const didntVerifyCount = Math.max(0, totalClicks - verifiedCount);

//   const chartData = [
//     { name: "Didn't verify", value: didntVerifyCount, fill: "#FFAA33" },
//     { name: "Verified users", value: verifiedCount, fill: "#C17600" }
//   ];

//   return <PieChart data={chartData} />;
// }
