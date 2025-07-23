import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { io } from 'socket.io-client';

const ProposalChatPage = () => {
  const { proposalId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial chat history
    apiClient.get(`/proposals/${proposalId}/messages`).then(response => {
      setMessages(response.data.data);
    });

    // Connect to WebSocket server
    const newSocket = io(import.meta.env.VITE_API_BASE_URL.replace("/api/v1", ""));
    setSocket(newSocket);
    
    // Explicitly join the chat room for this proposal
    newSocket.emit('join_chat', proposalId);

    // Listen for new incoming messages from the server
    newSocket.on('receive_message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // Disconnect when the component unmounts
    return () => newSocket.disconnect();
  }, [proposalId]);

  // Automatically scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !socket) return;

    // Send the new message to the server
    socket.emit('send_message', {
      proposalId,
      senderId: user._id,
      content: newMessage,
    });

    // Clear the input field
    setNewMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg._id} className={`flex mb-4 ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender._id === user._id ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <p className="font-bold text-sm">{msg.sender.username}</p>
              <p className="break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Type a message..."
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Send</button>
        </div>
      </form>
    </div>
  );
};

export default ProposalChatPage;