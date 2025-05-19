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
            <footer className="text-center text-white dark:white py-8 bg-[#1E0420] dark:bg-[#1E0420] w-full">
                <div className='w-full lg:w-[800px] mx-auto'>
                    <p className='font-boogaloo mb-2 text-xs'>These games are brought to you by Chareli, a web-based gaming platform.</p>

                    <p className='font-pincuk text-sm mt-2 mb-2'>By using this service, you agree to the Chareli <span className='text-[#C026D3] underline cursor-pointer'>Terms of Service</span>. Chareli's <span className='text-[#C026D3] underline cursor-pointer'>Privacy Policy</span> sets out how we handle your data.
                    </p>

                    <p className='font-pincuk text-sm'>Chareli uses cookies to deliver and enhance the quality of its services, to analyze traffic, and to personalize the content that you see. Chareli uses analytics services to serve the content that you see. You can opt out of content personalization at
                        &nbsp;<span className='text-[#C026D3] underline cursor-pointer'>Personalization settings & cookies</span>. You can opt out of ads personalization with <span className='text-[#C026D3] underline cursor-pointer'>ad settings</span>. Note that this setting also affects ads personalization on other sites and apps that partner with Chareli. </p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;