import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import apiClient from '../../api/axios';
import FeedbackModal from '../common/FeedbackModal';

function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {theme === "dark" ? (
        <SunIcon className="h-6 w-6 text-yellow-400" />
      ) : (
        <MoonIcon className="h-6 w-6 text-slate-700" />
      )}
    </button>
  );
};

const Navbar = () => {
  const { isAuthenticated, user, logout, totalUnreadCount, fetchUnreadCount } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = React.useRef();
  useOnClickOutside(menuRef, () => setIsMenuOpen(false));

  const handleMessagesClick = async () => {
    setIsMenuOpen(false);
    if (totalUnreadCount > 0) {
      try {
        await apiClient.post('/messages/read-all');
        fetchUnreadCount();
      } catch (error) {
        console.error("Failed to mark messages as read", error);
      }
    }
    navigate('/messages');
  };

  const desktopNavLinks = (
    <>
      <Link
        to="/"
        className="text-slate-600 dark:text-slate-300 hover:text-blue-500"
      >
        Home
      </Link>
      {isAuthenticated ? (
        <>
          <Link
            to="/skills/new"
            className="text-slate-600 dark:text-slate-300 hover:text-blue-500"
          >
            Post Skill
          </Link>
          <Link
            to="/dashboard"
            className="text-slate-600 dark:text-slate-300 hover:text-blue-500"
          >
            Dashboard
          </Link>
          <Link to="/explore" className="text-slate-600 dark:text-slate-300 hover:text-blue-500">
            Explore
          </Link>
          <button
            onClick={handleMessagesClick}
            className="relative text-slate-600 dark:text-slate-300 hover:text-blue-500"
          >
            Messages
            {totalUnreadCount > 0 && location.pathname !== "/messages" && (
              <span className="absolute -top-1 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {totalUnreadCount}
              </span>
            )}
          </button>
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setIsFeedbackModalOpen(true);
            }}
            className="text-slate-600 dark:text-slate-300 hover:text-blue-500"
          >
            Feedback
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="text-slate-600 dark:text-slate-300 hover:text-blue-500"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-slate-600 dark:text-slate-300 hover:text-blue-500 font-semibold"
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  // Mobile Nav Links
  const mobileNavLinks = (
    <div className="flex flex-col items-stretch divide-y divide-slate-300 dark:divide-slate-700 p-2">
      <Link
        to="/"
        className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => setIsMenuOpen(false)}
      >
        Home
      </Link>
      {isAuthenticated ? (
        <>
          <Link
            to="/skills/new"
            className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Post Skill
          </Link>
          <Link
            to="/dashboard"
            className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link to="/explore" className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setIsMenuOpen(false)}>
            Explore
          </Link>
          <button
            onClick={handleMessagesClick}
            className="relative block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <div className="flex justify-between items-center">
              <span>Messages</span>
              {totalUnreadCount > 0 && location.pathname !== "/messages" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {totalUnreadCount}
                </span>
              )}
            </div>
          </button>
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setIsFeedbackModalOpen(true);
              setIsMenuOpen(false);
            }}
            className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Feedback
          </Link>
          <div className="p-2">
            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="w-full text-center py-2 px-3 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block w-full text-left py-3 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
            onClick={() => setIsMenuOpen(false)}
          >
            Register
          </Link>
        </>
      )}
    </div>
  );

  return (
    <>
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4" ref={menuRef}>
          <nav className="py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className="text-blue-500" />
                    <stop offset="100%" className="text-cyan-400" />
                  </linearGradient>
                </defs>
                <path fill="currentColor" className="text-blue-500 dark:text-blue-400" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m4.69 6.31l-1.42 1.42a3 3 0 1 1-4.24-4.24L12.45 4a8 8 0 1 1-5.66 2.34l-1.42-1.42A10 10 0 1 0 16.69 8.31" />
                <path fill="currentColor" className="text-blue-500 dark:text-blue-400" d="M12 22a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 4.93 4.93l-1.41-1.41A10 10 0 0 0 12 22" />
              </svg>
              <span className="text-2xl font-bold text-slate-800 dark:text-white">
                SkillSwap
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {desktopNavLinks}
              {isAuthenticated && user && (
                <Link to={`/profile/${user.username}`} className="relative">
                  {user.profilePicture ? (
                    <img
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-500"
                      src={user.profilePicture}
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white dark:from-blue-700 dark:to-cyan-500 dark:text-slate-200 flex items-center justify-center font-bold text-2xl border-2 border-slate-300 dark:border-slate-600">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {totalUnreadCount > 0 && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
                  )}
                </Link>
              )}
              <ThemeToggle />
            </div>

            {/* Hamburger Menu & Mobile Icon */}
            <div className="md:hidden flex items-center gap-2" >
              <ThemeToggle />
              {isAuthenticated && user && (
                <Link to={`/profile/${user.username}`} className="relative">
                  {user.profilePicture ? (
                    <img
                      className="h-11 w-11 rounded-full object-cover border-2 border-blue-500"
                      src={user.profilePicture}
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white dark:from-blue-700 dark:to-cyan-500 dark:text-slate-200 flex items-center justify-center font-bold text-xl border-2 border-slate-300 dark:border-slate-600">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {totalUnreadCount > 0 && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
                  )}
                </Link>
              )}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                )}
              </button>
            </div>
          </nav>

          <div
            className={`absolute w-full left-0 bg-gray-200 dark:bg-slate-800 backdrop-blur-lg shadow-md md:hidden ${
              isMenuOpen ? "block" : "hidden"
            }`}
          >
            <div className="flex flex-col items-stretch space-y-2 p-4">
              {mobileNavLinks}
            </div>
          </div>
        </div>
      </header>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
