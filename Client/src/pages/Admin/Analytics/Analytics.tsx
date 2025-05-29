import { DonutChart } from "../../../components/charts/donutChart";
import { Card } from "../../../components/ui/card";
import usersLine from "../../../assets/users-line.svg"
import HorizontalBarChart from "../../../components/charts/barChart";
import click from '../../../assets/click.svg'
import UserActivityLog from "./UserActivityLog";
import GameActivity from "./GameActivity";
import UserAgeBarChart from "../../../components/charts/barChart II";

export default function Analytics() {
  return (
    <div>
      {/* donut chart */}
       <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Registration insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <img src={usersLine} alt="users" className="w-10 h-10 dark:text-white" />
              <p className="text-lg text-[#64748A] dark:text-white">Total number of registered users</p>
              </div>

              <DonutChart />
              </div>
            </div>
          </Card>
        </Card>
      </div>
      {/* bar chart */}
       <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Click insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <img src={click} alt="users" className="w-10 h-10 dark:text-white" />
              <p className="text-lg text-[#64748A] dark:text-white">Total clicks on Sign-up form</p>
              </div>

              <HorizontalBarChart/>
              </div>
            </div>
          </Card>
        </Card>
      </div>

      {/* bar chart for user age */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
        <Card className="bg-[#F1F5F9] dark:bg-[#121C2D] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">User Age</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] dark:bg-[#0F1221] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <div className="flex gap-4"> 
              <p className="font-bold text-3xl">124</p>
              <p className="text-lg text-[#64748A] dark:text-white">Total clicks on Sign-up form</p>
              </div>
              </div>

              <UserAgeBarChart/>
              </div>
            </div>
          </Card>
        </Card>
      </div>


      <UserActivityLog />
      <GameActivity />
    </div>
  )
}
