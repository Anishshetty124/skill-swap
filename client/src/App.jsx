import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import SplashScreen from './components/common/SplashScreen';
import { AnimatePresence } from 'framer-motion';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SingleSkillPage = lazy(() => import('./pages/SingleSkillPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuthSuccessPage = lazy(() => import('./pages/AuthSuccessPage'));
const MySkillsPage = lazy(() => import('./pages/MySkillsPage'));
const CreateSkillPage = lazy(() => import('./pages/CreateSkillPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const LuckyRollPage = lazy(() => import('./pages/LuckyRollPage'));


const PageLoader = ({ text = "Loading page..." }) => (
  <div className="flex justify-center items-center h-screen">
    <Spinner text={text} />
  </div>
);

function App() {
  const [isAppLoading, setIsAppLoading] = useState(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return false;
    }
    return !sessionStorage.getItem('hasLoadedBefore');
  });

  useEffect(() => {
    if (isAppLoading) {
      const timer = setTimeout(() => {
        setIsAppLoading(false);
      }, 500); 

      sessionStorage.setItem('hasLoadedBefore', 'true');
      
      return () => clearTimeout(timer);
    }
  }, [isAppLoading]);

  return (
    <>
      <AnimatePresence>
        {isAppLoading && <SplashScreen />}
      </AnimatePresence>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-otp" element={<VerifyOtpPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            
            <Route 
              path="auth/success" 
              element={
                <Suspense fallback={<PageLoader text="Logging in..." />}>
                  <AuthSuccessPage />
                </Suspense>
              } 
            />
            
            <Route path="skills/:skillId" element={<SingleSkillPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="my-skills" element={<MySkillsPage />} />
              <Route path="skills/new" element={<CreateSkillPage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="profile/edit" element={<EditProfilePage />} />
              <Route path="lucky-roll" element={<LuckyRollPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;