import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-full focus:outline-none text-xl">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navLinks = (
    <>
      <Link to="/" className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-brown-600 dark:hover:text-brown-400" onClick={() => setIsMenuOpen(false)}>Home</Link>
      {isAuthenticated ? (
        <>
          <Link to="/my-skills" className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-brown-600 dark:hover:text-brown-400" onClick={() => setIsMenuOpen(false)}>My Skills</Link>
          <Link to="/skills/new" className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-brown-600 dark:hover:text-brown-400" onClick={() => setIsMenuOpen(false)}>Post Skill</Link>
          <Link to="/dashboard" className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-brown-600 dark:hover:text-brown-400" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full md:w-auto text-center md:text-center py-2 md:py-2 md:px-4 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" className="block py-2 md:py-0 text-gray-600 dark:text-gray-300 hover:text-brown-600 dark:hover:text-brown-400" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link to="/register" className="w-full md:w-auto  py-2 md:px-4 bg-brown-600  text-gray-600 dark:text-gray-300 rounded-md hover:bg-brown-700" onClick={() => setIsMenuOpen(false)}>Register</Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-neutral-100 dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-brown-600 dark:text-brown-400">
            SkillSwap
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks}
            {isAuthenticated && user && (
              <Link to={`/profile/${user.username}`}>
                <img
                  className="h-12 w-12 rounded-full object-cover border-2 border-brown-500"
                  src={user.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`}
                  alt="Profile"
                />
              </Link>
            )}
            <ThemeToggle />
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && user && (
              <Link to={`/profile/${user.username}`}>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-gray-700 dark:text-white flex items-center justify-center font-bold text-xl border-2 border-brown-300">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </Link>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>
        </nav>

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