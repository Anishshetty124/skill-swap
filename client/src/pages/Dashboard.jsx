import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import ProposalCard from '../components/dashboard/ProposalCard';
import ChatRequestCard from '../components/dashboard/ChatRequestCard';
import ProposalCardSkeleton from '../components/dashboard/ProposalCardSkeleton';
import { useSocketContext } from '../context/SocketContext';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocketContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'received_proposals');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setData([]);
    try {
      let response;
      if (activeTab === 'chat_requests') {
        response = await apiClient.get('/chat-requests');
      } else {
        const type = activeTab === 'sent_proposals' ? 'sent' : 'received';
        response = await apiClient.get(`/proposals?type=${type}`);
      }

      const validData = (response.data.data || [])
        .filter(item => !item.archivedBy?.includes(user?._id))
        .filter(item => activeTab.includes('proposal') ? item.requestedSkill : true);

      setData(validData);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Could not load dashboard items.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleUpdate = () => fetchData();
    socket?.on('swap_completed', handleUpdate);
    socket?.on('new_notification', handleUpdate);
    socket?.on('new_chat_request', handleUpdate);
    return () => {
      socket?.off('swap_completed', handleUpdate);
      socket?.off('new_notification', handleUpdate);
      socket?.off('new_chat_request', handleUpdate);
    };
  }, [socket, fetchData]);

  const handleProposalUpdate = (updatedProposal) => {
    setData(prevData =>
      prevData.map(item =>
        item._id === updatedProposal._id ? updatedProposal : item
      )
    );
  };

  const handleRespondToRequest = async (request, status) => {
    try {
      await apiClient.patch(`/chat-requests/${request._id}/respond`, { status });
      toast.success(`Request ${status}.`);
      setData(prev =>
        prev.map(req =>
          req._id === request._id ? { ...req, status } : req
        )
      );
    } catch (error) {
      toast.error('Failed to respond to request.');
    }
  };

  const handleDeleteItem = async (item) => {
    const isProposal = activeTab.includes('proposal');
    const endpoint = isProposal ? `/proposals/${item._id}` : `/chat-requests/${item._id}`;

    if (window.confirm('Are you sure you want to permanently delete this item?')) {
      try {
        await apiClient.delete(endpoint);
        setData(prev => prev.filter(i => i._id !== item._id));
        toast.success('Item deleted.');
      } catch (error) {
        toast.error('Failed to delete item.');
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <ProposalCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (data.length === 0) {
      const message = {
        received_proposals: 'No proposals received.',
        sent_proposals: "You haven't sent any proposals.",
        chat_requests: 'You have no message requests.',
      };
      return (
        <p className="text-slate-500 italic text-center py-8">
          {message[activeTab]}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {data.map(item => {
          if (activeTab === 'chat_requests' && (!item.requester || !item.receiver)) {
            return null;
          }

          if (activeTab === 'chat_requests') {
            const type = item.requester._id === user._id ? 'sent' : 'received';
            return (
              <ChatRequestCard
                key={item._id}
                request={item}
                type={type}
                onRespond={handleRespondToRequest}
                onDelete={() => handleDeleteItem(item)}
              />
            );
          }

          if (activeTab === 'sent_proposals') {
            return (
              <ProposalCard
                key={item._id}
                proposal={item}
                type="sent"
                onUpdate={handleProposalUpdate}
                onActionComplete={fetchData}
                onDelete={() => handleDeleteItem(item)}
              />
            );
          }

          if (activeTab === 'received_proposals') {
            return (
              <ProposalCard
                key={item._id}
                proposal={item}
                type="received"
                onUpdate={handleProposalUpdate}
                onActionComplete={fetchData}
                onDelete={() => handleDeleteItem(item)}
              />
            );
          }

          return null;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <nav className="flex space-x-4 sm:space-x-8 -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('received_proposals')}
            className={`py-4 px-2 border-b-2 font-medium whitespace-nowrap ${
              activeTab === 'received_proposals'
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Received Proposals
          </button>
          <button
            onClick={() => setActiveTab('sent_proposals')}
            className={`py-4 px-2 border-b-2 font-medium whitespace-nowrap ${
              activeTab === 'sent_proposals'
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sent Proposals
          </button>
          <button
            onClick={() => setActiveTab('chat_requests')}
            className={`py-4 px-2 border-b-2 font-medium whitespace-nowrap ${
              activeTab === 'chat_requests'
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Message Requests
          </button>
        </nav>
      </div>
      {renderContent()}
    </div>
  );
};

export default Dashboard;
