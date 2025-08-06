import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { toast } from 'react-toastify';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
    navigate('/register');
    return null;
  }

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.post('/users/resend-verification', { email });
      toast.success(response.data.message);
      setTimer(30); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/users/verify-otp', { email, otp });
      setSuccess(true);
      toast.success("Verification successful! Please log in.");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
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
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Redirecting you to the login page...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Verify Your Account</h1>
            <p className="text-slate-600 dark:text-slate-400">
              We've sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-left mb-1">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                  required
                  className="w-full px-4 py-2 text-center text-2xl tracking-[1em] bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 font-semibold text-white bg-accent-600 rounded-lg shadow-lg hover:bg-accent-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>
            </form>

            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Didn't receive a code?{' '}
                <button 
                  onClick={handleResendOtp}
                  disabled={resendLoading || timer > 0}
                  className="font-semibold text-accent-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : timer > 0 ? `Resend again in ${timer}s` : 'Resend OTP'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyOtpPage;
