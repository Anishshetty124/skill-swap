import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateSkillPage from './pages/CreateSkillPage';
import SingleSkillPage from './pages/SingleSkillPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import MySkillsPage from './pages/MySkillsPage';
import VerifyOtpPage from './pages/VerifyOtpPage'; 
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} /> 
          <Route path="skills/:skillId" element={<SingleSkillPage />} />
          <Route path="profile/:username" element={<ProfilePage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="skills/new" element={<CreateSkillPage />} />
            <Route path="my-skills" element={<MySkillsPage />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
