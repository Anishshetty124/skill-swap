import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AiChat from '../common/AiChat';
import { useAuth } from '../../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/solid';
import FeedbackModal from '../common/FeedbackModal';
import BadgeNotificationModal from '../common/BadgeNotificationModal';
import PushNotificationManager from '../common/PushNotificationManager';  // keep this as you had it before

const CustomCloseButton = ({ closeToast }) => (
  <button onClick={closeToast} className="p-1">
    <XMarkIcon className="h-6 w-6 text-white" />
  </button>
);

const Layout = () => {
  const { isAuthenticated, newlyEarnedBadge, clearNewlyEarnedBadge } = useAuth();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <PushNotificationManager /> {/* kept from original */}

      <ToastContainer
        position="top-center"
        autoClose={4000}       // updated from 3000 to 4000 ms
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        draggablePercent={60}  // updated from 30 to 60
        pauseOnHover
        theme="colored"
        closeButton={CustomCloseButton}
        toastClassName="flex items-center justify-between p-2"
      />

      <Navbar onFeedbackClick={() => setIsFeedbackModalOpen(true)} /> {/* Added onFeedbackClick prop */}

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      <Footer />
      {isAuthenticated && <AiChat />}

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      <BadgeNotificationModal
        isOpen={!!newlyEarnedBadge}
        badgeName={newlyEarnedBadge}
        onClose={clearNewlyEarnedBadge}
      />
    </div>
  );
};

export default Layout;
