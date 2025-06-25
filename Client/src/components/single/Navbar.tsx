import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { StatsModal } from '../modals/StatsModal';
import { ProfileModal } from '../modals/ProfileModal';
import { useAuth } from '../../context/AuthContext';
import { useTrackSignupClick } from '../../backend/signup.analytics.service';
import { getVisitorSessionId } from '../../utils/sessionUtils';

import sun from '../../assets/sun.svg';
import moon from '../../assets/moon.svg';
import bolt from '../../assets/bolt.svg';
import profileImg from '../../assets/profile.svg'

import { SignUpModal } from '../modals/SignUpModal';
import { LoginModal } from '../modals/LoginModal';


const Navbar: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { mutate: trackSignup } = useTrackSignupClick();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const navigate = useNavigate();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !menuButtonRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsDarkMode((prev: any) => !prev);
  };

  return (
    <header className="relative flex justify-between p-4 items-center bg-white dark:bg-[#0f1221] transition-colors duration-300">
      <div
        onClick={() => navigate('/')}
        className="text-3xl font-extrabold text-[#D946EF] dark:text-[#D946EF] cursor-pointer font-ponggame tracking-wider"
      >
        CHARELI
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8 text-lg font-bold text-[#111826] dark:text-[#94A3B7] items-center justify-center">
        <Link to="/about" className="hover:bg-[#D946EF] hover:text-white px-4 py-2 rounded-md">About Us</Link>
        <Link to="/categories" className="hover:bg-[#D946EF] hover:text-white px-4 py-2 rounded-md">Categories</Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        ref={menuButtonRef}
        className="md:hidden text-[#D946EF] p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <RiCloseLine size={24} /> : <RiMenu3Line size={24} />}
      </button>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 right-0 bg-white dark:bg-[#0f1221] shadow-lg md:hidden z-50 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex flex-col p-4 gap-4">
            <Link
              to="/about"
              className="text-[#111826] dark:text-[#94A3B7] hover:bg-[#D946EF] hover:text-white px-4 py-2 rounded-md text-lg font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/categories"
              className="text-[#111826] dark:text-[#94A3B7] hover:bg-[#D946EF] hover:text-white px-4 py-2 rounded-md text-lg font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Categories
            </Link>
            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                {isAdmin && (
                  <Button
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-[#E328AF] text-white hover:bg-[#C026D3] w-full"
                  >
                    Admin Dashboard
                  </Button>
                )}
                <div className="flex justify-between items-center">
                  <img
                    src={bolt}
                    alt="bolt"
                    className="cursor-pointer"
                    onClick={() => {
                      setIsStatsModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                  <img
                    src={profileImg}
                    alt="profile image"
                    className="cursor-pointer"
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    logout();
                    navigate('/');
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-transparent border border-[#111826] dark:border-gray-500 text-[#111826] hover:text-[#111826] dark:text-gray-300 text-lg cursor-pointer hover:bg-accent w-full"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => {
                    trackSignup({ 
                      sessionId: getVisitorSessionId(),
                      type: 'navbar' 
                    });
                    setIsSignUpModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-transparent border border-[#C026D3] dark:border-purple-400 text-[#C026D3] dark:text-purple-300 text-lg hover:bg-accent hover:text-[#C026D3] w-full"
                >
                  Sign up
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <span className="text-[#111826] dark:text-[#94A3B7] font-medium">Theme</span>
              <img
                onClick={toggleDarkMode}
                src={isDarkMode ? moon : sun}
                alt={isDarkMode ? 'light mode' : 'dark mode'}
                className="w-6 h-6 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals - Available for both mobile and desktop */}
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

      {/* Desktop Actions */}
      <div className="hidden md:flex space-x-4 items-center">
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
              onClick={() => {
                trackSignup({ 
                  sessionId: getVisitorSessionId(),
                  type: 'navbar' 
                });
                setIsSignUpModalOpen(true);
              }}
              className="bg-transparent border border-[#C026D3] dark:border-purple-400 text-[#C026D3] dark:text-purple-300 text-lg hover:bg-accent hover:text-[#C026D3]">
              Sign up
            </Button>
          </>
        )}

      </div>
    </header>
  );
};

export default Navbar;
