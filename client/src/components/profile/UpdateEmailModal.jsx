import React, { useState } from 'react';
import apiClient from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UpdateEmailModal = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('enter-email'); // 'enter-email' or 'enter-otp'
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/users/me/request-email-change', { newEmail });
      toast.success('Verification OTP sent to your new email address.');
      setStep('enter-otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/users/me/verify-email-change', { otp });
      toast.success("Email updated successfully! Please log in again for security.");
      logout(); // For security, force a re-login after a successful email change
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or OTP has expired.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    // Reset state when closing the modal
    setStep('enter-email');
    setNewEmail('');
    setOtp('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
        {step === 'enter-email' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Change Email Address</h2>
            <p className="text-sm text-slate-500 mb-6">An OTP will be sent to your new email address to verify it.</p>
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={handleClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-md font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50">
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'enter-otp' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Verify New Email</h2>
            <p className="text-sm text-slate-500 mb-6">Enter the 6-digit code we sent to <strong>{newEmail}</strong>.</p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Verification Code</label>
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                  required
                  className="w-full px-4 py-2 text-center text-2xl tracking-[0.5em] bg-slate-100 dark:bg-slate-700 rounded-md"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={handleClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-md font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50">
                  {loading ? "Verifying..." : "Verify & Update"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateEmailModal;
