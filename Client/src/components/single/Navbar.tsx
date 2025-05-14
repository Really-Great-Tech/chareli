import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import sun from '../../assets/sun.svg';
import moon from '../../assets/moon.svg';
import { SignUpModal } from '../modals/SignUpModal';
import { LoginModal } from '../modals/LoginModal';


const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const navigate = useNavigate();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev: any) => !prev);
  };

  return (
    <header className="flex justify-between p-4 border-b-4 border-b-[#D946EF] items-center bg-white dark:bg-[#0f1221] transition-colors duration-300">
      <div
        onClick={() => navigate('/')}
        className="text-2xl font-extrabold text-[#D946EF] dark:text-[#E879F9] cursor-pointer"
      >
        CHARELI
      </div>

      <div className="flex gap-8 text-lg font-bold text-[#111826] dark:text-[#94A3B7] items-center">
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
        <Button
          onClick={() => setIsLoginModalOpen(true)}
          className="bg-transparent border border-[#111826] dark:border-gray-500 text-[#111826] dark:text-gray-300 text-lg cursor-pointer hover:text-white">
          Log in
        </Button>
        <Button
          onClick={() => setIsSignUpModalOpen(true)}
          className="bg-transparent border border-[#C026D3] dark:border-purple-400 text-[#C026D3] dark:text-purple-300 text-lg cursor-pointer">
          Sign up
        </Button>
        <SignUpModal open={isSignUpModalOpen} onOpenChange={setIsSignUpModalOpen} />
        <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
      </div>
    </header>
  );
};

export default Navbar;