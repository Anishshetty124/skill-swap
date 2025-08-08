import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SingleSkillPage from './pages/SingleSkillPage';
import ProfilePage from './pages/ProfilePage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import LeaderboardPage from './pages/LeaderboardPage';

const MySkillsPage = React.lazy(() => import('./pages/MySkillsPage'));
const CreateSkillPage = React.lazy(() => import('./pages/CreateSkillPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const EditProfilePage = React.lazy(() => import('./pages/EditProfilePage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));

const PageLoader = () => (
  <div className="flex justify-center items-center h-screen">
    <Spinner text="Loading page..." />
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="auth/success" element={<AuthSuccessPage />} />
          <Route path="skills/:skillId" element={<SingleSkillPage />} />
          <Route path="profile/:username" element={<ProfilePage />} />
           <Route path="leaderboard" element={<LeaderboardPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="my-skills" element={<MySkillsPage />} />
            <Route path="skills/new" element={<CreateSkillPage />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
