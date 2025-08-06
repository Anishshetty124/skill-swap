import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { useEffect } from 'react';

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
  const [resendLoading, setResendLoading] = useState(false); 
  const [timer, setTimer] = useState(0); 
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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
      toast.success("Password reset successfully!");

      if (isAuthenticated) {
        toast.info("Redirecting to your profile...");
        setTimeout(() => navigate(`/profile/${user.username}`), 3000);
      } else {
        toast.info("Redirecting to the login page...");
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.post('/users/forgot-password', { email });
      toast.success(response.data.message);
      setTimer(30); // Start the 30-second timer
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
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
                Didn't receive a code?{' '}
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || timer > 0}
                  className="font-semibold text-accent-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : timer > 0 ? `Resend again in ${timer}s` : 'Resend OTP'}
                </button>
              </p>
            </div>
            
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
