import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  return (
    // The key change is here: bg-slate-50 provides a soft, off-white background for light mode
    <div className="flex flex-col min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;