import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, TrashIcon } from '@heroicons/react/24/solid';

const StatusBadge = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const statusStyles = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        accepted: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    };
    return (
        <span className={`${baseClasses} ${statusStyles[status] || ''}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const ChatRequestCard = ({ request, type, onRespond, onDelete }) => {
  // Determine who the "other user" is based on the type of card
  const otherUser = type === 'received' ? request.requester : request.receiver;
  const navigate = useNavigate();

  if (!otherUser) {
    // Gracefully handle cases where the other user's account might have been deleted
    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-md">
            <p className="text-slate-500 italic">This chat request is no longer valid as the user's account has been removed.</p>
        </div>
    );
  }

  const handleGoToChat = () => {
    navigate('/messages', { state: { newConversationWith: otherUser } });
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
      <Link to={`/profile/${otherUser.username}`} className="flex items-center gap-3">
        <img 
          src={otherUser.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${otherUser.firstName} ${otherUser.lastName}`} 
          alt={otherUser.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold">
            {type === 'received' ? `Request from ${otherUser.firstName} ${otherUser.lastName}` : `Request to ${otherUser.firstName} ${otherUser.lastName}`}
          </p>
          <p className="text-sm text-slate-500">@{otherUser.username}</p>
        </div>
      </Link>
      
      <div className="flex gap-3 flex-shrink-0 items-center">
        {/* --- RECEIVED REQUESTS --- */}
        {type === 'received' && request.status === 'pending' && (
          <>
            <button onClick={() => onRespond(request, 'accepted')} className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600">Accept</button>
            <button onClick={() => onRespond(request, 'rejected')} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600">Reject</button>
          </>
        )}
        {type === 'received' && request.status === 'accepted' && (
            <button onClick={handleGoToChat} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">
                <ChatBubbleLeftRightIcon className="h-5 w-5" /> Chat
            </button>
        )}
        {type === 'received' && request.status === 'rejected' && (
            <StatusBadge status={request.status} />
        )}

        {/* --- SENT REQUESTS --- */}
        {type === 'sent' && (
          <StatusBadge status={request.status} />
        )}

        {/* --- DELETE BUTTON (for non-pending received requests, or any sent request) --- */}
        {(type === 'sent' || (type === 'received' && request.status !== 'pending')) && (
          <button 
            onClick={() => onDelete(request._id)} 
            className="p-1 text-slate-400 hover:text-red-500"
            title="Delete this request"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatRequestCard;
