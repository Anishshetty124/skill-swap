import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import ProposalCard from '../components/dashboard/ProposalCard';
import ChatRequestCard from '../components/dashboard/ChatRequestCard';
import SentChatRequestCard from '../components/dashboard/SentChatRequestCard'; // Make sure this file exists
import Spinner from '../components/common/Spinner';
import { useSocketContext } from '../context/SocketContext';
import { toast } from 'react-toastify';
import ProposalCardSkeleton from '../components/dashboard/ProposalCardSkeleton';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]); // Use a single state for all tab data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received_proposals');
  const { socket } = useSocketContext();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    // Only show the full skeleton loader on the very first load
    if (data.length === 0) setLoading(true);
    try {
      if (activeTab === 'chat_requests') {
        const response = await apiClient.get('/chat-requests');
        const validData = (response.data.data || []).filter(p => !p.archivedBy?.includes(user?._id));
        setData(validData);
      } else {
        const type = activeTab === 'sent_proposals' ? 'sent' : 'received';
        const response = await apiClient.get(`/proposals?type=${type}`);
        // Filter out any items the user has archived
        const validData = (response.data.data || []).filter(p => !p.archivedBy?.includes(user?._id));
        setData(validData);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Could not load dashboard items.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect for real-time updates from sockets
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

  const handleUpdateProposal = (updatedProposal) => {
    setData(prev => prev.map(p => p._id === updatedProposal._id ? updatedProposal : p));
  };
  
  const handleDismissItem = async (item) => {
    const isProposal = item._type === 'proposal' || activeTab.includes('proposal');
    const endpoint = isProposal 
        ? `/proposals/${item._id}` 
        : `/chat-requests/${item._id}/archive`;
    try {
        await apiClient.delete(endpoint); // Assuming DELETE for proposals, PATCH for chat requests archive
        setData(prev => prev.filter(i => i._id !== item._id));
        toast.success("Item dismissed.");
    } catch (error) {
        toast.error("Failed to dismiss item.");
    }
  };

  const handleRespondToRequest = async (request, status) => {
    try {
      await apiClient.patch(`/chat-requests/${request._id}/respond`, { status });
      toast.success(`Request ${status}.`);
      if (status === 'accepted') {
        setData(prev => prev.map(req => req._id === request._id ? { ...req, status: 'accepted' } : req));
      } else {
        // If rejected, update status so the dismiss button can appear
        setData(prev => prev.map(req => req._id === request._id ? { ...req, status: 'rejected' } : req));
      }
    } catch (error) {
      toast.error("Failed to respond to request.");
    }
  };

  const renderContent = () => {
    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <ProposalCardSkeleton key={i} />)}
            </div>
        );
    }
    
    if (data.length === 0) {
        const message = {
            received_proposals: "No pending proposals received.",
            sent_proposals: "You haven't sent any proposals or chat requests.",
            chat_requests: "No pending chat requests."
        };
        return <p className="text-slate-500 italic text-center py-8">{message[activeTab]}</p>;
    }

    return (
      <div className="space-y-4">
        {data.map(item => {
          if (activeTab === 'chat_requests') {
            return <ChatRequestCard key={item._id} request={item} type="received" onRespond={handleRespondToRequest} onDismiss={() => handleDismissItem(item)} />;
          }
          
          if (activeTab === 'sent_proposals') {
            if (item._type === 'chat_request') {
              return <SentChatRequestCard key={item._id} request={item} />;
            }
            return <ProposalCard key={item._id} proposal={item} onUpdate={handleUpdateProposal} onDelete={() => handleDismissItem(item)} />;
          }
          
          if (activeTab === 'received_proposals') {
            return <ProposalCard key={item._id} proposal={item} onUpdate={handleUpdateProposal} onDelete={() => handleDismissItem(item)} />;
          }
          
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <nav className="flex flex-wrap -mb-px space-x-8">
          <button onClick={() => setActiveTab('received_proposals')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'received_proposals' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Received Proposals
          </button>
          <button onClick={() => setActiveTab('sent_proposals')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'sent_proposals' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Sent Items
          </button>
          <button onClick={() => setActiveTab('chat_requests')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'chat_requests' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Chat Requests
          </button>
        </nav>
      </div>
      {renderContent()}
    </div>
  );
};

export default Dashboard;
