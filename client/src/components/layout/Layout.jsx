import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import AiChat from '../common/AiChat';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
   const { isAuthenticated } = useAuth();
  return (
    <div className="flex flex-col min-h-screen bg-blue-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      {isAuthenticated && <AiChat />} 
    </div>
  );
};

export default Layout;