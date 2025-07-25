import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SingleSkillPage from './pages/SingleSkillPage';
import CreateSkillPage from './pages/CreateSkillPage';
import EditProfilePage from './pages/EditProfilePage';
import ProfilePage from './pages/ProfilePage';
import MySkillsPage from './pages/MySkillsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="skills/:skillId" element={<SingleSkillPage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
 
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="skills/new" element={<CreateSkillPage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
           <Route path="/my-skills" element={<MySkillsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;