import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import apiClient from '../api/axios';
import { toast } from 'react-toastify';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import Spinner from '../components/common/Spinner'; // 1. Import Spinner

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showResendButton, setShowResendButton] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [timer, setTimer] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleResendVerification = async () => {
        if (!credentials.email) {
            toast.error("Please enter your email address first.");
            return;
        }
        setResendLoading(true);
        try {
            const response = await apiClient.post('/users/resend-verification', { email: credentials.email });
            toast.success(response.data.message);
            navigate('/verify-otp', { state: { email: credentials.email } });
            setTimer(30); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend email.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!credentials.email) {
            toast.error("Please enter your email or username to reset your password.");
            return;
        }
        setResendLoading(true);
        try {
            await apiClient.post('/users/forgot-password', { email: credentials.email });
            toast.success("Password reset OTP sent to your email.");
            navigate('/reset-password', { state: { email: credentials.email } });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send reset email.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setShowResendButton(false);
        setShowForgotPassword(false);
        setIsSubmitting(true);

        try {
            await login(credentials);
            
            setIsLoggingIn(true);
            
            setTimeout(() => {
            }, 1000);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            
            if (errorMessage.includes("Please verify your email")) {
                setShowResendButton(true);
            } else if (errorMessage.includes("Invalid user credentials")) {
                setShowForgotPassword(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoggingIn) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
                <Spinner text="Logging in..." />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
            <div className="flex w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                <div className="w-full md:w-1/2 p-8 md:p-12">
                    <h2 className="font-bold text-3xl mb-4">Welcome Back!</h2>
                    <p className="mb-8 max-w-sm text-slate-600 dark:text-slate-400">Log in to continue your skill-swapping journey.</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input 
                                type="text" 
                                name="email" 
                                value={credentials.email} 
                                onChange={handleChange} 
                                required 
                                placeholder="Email or Username"
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg"/>
                        </div>
                        <div className="relative">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                name="password" 
                                value={credentials.password} 
                                onChange={handleChange} 
                                required 
                                placeholder="Password"
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg"/>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                                {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-3 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </button>
                        <div className="my-6 flex items-center">
                            <div className="flex-grow border-t border-slate-300"></div>
                            <span className="mx-4 text-slate-500">OR</span>
                            <div className="flex-grow border-t border-slate-300"></div>
                        </div>
                        <GoogleLoginButton />
                    </form>

                    {error && <p className="text-sm text-center text-red-500 mt-4">{error}</p>}
                    
                    {showResendButton && (
                        <div className="text-center mt-4">
                            <button 
                                onClick={handleResendVerification}
                                disabled={resendLoading || timer > 0}
                                className="text-sm font-semibold text-accent-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendLoading ? 'Sending...' : timer > 0 ? `Resend again in ${timer}s` : 'Resend verification email'}
                            </button>
                        </div>
                    )}

                    {showForgotPassword && (
                        <div className="text-center mt-4">
                            <button 
                                onClick={handleForgotPassword}
                                disabled={resendLoading}
                                className="text-sm font-semibold text-accent-500 hover:underline disabled:opacity-50"
                            >
                                {resendLoading ? 'Sending...' : 'Forgot Password?'}
                            </button>
                        </div>
                    )}

                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-500">Don't have an account? <Link to="/register" className="font-semibold text-accent-500 hover:underline">Register now</Link></p>
                    </div>
                </div>
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
