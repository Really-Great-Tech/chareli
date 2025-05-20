import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { StatsModal } from '../modals/StatsModal';
import { ProfileModal } from '../modals/ProfileModal';
import { useAuth } from '../../context/AuthContext';

import sun from '../../assets/sun.svg';
import moon from '../../assets/moon.svg';
import bolt from '../../assets/bolt.svg';
import profileImg from '../../assets/profile.svg'

import { SignUpModal } from '../modals/SignUpModal';
import { LoginModal } from '../modals/LoginModal';


const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const navigate = useNavigate();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsDarkMode((prev: any) => !prev);
  };

  return (
    <header className="flex justify-between p-4 items-center bg-white dark:bg-[#0f1221] transition-colors duration-300">
      <div
        onClick={() => navigate('/')}
        className="text-2xl font-extrabold text-[#D946EF] dark:text-[#E879F9] cursor-pointer"
      >
        CHARELI
      </div>

      <div className="flex gap-8 text-lg font-bold text-[#111826] dark:text-[#94A3B7] items-center justify-center">
        <Link to="/about" className="hover:bg-[#D946EF] hover:text-white px-4 py-2 rounded-md">About Us</Link>
        <Link to="/categories" className="hover:bg-[#D946EF] hover:text-white px-4 py-2 rounded-md">Categories</Link>
      </div>

      <div className="space-x-4 flex items-center">
        <img
          onClick={toggleDarkMode}
          src={isDarkMode ? moon : sun}
          alt={isDarkMode ? 'light mode' : 'dark mode'}
          className="w-6 h-6 cursor-pointer"
        />
        
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                className="bg-[#E328AF] text-white hover:bg-[#C026D3]"
              >
                Admin Dashboard
              </Button>
            )}
            
            <img
              src={bolt}
              alt="bolt"
              className="cursor-pointer"
              onClick={() => setIsStatsModalOpen(true)}
            />
            
            <img
              src={profileImg}
              alt="profile image"
              className="cursor-pointer"
              onClick={() => setIsProfileModalOpen(true)}
            />
            
            <Button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-transparent border border-[#111826] dark:border-gray-500 text-[#111826] hover:text-[#111826] dark:text-gray-300 text-lg cursor-pointer hover:bg-accent">
              Log in  
            </Button>
            <Button
              onClick={() => setIsSignUpModalOpen(true)}
              className="bg-transparent border border-[#C026D3] dark:border-purple-400 text-[#C026D3] dark:text-purple-300 text-lg hover:bg-accent hover:text-[#C026D3]">
              Sign up
            </Button>
          </>
        )}

        <SignUpModal
          open={isSignUpModalOpen}
          onOpenChange={setIsSignUpModalOpen}
          openLoginModal={() => {
            setIsSignUpModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
        <LoginModal
          open={isLoginModalOpen}
          onOpenChange={setIsLoginModalOpen}
          openSignUpModal={() => {
            setIsLoginModalOpen(false);
            setIsSignUpModalOpen(true);
          }}
        />
        <StatsModal open={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
        <ProfileModal open={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      </div>
    </header>
  );
};

export default Navbar;
