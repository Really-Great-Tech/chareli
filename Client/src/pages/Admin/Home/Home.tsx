import { FaRegClock, FaRegStar } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { IoGameControllerOutline } from "react-icons/io5";
import { IoHourglassOutline } from "react-icons/io5";


import sessionIcon from '../../../assets/session-icon.svg'
import users from '../../../assets/users.svg'
import click from '../../../assets/click.svg'

import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import  PieChart from "../../../components/ui/piechart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

const cardData = [
  {
    title: "Total Users",
    value: "389",
    icon: <FaRegUser size={32} />,
    change: "+9%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "Registered Users",
    value: "456",
    icon: <img src={users} className="w-14 h-14" />,
    change: "+7%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "Total Games",
    value: "200",
    icon: <IoGameControllerOutline size={32} />,
    change: "-10%",
    changeType: "down",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "Sessions",
    value: "100",
    icon: <img src={sessionIcon} className="w-14 h-14" />,
    change: "+9%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "Time played",
    value: "600 minutes",
    icon: <FaRegClock size={32} />,
    change: "+9%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "Most Played",
    value: "War shooting",
    icon: <FaRegStar size={32} />,
    change: "+2%",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "Avg. Session Duration",
    value: "12 min 5s",
    icon: <IoHourglassOutline size={32} />,
    change: "+1.3min",
    changeType: "up",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
  {
    title: "User Retention",
    value: "43%",
    icon: <img src={sessionIcon} className="w-14 h-14" />,
    change: "-4%",
    changeType: "down",
    description: "Over the last 24 hours",
    color: "text-[#D946EF]",
  },
];

export default function Home() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
      {cardData.map((card, idx) => (
        <div
          key={idx}
          className="dark:bg-[#181B2A] bg-[#F1F5F9] rounded-xl p-6 flex flex-col gap-2"
        >
          <div className="">

        {/* left */}
            <div className="flex justify-between mb-6">
            <div className="">
            <span className="font-semibold text-lg text-[#64748A]">{card.title}</span>
            <div className={`font-bold text-2xl ${card.color}`}>{card.value}</div>
            </div>
            
            <span className="text-3xl text-[#64748A]">{card.icon}</span>
            </div>

        {/* right */}
            <div className="flex justify-between">
            <span
              className={`${
                card.changeType === "up" ? "text-white bg-[#D946EF] pl-2 pr-2 pt-1 pb-1 rounded-lg" : "text-white bg-[#D946EF] pl-2 pr-2 pt-1 pb-1 rounded-lg"
              }`}
            >
              {card.changeType === "up" ? "↑" : "↓"} {card.change}
            </span>
            <span className="text-gray-400 text-sm">{card.description}</span>
            </div>
          </div>
        </div>
      ))}
      {/* pop up */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Dynamic Popup System</p>
            <Button className="bg-[#D946EF]">Create New Pop-up</Button>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] shadow-none border-none mx-3 p-4">
            <div className="justify-end flex flex-col p-3 space-y-4">
              <p className="text-lg">User View</p>
              <p className="text-lg">Pop-Up will appear after 3 seconds</p>
              <Button className="w-32 bg-[#D946EF]">Show Pop-up Now</Button>
            </div>
          </Card>
        </Card>
      </div>

      {/* insights */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] shadow-none border-none w-full">
          <div className="justify-between items-center flex p-3">
            <p className="text-3xl">Click insights</p>
          </div>
          {/* inner card */}
          <Card className="bg-[#F8FAFC] shadow-none border-none mx-3 p-4">
            <div className="flex flex-col space-y-8">

              <div className="">
              <div className="justify-start flex items-center gap-4">
              <img src={click} alt="click" className="w-10 h-10" />
              <p className="text-lg text-[#64748A]">Total clicks on Sign-up form</p>
              </div>

              <PieChart/>
              </div>
            </div>
          </Card>
        </Card>
      </div>

      {/* most played */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="bg-[#F1F5F9] shadow-none border-none w-full">
         
          <div className="flex justify-between p-4 text-3xl">
            <p className="text-3xl">Most Played Games</p>
            <p className="text-2xl">View All</p>
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
                {[1,2,3,4,5].map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=48&h=48"
                          alt="game"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <span className="font-semibold text-lg">War Shooting</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans">289</TableCell>
                    <TableCell className="font-sans">400</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">Showing 1-5 from 20 data</span>
              <div className="flex items-center gap-2 rounded-xl space-x-4 pr-1 pl-0.5 shadow-[2px_2px_3px_1px_#D946EF]">
                {/* <button className="w-7 h-7 rounded-full border border-gray-300 text-gray-400" disabled>&lt;</button> */}
                <button className="w-7 h-7 rounded-full bg-gray-300 text-balck">1</button>
                <button className="text-balck">2</button>
                <button className="text-balck">3</button>
                <button className="text-balck">4</button>
                {/* <button className="w-7 h-7 rounded-full border border-gray-300 text-gray-400">&gt;</button> */}
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
