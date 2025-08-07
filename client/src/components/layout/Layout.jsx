import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AiChat from '../common/AiChat';
import { useAuth } from '../../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/solid';
import Feedback from '../common/Feedback';

// --- NEW: Custom, accessible close button for toasts ---
const CustomCloseButton = ({ closeToast }) => (
  <button onClick={closeToast} className="p-1">
    <XMarkIcon className="h-6 w-6 text-white" />
  </button>
);

const Layout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-violet-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        draggablePercent={40} 
        pauseOnHover
        theme="colored"
        closeButton={CustomCloseButton} 
        toastClassName="flex items-center justify-between p-2" 
      />
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      <Feedback/>
      </main>
      <Footer />
      {isAuthenticated && <AiChat />}
    </div>
  );
};

export default Layout;
