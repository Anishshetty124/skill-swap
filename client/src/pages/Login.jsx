import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(credentials);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <div className="flex w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* Left Side (Form) */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="font-bold text-3xl mb-4">Welcome Back!</h2>
          <p className="mb-8 max-w-sm text-slate-600 dark:text-slate-400">Log in to continue your skill-swapping journey.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Email or Username</label>
              <input
                type="text"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-slate-100 border border-slate-400 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div>
            <label className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 mt-1 border-slate-400 bg-slate-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border  dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.117-2.117" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
            
            <button type="submit" className="w-full py-3 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">Log In</button>
          </form>

          {error && <p className="text-sm text-center text-red-500 mt-4">{error}</p>}

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">Don't have an account? <Link to="/register" className="font-semibold text-accent-500 hover:underline">Register now</Link></p>
          </div>
        </div>

        {/* Right Side (Decorative) */}
        <div className="w-1/2 p-12 bg-gradient-to-br from-blue-600 to-cyan-500 hidden md:flex flex-col justify-center items-center text-white text-center">
            <svg width="64" height="64" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="white" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m4.69 6.31l-1.42 1.42a3 3 0 1 1-4.24-4.24L12.45 4a8 8 0 1 1-5.66 2.34l-1.42-1.42A10 10 0 1 0 16.69 8.31" />
                <path fill="white" d="M12 22a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 4.93 4.93l-1.41-1.41A10 10 0 0 0 12 22" />
            </svg>
            <h2 className="text-3xl font-bold mt-4">SkillSwap</h2>
            <p className="mt-2 text-center">Exchange what you know for what you don't.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
