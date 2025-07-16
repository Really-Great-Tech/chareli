import { DonutChart } from "../../../components/charts/donutChart";
import { Card } from "../../../components/ui/card";
import usersLine from "../../../assets/users-line.svg";
import HorizontalBarChart from "../../../components/charts/barChart";
import click from "../../../assets/click.svg";
import UserActivityLog from "./UserActivityLog";
import GameActivity from "./GameActivity";
import { useDashboardAnalytics } from "../../../backend/analytics.service";

export default function Analytics() {
  const { data: dashboardData } = useDashboardAnalytics();

  const adultsCount = dashboardData?.adultsCount ?? 0;
  const minorsCount = dashboardData?.minorsCount ?? 0;
  const totalRegistered = adultsCount + minorsCount;
  console.log("Age Counts:", { adultsCount, minorsCount, totalRegistered });
  return (
    <div className="space-y-6">
      {/* bar chart */}
      <div className="w-full">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-base sm:text-xl lg:text-2xl">Click insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">
              <div className="">
                <div className="justify-start flex items-center gap-4">
                  <img
                    src={click}
                    alt="users"
                    className="w-10 h-10 dark:text-white"
                  />
                  <p className="text-sm sm:text-base lg:text-lg text-[#64748A] dark:text-white">
                    Total clicks on Sign-up form
                  </p>
                </div>

                <HorizontalBarChart />
              </div>
            </div>
          </Card>
        </Card>
      </div>

      {/* bar chart for user age */}
      {/* <div className="w-full">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-base sm:text-xl lg:text-2xl">User Age</p>
          </div>
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">
              <div className="">
                <div className="justify-start flex items-center gap-4">
                  <div className="flex gap-4 items-center">
                    <p className="font-bold text-xl sm:text-2xl lg:text-3xl">
                      {totalRegistered}
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg text-[#64748A] dark:text-white">
                      Total registered users
                    </p>
                  </div>
                </div>

                <UserAgeBarChart
                  adultsCount={adultsCount}
                  minorsCount={minorsCount}
                />
              </div>
            </div>
          </Card>
        </Card>
      </div> */}

      <UserActivityLog />
      <GameActivity />

      {/* donut chart */}
      <div className="w-full">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-lg sm:text-xl lg:text-2xl">
              Registration insights
            </p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">
              <div className="">
                <div className="justify-start flex items-center gap-4 font-worksans">
                  <img
                    src={usersLine}
                    alt="users"
                    className="w-10 h-10 dark:text-white"
                  />
                  <p className="text-sm sm:text-base lg:text-lg text-[#64748A] dark:text-white">
                    Total number of registered users
                  </p>
                </div>

                <DonutChart />
              </div>
            </div>
          </Card>
        </Card>
      </div>
    </div>
  );
}
