import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import { StatsModal } from '../modals/StatsModal';
import { ProfileModal } from '../modals/ProfileModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTrackSignupClick } from '../../backend/signup.analytics.service';
import { getVisitorSessionId } from '../../utils/sessionUtils';
import { usePermissions } from '../../hooks/usePermissions';

import sun from '../../assets/sun.svg';
import moon from '../../assets/moon.svg';
import bolt from '../../assets/bolt.svg';
import profileImg from '../../assets/profile.svg'

import { SignUpModal } from '../modals/SignUpModal';
import { LoginModal } from '../modals/LoginModal';  


const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const permissions = usePermissions();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { mutate: trackSignup } = useTrackSignupClick();

  const navigate = useNavigate();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
          <div className="flex flex-col p-6 gap-5">
            <div className="space-y-2">
              <Link
                to="/about"
                className="block text-[#111826] dark:text-[#94A3B7] hover:bg-gradient-to-r hover:from-[#D946EF] hover:to-[#C026D3] hover:text-white px-4 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/categories"
                className="block text-[#111826] dark:text-[#94A3B7] hover:bg-gradient-to-r hover:from-[#D946EF] hover:to-[#C026D3] hover:text-white px-4 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories
              </Link>
            </div>
            {isAuthenticated ? (
              <div className="space-y-5">
                {permissions.hasAdminAccess && (
                  <Button
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-[#E328AF] to-[#C026D3] text-white hover:from-[#C026D3] hover:to-[#A21CAF] w-full py-3 rounded-xl font-semibold shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                  >
                    Admin Dashboard
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setIsStatsModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D946EF] to-[#C026D3] text-white px-4 py-4 rounded-xl hover:from-[#C026D3] hover:to-[#A21CAF] transition-all duration-300 shadow-lg transform hover:scale-[1.05]"
                  >
                    <img
                      src={bolt}
                      alt="bolt"
                      className="w-4 h-4 filter brightness-0 invert"
                    />
                    <span className="text-sm font-semibold">Stats</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#64748B] to-[#475569] text-white px-4 py-4 rounded-xl hover:from-[#475569] hover:to-[#334155] transition-all duration-300 shadow-lg transform hover:scale-[1.05]"
                  >
                    <img
                      src={profileImg}
                      alt="profile image"
                      className="w-4 h-4 filter brightness-0 invert"
                    />
                    <span className="text-sm font-semibold">Profile</span>
                  </button>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    navigate('/');
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-transparent border-2 border-[#111826] dark:border-gray-400 text-[#111826] dark:text-gray-300 hover:bg-[#111826] hover:text-white dark:hover:bg-gray-400 dark:hover:text-gray-900 w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02]"
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
                  className="bg-gradient-to-r from-[#C026D3] to-[#D946EF] text-white hover:from-[#A21CAF] hover:to-[#C026D3] w-full py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Sign up
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-6 mt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-[#111826] dark:text-[#94A3B7] font-semibold">Theme</span>
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
            {permissions.hasAdminAccess && (
              <Button
                onClick={() => navigate('/admin')}
                className="bg-[#E328AF] text-white hover:bg-[#C026D3] cursor-pointer"
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
              className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
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
              className="bg-transparent border border-[#C026D3] dark:border-purple-400 text-[#C026D3] dark:text-purple-300 text-lg hover:bg-accent hover:text-[#C026D3] cursor-pointer">
              Sign up
            </Button>
          </>
        )}

      </div>
    </header>
  );
};

export default Navbar;
