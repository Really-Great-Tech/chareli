import click from '../../../assets/click.svg'
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { PopUpSheet } from "../../../components/single/PopUp-Sheet";
import { AcceptInvitationModal } from "../../../components/modals/AdminModals/AcceptInvitationModal";
import StatsCard from "./StatsCard";
import PieChart from '../../../components/charts/piechart';
import { useState } from 'react';
import { useSignupAnalyticsData } from '../../../backend/signup.analytics.service';
import { useDashboardAnalytics } from '../../../backend/analytics.service';
import AdminKeepPlayingModal from '../../../components/modals/AdminKeepPlayingModal';
import { MostPlayedGames } from './MostPlayedGames';
import { RecentUserActivity } from './RecentUserActivity';

export default function Home() {

  const [isAcceptInviteOpen, setIsAcceptInviteOpen] = useState(false);
  const [showKeepPlayingModal, setShowKeepPlayingModal] = useState(false);

  const handleShowPopup = () => {
    setShowKeepPlayingModal(true);
  };
  return (
    <div>
      <div className="px-6 pb-3">
      </div>
      <div className="px-6">
        <StatsCard />
        {/* pop up */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 my-6">
          <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 p-3">
              <p className="text-lg sm:text-2xl dark:text-[#D946EF] text-center sm:text-left">Dynamic Popup System</p>
              <PopUpSheet>
                <Button className="bg-[#D946EF] hover:bg-[#C026D3] text-white transition-colors duration-200 w-auto text-sm sm:text-base px-4 py-2">
                  Create New Pop-up
                </Button>
              </PopUpSheet>
            </div>
            {/* inner card */}
            <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
              <div className="justify-end flex flex-col p-3 space-y-4">
                <p className="text-lg">User View</p>
                <Button 
                  onClick={handleShowPopup}
                  className="w-32 bg-[#D946EF] hover:bg-[#C026D3] text-white transition-colors duration-200"
                >
                  Pop-up Preview
                </Button>
              </div>
            </Card>
          </Card>
        </div>

        {/* insights */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6">
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
                    <p className="text-sm sm:text-lg text-[#64748A] dark:text-white">Total clicks on Sign-up form</p>
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

        <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-6">
          <RecentUserActivity />
        </div>
      </div>

      <AcceptInvitationModal open={isAcceptInviteOpen} onOpenChange={setIsAcceptInviteOpen} isExistingUser={true} />
      <AdminKeepPlayingModal 
        open={showKeepPlayingModal} 
        onClose={() => setShowKeepPlayingModal(false)}
        isGameLoading={false}
      />
    </div>
  );
}

// Separate component for signup click insights
function SignupClickInsights() {
  const { data: signupAnalytics, isLoading: analyticsLoading } = useSignupAnalyticsData();
  // const { data: usersWithAnalytics, isLoading: usersLoading } = useUsersAnalytics();
  const { data: dashboardAnalytics, isLoading: usersLoading } = useDashboardAnalytics();
  
  if (analyticsLoading || usersLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  if (!signupAnalytics || !dashboardAnalytics) {
    return <div className="text-center py-4">No data available</div>;
  }

  // Total registered users is the verified count
  // Defaulting to one because Super Admin is created behind the system as part of all users 
  const verifiedCount = dashboardAnalytics?.totalRegisteredUsers?.current;
  const didntRegisterCount = (signupAnalytics.totalClicks) - verifiedCount;

  const chartData = [
    { name: "Didn't register", value: didntRegisterCount, fill: "#F3C7FA" },
    { name: "Verified users", value: verifiedCount, fill: "#D24CFB" }
  ];

  return <PieChart data={chartData} />;
}
