import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
      {theme === 'dark' ? (
        <SunIcon className="h-6 w-6 text-yellow-400" />
      ) : (
        <MoonIcon className="h-6 w-6 text-slate-700" />
      )}
    </button>
  );
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navLinks = (
    <>
      <Link to="/" className="block py-2 md:py-0 text-slate-600 dark:text-slate-300 hover:text-accent-500" onClick={() => setIsMenuOpen(false)}>Home</Link>
      {isAuthenticated ? (
        <>
          <Link to="/my-skills" className="block py-2 md:py-0 text-slate-600 dark:text-slate-300 hover:text-accent-500" onClick={() => setIsMenuOpen(false)}>My Skills</Link>
          <Link to="/skills/new" className="block py-2 md:py-0 text-slate-600 dark:text-slate-300 hover:text-accent-500" onClick={() => setIsMenuOpen(false)}>Post Skill</Link>
          <Link to="/dashboard" className="block py-2 md:py-0 text-slate-600 dark:text-slate-300 hover:text-accent-500" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full md:w-auto text-center py-2 md:py-2 md:px-4 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" className="block py-2 md:py-0 text-slate-600 dark:text-slate-300 hover:text-accent-500" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link to="/register" className="block py-2 md:py-0 text-slate-600 dark:text-slate-300 hover:text-accent-500 font-semibold" onClick={() => setIsMenuOpen(false)}>Register</Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-accent-500">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <path fill="url(#logoGradient)" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m4.69 6.31l-1.42 1.42a3 3 0 1 1-4.24-4.24L12.45 4a8 8 0 1 1-5.66 2.34l-1.42-1.42A10 10 0 1 0 16.69 8.31" />
                <path fill="url(#logoGradient)" d="M12 22a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 4.93 4.93l-1.41-1.41A10 10 0 0 0 12 22" />
            </svg>
            <span className="text-2xl font-bold text-slate-800 dark:text-white">SkillSwap</span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {navLinks}
            {isAuthenticated && user && (
              <Link to={`/profile/${user.username}`}>
                {user.profilePicture ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover border-2 border-accent-500"
                    src={user.profilePicture}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-2xl border-2 border-slate-300 dark:border-slate-600">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            )}
            <ThemeToggle />
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && user && (
              <Link to={`/profile/${user.username}`}>
                {user.profilePicture ? (
                   <img
                    className="h-10 w-10 rounded-full object-cover border-2 border-accent-500"
                    src={user.profilePicture}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xl border-2 border-slate-300 dark:border-slate-600">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
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