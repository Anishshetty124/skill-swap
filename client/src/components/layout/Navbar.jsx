import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = (
    <>
      {isAuthenticated ? (
        // Links for logged-in users
        <>
          <span className="text-gray-800 dark:text-gray-200 block md:inline-block py-2 md:py-0">
            Welcome, {user?.username}
          </span>
          <Link
            to="/skills/new"
            className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Post Skill
          </Link>
          <Link
            to="/dashboard"
            className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <button
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }}
            className="w-full md:w-auto text-left md:text-center py-2 md:py-2 md:px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </>
      ) : (
        // Links for logged-out users
        <>
          <Link
            to="/login"
            className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="w-full md:w-auto text-center py-2 md:px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="py-4 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            SkillSwap
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks}
          </div>

          {/* Hamburger Menu Button (visible on mobile) */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? (
                // Close Icon (X)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu (dropdown) */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="flex flex-col items-start space-y-4 py-4">
            {navLinks}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;