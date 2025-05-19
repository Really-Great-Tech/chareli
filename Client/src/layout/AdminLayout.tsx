import React from "react";
import { useAuth } from '../../../Client/src/context/AuthContext';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import AdminNavbar from "../components/single/AdminNavbar";



import { IoExitOutline, IoGameControllerOutline } from "react-icons/io5";
import { FiHome } from "react-icons/fi";
import { MdOutlineCategory } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { FaChartLine } from "react-icons/fa";
import { SlEqualizer } from "react-icons/sl";
import { RiTeamLine } from "react-icons/ri";
import { Button } from "../components/ui/button";



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
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen dark:bg-[#0f1221] text-white dark:text-gray-900 transition-colors duration-300">
      <AdminNavbar />
      <div className="flex">
        <div className="justify-between">
            {/* sidebar */}
          <aside>
            <div className="flex flex-col w-60">
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

            {/* logout */}
            <div className="mt-96 pt-72 px-2">
            <Button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="bg-transparent flex items-center gap-2 text-red-500 text-2xl hover:bg-red-500 hover:text-white px-4 py-6 w-full border border-[#E2E8F0] rounded-lg transition-colors duration-300"
          >
            <IoExitOutline className="w-14 h-14" size={20} />
            <p className="items-center justify-center">Logout</p>
          </Button>
            </div>

          </aside>
        </div>
        <main className="ml-6 flex-1 bg-white dark:bg-[#0f1221] min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
