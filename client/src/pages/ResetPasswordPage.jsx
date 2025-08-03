import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const ResetPasswordPage = () => {
  const { isAuthenticated, user } = useAuth(); // Get auth status and user info
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/users/reset-password', { 
        email, 
        otp: formData.otp, 
        newPassword: formData.newPassword 
      });
      setSuccess(true);
      toast.success("Password reset successfully! Please log in with your new password.");
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center">
        {success ? (
          <div>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Password Reset!</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Redirecting you to the login page...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Reset Your Password</h1>
            <p className="text-slate-600 dark:text-slate-400">
              An OTP has been sent to <strong>{email}</strong>. Please enter it below to set a new password.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-sm font-medium mb-1">Verification Code (OTP)</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength="6"
                  required
                  className="w-full px-4 py-2 text-center text-2xl tracking-[1em] bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                  {showPassword ? <EyeSlashIcon className="h-5 w-5 mt-6"/> : <EyeIcon className="h-5 w-5 mt-5"/>}
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 mt-5"/> : <EyeIcon className="h-5 w-5 mt-5"/>}
                </button>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 font-semibold text-white bg-accent-600 rounded-lg shadow-lg hover:bg-accent-700 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                {isAuthenticated ? (
                  <Link to={`/profile/${user.username}`} className="font-semibold text-accent-500 hover:underline">
                    Go back to Profile
                  </Link>
                ) : (
                  <Link to="/login" className="font-semibold text-accent-500 hover:underline">
                    Go back to Login
                  </Link>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
