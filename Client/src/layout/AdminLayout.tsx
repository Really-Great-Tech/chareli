import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/single/AdminNavbar";
// import AdminSidebar from "../components/single/AdminSideBar";
import { NavLink } from "react-router-dom";


import { IoGameControllerOutline } from "react-icons/io5";
import { FiHome } from "react-icons/fi";
import { MdOutlineCategory } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { FaChartLine } from "react-icons/fa";
import { SlEqualizer } from "react-icons/sl";
import { RiTeamLine } from "react-icons/ri";



const menuItems = [
  { 
    title: "Home", 
    icon: <FiHome size={20} />, 
    path: "/admin" 
},
  {
    title: "Game Management",
    icon: <IoGameControllerOutline size={20} />,
    path: "/admin/game-management",
  },
  {
    title: "Game Category",
    icon: <MdOutlineCategory size={20} />,
    path: "/admin/categories",
  },
  { title: "User Management", 
    icon: <FaRegUser size={20} />, 
    path: "/admin/management" 
},
  { title: "Team Management", 
    icon: <RiTeamLine size={20} />, 
    path: "/admin/team" 
},
  {
    title: "Analytics",
    icon: <FaChartLine size={20} />,
    path: "/admin/analytics",
  },
  {
    title: "Configuration",
    icon: <SlEqualizer size={20} />,
    path: "/admin/config",
  },
];

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen dark:bg-[#0f1221] text-white dark:text-gray-900 transition-colors duration-300">
      <AdminNavbar />
      <div className="flex">
        <div>
            {/* sidebar */}
          <aside>
            <div className="flex flex-col h-full w-60">
              <nav className="">
                <ul className="space-y-5 px-2">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/admin"}
                        className={({ isActive }) =>
                          `flex items-center p-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-[#D946EF] text-white"
                              : "hover:text-[#D946EF] hover:bg-[#F3E8FF] dark:text-white dark:hover:text-[#D946EF] text-[#121C2D]"
                          }`
                        }
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span className="text-xl">{item.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
        <main className="ml-6 flex-1 bg-white dark:bg-[#0f1221] min-h-screen">
            {/* main content */}
          {/* <div className="text-red-700">
            Hello world
        </div> */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
