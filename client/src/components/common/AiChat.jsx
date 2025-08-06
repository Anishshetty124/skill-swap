import React, { useState, useRef, useEffect } from "react";
import {
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import apiClient from "../../api/axios";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../context/AuthContext"; // 👈 1. Import useAuth

const AiChat = () => {
  const { chatMessages, updateChatMessages } = useAuth(); // 👈 2. Use state from context
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "user", text: input };
    
    // 👈 3. Update context state, which saves to sessionStorage
    updateChatMessages((prev) => [...prev, userMessage]);
    
    setInput("");
    setIsLoading(true);

    const history = chatMessages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    try {
      const response = await apiClient.post("/skills/ai-generate", {
        context: "ask-ai",
        query: input,
        history: history,
      });
      const aiMessage = { sender: "ai", text: response.data.data.response };
      // 👈 4. Update context state with AI response
      updateChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        sender: "ai",
        text:
          error.response?.data?.message ||
          "Sorry, I'm having trouble connecting. Please try again later.",
      };
      updateChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to clear chat history from context and sessionStorage
  const handleClearChat = () => {
    updateChatMessages([]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-40"
        aria-label="Open AI Chat"
      >
        <SparklesIcon className="h-8 w-8" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90%] max-w-sm h-[70vh] bg-white border border-slate-200 dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white px-2 rounded-md">AI Skill Assistant</h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleClearChat} // Use the new clear function
                className="text-sm px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {chatMessages.length === 0 && (
              <div className="text-center text-sm text-slate-500">
                Ask me anything about a skill you'd like to learn!
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-4 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`prose dark:prose-invert px-4 py-2 rounded-2xl max-w-xs break-words whitespace-pre-wrap overflow-hidden ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-slate-200 dark:bg-slate-700 shadow-md"
                  }`}
                >
                  <div className="break-words whitespace-pre-wrap [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_pre]:overflow-auto [&_code]:break-words">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-700">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t dark:border-slate-700 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a skill..."
              className="w-full px-4 py-2 dark:text-white text-black bg-slate-100 dark:bg-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiChat;
