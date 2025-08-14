import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ notifications, onClose, onMarkAllRead, onDelete }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (notification.url) {
      navigate(notification.url);
    }
    onClose();
  };

  return (
    <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border dark:border-slate-700 z-50">
      <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold">Notifications</h3>
        <button
          onClick={onMarkAllRead}
          className="text-xs font-semibold text-blue-500 hover:underline"
          disabled={notifications.every(n => n.read)}
        >
          Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification._id}
              className="p-3 border-b dark:border-slate-700/50 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div
                onClick={() => handleNotificationClick(notification)}
                className="flex-grow cursor-pointer"
              >
                <p className={`text-sm ${!notification.read ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => onDelete(notification._id)}
                className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0"
                title="Delete notification"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-center text-slate-500">You have no new notifications.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
