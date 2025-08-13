import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import ProposalCard from '../components/dashboard/ProposalCard';
import ProposalCardSkeleton from '../components/dashboard/ProposalCardSkeleton';
import ChatRequestCard from '../components/dashboard/ChatRequestCard';
import Spinner from '../components/common/Spinner';
import { useSocketContext } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProposalList = ({ proposals, type, onUpdate, onDelete }) => {
  if (proposals.length === 0) {
    return <p className="text-slate-500 italic mt-4">No {type} proposals found.</p>;
  }
  return (
    <div className="space-y-4">
      {proposals.map(p => (
        <ProposalCard
          key={p._id}
          proposal={p}
          type={type}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('received_proposals'); // default tab
  const [proposals, setProposals] = useState([]);
  const [chatRequests, setChatRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'chat_requests') {
        const res = await apiClient.get('/chat-requests');
        setChatRequests(res.data.data || []);
      } else {
        const type = activeTab === 'sent_proposals' ? 'sent' : 'received';
        const res = await apiClient.get(`/proposals?type=${type}`);
        const validProposals = (res.data.data || [])
          .filter(p => p.requestedSkill)
          .filter(p => !p.archivedBy?.includes(user?._id));
        setProposals(validProposals);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError(`Failed to fetch ${activeTab.replace('_', ' ')}.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.state]);

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
    setProposals(prev =>
      prev.map(p => (p._id === updatedProposal._id ? updatedProposal : p))
    );
  };

  const handleProposalDelete = (deletedProposalId) => {
    setProposals(prev => prev.filter(p => p._id !== deletedProposalId));
  };

  const handleRespondToRequest = async (request, status) => {
    try {
      await apiClient.patch(`/chat-requests/${request._id}/respond`, { status });
      toast.success(`Request ${status}.`);

      if (status === 'accepted') {
        setChatRequests(prev => prev.map(req => 
          req._id === request._id ? { ...req, status: 'accepted' } : req
        ));
      } else {
        setChatRequests(prev => prev.filter(req => req._id !== request._id));
      }
    } catch (error) {
      toast.error("Failed to respond to request.");
    }
  };

  const renderContent = () => {
    if (loading) {
      if (activeTab === 'chat_requests') return <Spinner text="Loading chat requests..." />;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <ProposalCardSkeleton key={i} />
          ))}
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }
    if (activeTab === 'chat_requests') {
      return chatRequests.length > 0 ? (
        <div className="space-y-4">
          {chatRequests.map(req => (
            <ChatRequestCard key={req._id} request={req} onRespond={handleRespondToRequest} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500 italic">No pending chat requests.</p>
      );
    }
    return (
      <ProposalList
        proposals={proposals}
        type={activeTab.split('_')[0]}
        onUpdate={handleProposalUpdate}
        onDelete={handleProposalDelete}
      />
    );
  };

  const tabClass = (tabName) =>
    `py-4 px-1 border-b-2 font-medium transition-colors duration-200 ${
      activeTab === tabName
        ? 'border-accent-500 text-accent-600'
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('received_proposals')}
            className={tabClass('received_proposals')}
          >
            Received Proposals
          </button>
          <button
            onClick={() => setActiveTab('sent_proposals')}
            className={tabClass('sent_proposals')}
          >
            Sent Proposals
          </button>
          <button
            onClick={() => setActiveTab('chat_requests')}
            className={tabClass('chat_requests')}
          >
            Chat Requests
            {chatRequests.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {chatRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
