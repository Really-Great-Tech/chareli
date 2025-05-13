import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/single/Navbar';

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 transition-colors duration-300">
            <Navbar />
            <main className=" bg-white dark:bg-[#0f1221]">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;