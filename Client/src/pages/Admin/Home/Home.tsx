import click from '../../../assets/click.svg'
import { Card } from "../../../components/ui/card";
import { AcceptInvitationModal } from "../../../components/modals/AdminModals/AcceptInvitationModal";
import { DashboardTimeFilter } from "../../../components/single/DashboardTimeFilter";
import { DashboardCountryFilter } from "../../../components/single/DashboardCountryFilter";
import StatsCard from "./StatsCard";
import PieChart from '../../../components/charts/piechart';
import { useState } from 'react';
import { useSignupAnalyticsData } from '../../../backend/signup.analytics.service';
import { useDashboardAnalytics, type DashboardTimeRange } from '../../../backend/analytics.service';
import { MostPlayedGames } from './MostPlayedGames';
import { usePermissions } from '../../../hooks/usePermissions';
// import { RecentUserActivity } from './RecentUserActivity';

export default function Home() {
  const permissions = usePermissions();
  const [isAcceptInviteOpen, setIsAcceptInviteOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>({ period: 'last24hours' });
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  return (
    <div>
      <div className="px-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          {permissions.canFilter && (
            <div className="flex flex-col sm:flex-row gap-2">
              <DashboardTimeFilter 
                value={timeRange} 
                onChange={setTimeRange} 
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
        <StatsCard filters={{ timeRange, countries: countryFilter }} />

        {/* insights */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6 mt-6">
          <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
            <div className="flex p-3">
              <p className="text-lg sm:text-2xl">Click insights</p>
            </div>
            {/* inner card */}
            <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
              <div className="flex flex-col space-y-8">

                <div className="">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <img src={click} alt="click" className="w-8 h-8 sm:w-10 sm:h-10 dark:text-white flex-shrink-0" />
                    <p className="text-sm sm:text-lg text-[#64748A] dark:text-white">Total clicks on Sign-up button</p>
                  </div>
                  
                  <SignupClickInsights />
                </div>
              </div>
            </Card>
          </Card>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6">
          <MostPlayedGames />
        </div>

        {/* <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6">
          <RecentUserActivity />
        </div> */}
      </div>

      <AcceptInvitationModal open={isAcceptInviteOpen} onOpenChange={setIsAcceptInviteOpen} isExistingUser={true} />
    </div>
  );
}

// Separate component for signup click insights
function SignupClickInsights() {
  const { data: signupAnalytics, isLoading: analyticsLoading } = useSignupAnalyticsData(30);
  // const { data: usersWithAnalytics, isLoading: usersLoading } = useUsersAnalytics();
  const { data: dashboardAnalytics, isLoading: usersLoading } = useDashboardAnalytics();
  
  if (analyticsLoading || usersLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  if (!signupAnalytics || !dashboardAnalytics) {
    return <div className="text-center py-4">No data available</div>;
  }

  const verifiedCount = dashboardAnalytics?.totalRegisteredUsers?.registered || 0;
  
  // Calculate total clicks from individual click types, excluding signup-modal
  const allowedClickTypes = ['navbar', 'keep-playing'];
  const totalClicks = signupAnalytics?.clicksByType
    ?.filter(click => allowedClickTypes.includes(click.type))
    ?.reduce((sum, click) => sum + parseInt(click.count), 0) || 0;

  const didntRegisterCount = Math.max(0, totalClicks - verifiedCount);

  const chartData = [
    { name: "Didn't verify", value: didntRegisterCount, fill: "#F3C7FA" },
    { name: "Verified users", value: verifiedCount, fill: "#D24CFB" }
  ];

  return <PieChart data={chartData} />;
}
