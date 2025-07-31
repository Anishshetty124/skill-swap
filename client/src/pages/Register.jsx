import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.post('/users/register', formData);
      setSuccess(response.data.message + " Redirecting...");

      if (response.data.data.isNewUser) {
        navigate('/welcome');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
    }
  };

  const features = [
    "Trade skills, not money.",
    "Earn credits for your expertise.",
    "Connect with a local & global community.",
    "Learn something new today."
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <div className="flex w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="font-bold text-3xl mb-4">Create Your Account</h2>
          <p className="mb-8 max-w-sm text-slate-600 dark:text-slate-400">
            Join our community and start swapping skills today.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                  className="w-full px-4 py-2 border border-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                 style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                  tabIndex={-1}
                >
                  <EyeIcon className={`h-5 w-5 transition-opacity duration-200 ${showPassword ? 'opacity-0' : 'opacity-100'}`} />
                  <EyeSlashIcon className={`h-5 w-5 absolute right-3 transition-opacity duration-200 ${showPassword ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Register
            </button>
          </form>

          {error && <p className="text-sm text-center text-red-500 mt-4">{error}</p>}
          {success && <p className="text-sm text-center text-green-500 mt-4">{success}</p>}

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent-500 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="w-1/2 p-12 bg-gradient-to-br from-blue-600 to-cyan-500 hidden md:flex flex-col justify-center items-center text-white text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="white"
              d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m4.69 6.31l-1.42 1.42a3 3 0 1 1-4.24-4.24L12.45 4a8 8 0 1 1-5.66 2.34l-1.42-1.42A10 10 0 1 0 16.69 8.31"
            />
            <path
              fill="white"
              d="M12 22a10 10 0 0 0 7.07-2.93l-1.41-1.41A8 8 0 0 1 4.93 4.93l-1.41-1.41A10 10 0 0 0 12 22"
            />
          </svg>
          <h2 className="text-3xl font-bold mt-4">Unlock Your Potential</h2>
          <div className="mt-6 space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-cyan-300" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
