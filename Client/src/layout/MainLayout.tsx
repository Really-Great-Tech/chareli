import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/single/Navbar";

const MainLayout: React.FC = () => {
  const location = useLocation();

  const navigation = useNavigate();
  const handleTermsPage = () => {
    navigation("/terms");
  };

  const isGamePlay = location.pathname.includes("/gameplay/");
  return (
    <div className="min-h-screen bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 transition-colors duration-300">
      <Navbar />
      <main className=" bg-white dark:bg-[#0f1221]">
        <Outlet />
      </main>
      {!isGamePlay && (
        <footer className="text-center text-white dark:white py-4 md:py-6 lg:py-8 bg-[#1E0420] dark:bg-[#1E0420] w-full">
          <div className="w-[90%] md:w-[85%] lg:w-[800px] mx-auto px-4 md:px-6">
            <p className="font-boogaloo mb-3 text-[11px] sm:text-xs md:text-sm">
              These games are brought to you by Chareli, a web-based gaming
              platform.
            </p>

            <p className="font-pincuk text-xl tracking-wider sm:text-sm mt-3 mb-3 leading-relaxed">
              By using this service, you agree to the Chareli{" "}
              <span className="text-[#C026D3] underline cursor-pointer hover:text-[#db2ee8] transition-colors" onClick={handleTermsPage}>
                Terms of Service
              </span>
              . Chareli's{" "}
              <span /*className="text-[#C026D3] underline cursor-pointer hover:text-[#db2ee8] transition-colors"*/
              >
                Privacy Policy
              </span>{" "}
              sets out how we handle your data.
            </p>

            <p className="font-pincuk text-xl tracking-wider sm:text-sm leading-relaxed">
              Chareli uses cookies to deliver and enhance the quality of its
              services, to analyze traffic, and to personalize the content that
              you see. Chareli uses analytics services to serve the content that
              you see. You can opt out of content personalization at
              <span /*className='text-[#C026D3] underline cursor-pointer hover:text-[#db2ee8] transition-colors ml-1'*/
              >
                Personalization settings & cookies
              </span>
              . You can opt out of ads personalization with{" "}
              <span /*className='text-[#C026D3] underline cursor-pointer hover:text-[#db2ee8] transition-colors'*/
              >
                ad settings
              </span>
              . Note that this setting also affects ads personalization on other
              sites and apps that partner with Chareli.{" "}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
