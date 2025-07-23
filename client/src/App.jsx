import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // 👈 Import Dashboard
import ProtectedRoute from './components/auth/ProtectedRoute'; // 👈 Import ProtectedRoute
import SingleSkillPage from './pages/SingleSkillPage'; 
import CreateSkillPage from './pages/CreateSkillPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
         <Route path="skills/:skillId" element={<SingleSkillPage />} />
         <Route path="/profile/:username" element={<ProfilePage />} /> {/* 👈 Add this line */}
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
           <Route path="skills/new" element={<CreateSkillPage />} />
           <Route path="profile/edit" element={<EditProfilePage/>} /> 
          {/* Add other protected routes here later, e.g., /profile/edit */}
        </Route>
      </Route>
    </Routes>
  );
}

export default App;