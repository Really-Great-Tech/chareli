import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/single/AdminNavbar';
import { NavLink } from 'react-router-dom';
import { IoGameControllerOutline } from 'react-icons/io5';
import { FiHome } from 'react-icons/fi';
import { MdOutlineCategory } from 'react-icons/md';
import { FaRegUser } from 'react-icons/fa6';
// import { FaChartLine } from "react-icons/fa";
import { SlEqualizer } from 'react-icons/sl';
import { RiTeamLine } from 'react-icons/ri';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { usePermissions } from '../hooks/usePermissions';
import { Database } from 'lucide-react';

const allMenuItems = [
  {
    title: 'Home',
    icon: <FiHome size={20} />,
    path: '/admin',
    requiresConfig: false,
  },
  {
    title: 'Game Management',
    icon: <IoGameControllerOutline size={20} />,
    path: '/admin/game-management',
    requiresConfig: false,
  },
  {
    title: 'Game Category',
    icon: <MdOutlineCategory size={20} />,
    path: '/admin/categories',
    requiresConfig: false,
  },
  {
    title: 'User Management',
    icon: <FaRegUser size={20} />,
    path: '/admin/management',
    requiresConfig: false,
  },
  {
    title: 'Team Management',
    icon: <RiTeamLine size={20} />,
    path: '/admin/team',
    requiresConfig: false,
  },
  // {
  //   title: "Analytics",
  //   icon: <FaChartLine size={20} />,
  //   path: "/admin/analytics",
  //   requiresConfig: false,
  // },
  {
    title: 'Configuration',
    icon: <SlEqualizer size={20} />,
    path: '/admin/config',
    requiresConfig: true,
  },
];

// Check if environment is development or test
const isDevelopmentOrTest = () => {
  const mode = import.meta.env.MODE;
  return mode === 'development' || mode === 'test';
};

const AdminLayout: React.FC = () => {
  const permissions = usePermissions();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(73);
  const navbarRef = useRef<HTMLDivElement>(null);

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter((item) => {
    if (item.requiresConfig) {
      return permissions.canAccessConfig;
    }
    return true;
  });

  // Add Cache Dashboard for superadmin in dev/test environments only
  if (permissions.canAccessCacheDashboard && isDevelopmentOrTest()) {
    menuItems.push({
      title: 'Cache Dashboard',
      icon: <Database size={20} />,
      path: '/admin/cache',
      requiresConfig: false,
    });
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Measure navbar height dynamically
  useEffect(() => {
    const measureNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setNavbarHeight(height);
      }
    };

    // Measure on mount and when window resizes
    measureNavbarHeight();
    window.addEventListener('resize', measureNavbarHeight);

    // Use ResizeObserver to detect navbar height changes
    const resizeObserver = new ResizeObserver(measureNavbarHeight);
    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureNavbarHeight);
      resizeObserver.disconnect();
    };
  }, []);

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

  // Admin route cursor override logic removed - using normal system cursors throughout

  return (
    <div className="admin-layout min-h-screen bg-white dark:bg-[#0f1221] text-gray-900 dark:text-white transition-colors duration-300">
      <div ref={navbarRef} className="fixed top-0 left-0 right-0 z-50">
        <AdminNavbar />
      </div>

      <div className="flex" style={{ paddingTop: `${navbarHeight}px` }}>
        <div
          className={`fixed z-20 transition-all duration-300 transform ${
            isSidebarCollapsed
              ? '-translate-x-full lg:translate-x-0 w-16'
              : 'translate-x-0 w-60'
          }`}
          style={{
            height: `calc(100vh - ${navbarHeight}px)`,
            top: `${navbarHeight}px`,
          }}
        >
          <aside className="h-full bg-white/95 dark:bg-[#0f1221]/95 backdrop-blur-sm transition-colors duration-300">
            <div className="flex flex-col h-full relative">
              <nav className="flex-1">
                <ul className="space-y-5 px-2 py-4">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                          `flex items-center p-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[#6A7282] text-white'
                              : 'hover:text-[#6A7282] hover:bg-[#F1F5F9] dark:text-white dark:hover:text-[#6A7282] text-[#121C2D]'
                          } ${isSidebarCollapsed ? 'justify-center' : ''}`
                        }
                        onClick={() => {
                          if (isMobile) {
                            setIsSidebarCollapsed(true);
                          }
                        }}
                      >
                        <span className={isSidebarCollapsed ? '' : 'mr-3'}>
                          {item.icon}
                        </span>
                        {!isSidebarCollapsed && (
                          <span className="text-lg">{item.title}</span>
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
                    isSidebarCollapsed ? '-right-12' : '-right-4'
                  } bg-[#6A7282] dark:bg-[#6A7282] rounded-full p-1.5 text-white hover:bg-[#5A626F] dark:hover:bg-[#5A626F] shadow-lg transition-all duration-300`}
                  style={{ bottom: '20px' }}
                >
                  {isSidebarCollapsed ? (
                    <IoChevronForwardOutline
                      size={18}
                      className="cursor-pointer"
                    />
                  ) : (
                    <IoChevronBackOutline
                      size={18}
                      className="cursor-pointer"
                    />
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
        {/* Main content with responsive margins */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-16' : 'ml-0 lg:ml-60'
          } bg-white dark:bg-[#0f1221] overflow-y-auto relative`}
          style={{ minHeight: `calc(100vh - ${navbarHeight}px)` }}
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
