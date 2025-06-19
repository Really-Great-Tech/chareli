import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminNavbar from "../components/single/AdminNavbar";
import { NavLink } from "react-router-dom";
import { IoGameControllerOutline } from "react-icons/io5";
import { FiHome } from "react-icons/fi";
import { MdOutlineCategory } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { FaChartLine } from "react-icons/fa";
import { SlEqualizer } from "react-icons/sl";
import { RiTeamLine } from "react-icons/ri";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

const menuItems = [
  {
    title: "Home",
    icon: <FiHome size={20} />,
    path: "/admin",
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
  {
    title: "User Management",
    icon: <FaRegUser size={20} />,
    path: "/admin/management",
  },
  {
    title: "Team Management",
    icon: <RiTeamLine size={20} />,
    path: "/admin/team",
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Check if screen is mobile and set initial sidebar state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // On mobile, default sidebar to hidden
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };

    // Check on initial load
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup event listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if current route is admin route and manage cursor override
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");

    if (isAdminRoute) {
      document.body.classList.add("admin-route");
    } else {
      document.body.classList.remove("admin-route");
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove("admin-route");
    };
  }, [location.pathname]);

  return (
    <div className="admin-layout min-h-screen bg-white dark:bg-[#0f1221] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AdminNavbar />
      </div>

      <div className="flex pt-[73px]">
        {" "}
        {/* Add padding-top to account for fixed header */}
        {/* Fixed sidebar with overlay on mobile */}
        <div
          className={`fixed h-[calc(100vh-73px)] z-30 transition-all duration-300 transform ${
            isSidebarCollapsed
              ? "-translate-x-full lg:translate-x-0 w-16"
              : "translate-x-0 w-60"
          }`}
        >
          <aside className="h-full bg-white/95 dark:bg-[#0f1221]/95 backdrop-blur-sm transition-colors duration-300">
            <div className="flex flex-col h-full relative">
              <nav className="flex-1">
                <ul className="space-y-5 px-2 py-4">
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
                          } ${isSidebarCollapsed ? "justify-center" : ""}`
                        }
                        onClick={() => {
                          // Close sidebar on mobile when item is selected
                          if (isMobile) {
                            setIsSidebarCollapsed(true);
                          }
                        }}
                      >
                        <span className={isSidebarCollapsed ? "" : "mr-3"}>
                          {item.icon}
                        </span>
                        {!isSidebarCollapsed && (
                          <span className="text-xl">{item.title}</span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Collapse toggle button */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <button
                  onClick={toggleSidebar}
                  className={`absolute ${
                    isSidebarCollapsed ? "-right-12" : "-right-4"
                  } bg-[#D946EF] dark:bg-[#D946EF] rounded-full p-1.5 text-white hover:bg-[#c026d3] dark:hover:bg-[#c026d3] shadow-lg transition-all duration-300`}
                  style={{ bottom: "20px" }}
                >
                  {isSidebarCollapsed ? (
                    <IoChevronForwardOutline size={18} />
                  ) : (
                    <IoChevronBackOutline size={18} />
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
        {/* Main content with responsive margins */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "lg:ml-16" : "ml-0 lg:ml-60"
          } bg-white dark:bg-[#0f1221] min-h-[calc(100vh-73px)] overflow-y-auto relative`}
          onClick={() => {
            if (!isSidebarCollapsed && window.innerWidth < 1024) {
              setIsSidebarCollapsed(true);
            }
          }}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
