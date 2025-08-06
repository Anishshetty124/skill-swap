import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AiChat from '../common/AiChat';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-blue-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        closeButton={true}
      />
      <Navbar />
      <main className="flex-grow">
        {/* This container ensures all page content has proper spacing */}
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
      {isAuthenticated && <AiChat />}
    </div>
  );
};

export default Layout;
