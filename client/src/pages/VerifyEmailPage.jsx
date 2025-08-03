import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email, please wait...');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationStatus('error');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await apiClient.get(`/users/verify-email/${token}`);
        setVerificationStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setVerificationStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verifyToken();
  }, [token]);

  const statusInfo = {
    verifying: {
      icon: <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-500"></div>,
      color: 'text-slate-700 dark:text-slate-300',
    },
    success: {
      icon: <CheckCircleIcon className="h-16 w-16 text-green-500" />,
      color: 'text-green-700 dark:text-green-400',
    },
    error: {
      icon: <ExclamationCircleIcon className="h-16 w-16 text-red-500" />,
      color: 'text-red-700 dark:text-red-400',
    },
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20">
          {statusInfo[verificationStatus].icon}
        </div>
        <h2 className={`mt-4 text-2xl font-bold ${statusInfo[verificationStatus].color}`}>
          {verificationStatus === 'verifying' ? 'Verifying...' : verificationStatus === 'success' ? 'Success!' : 'Error'}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{message}</p>
        {verificationStatus === 'success' && (
          <Link
            to="/login"
            className="mt-6 inline-block w-full bg-accent-600 text-white font-bold py-3 px-4 rounded-md hover:bg-accent-700"
          >
            Proceed to Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
