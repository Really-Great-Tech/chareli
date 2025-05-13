import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import sun from '../../assets/sun.svg';
import moon from '../../assets/moon.svg';

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

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
    <header className="flex justify-between p-4 items-center">
      <div className="text-2xl font-extrabold text-[#D946EF]">CHARELI</div>

      <div className="flex gap-8 text-lg font-bold text-[#111826] items-center">
        <Link to="/about" className="hover:underline">About Us</Link>
        <Link to="/categories" className="hover:underline">Categories</Link>
      </div>

      <div className="space-x-4 flex items-center">
        <img
          onClick={toggleDarkMode}
          src={isDarkMode ? moon : sun}
          alt={isDarkMode ? 'light mode' : 'dark mode'}
          className="w-6 h-6 cursor-pointer"
        />
        <Button className="bg-transparent border border-[#111826] text-[#111826] text-lg">
          Log in
        </Button>
        <Button className="bg-transparent border border-[#C026D3] text-[#C026D3] text-lg">
          Sign up
        </Button>
      </div>
    </header>
  );
};

export default Navbar;