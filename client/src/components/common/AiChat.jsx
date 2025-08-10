import React, { useState, useRef, useEffect } from "react";
import {
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/solid";
import apiClient from "../../api/axios";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../context/AuthContext";

const AiChat = () => {
  const { chatMessages, updateChatMessages } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Keep inputRef in sync with input state
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Append transcript to current input value from ref
      setInput((prev) =>
        (inputRef.current ? inputRef.current + " " : "") + transcript
      );
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "user", text: input };
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

  const handleClearChat = () => {
    updateChatMessages([]);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
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
        <div className="fixed bottom-24 right-6 w-[90%] max-w-sm h-[70vh] bg-slate-100 border border-slate-200 dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white px-2 rounded-md">
              AI Skill Assistant
            </h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleClearChat}
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
            <div className="relative flex-grow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask about a skill..."}
                className="w-full px-4 pr-12 py-2 dark:text-white text-black bg-slate-100 dark:bg-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500"
                disabled={isLoading}
              />
              {recognitionRef.current && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                    isListening ? "text-red-500" : "text-slate-500"
                  }`}
                  aria-label={isListening ? "Stop Listening" : "Start Listening"}
                >
                  <MicrophoneIcon
                    className={`h-6 w-6 ${isListening ? "animate-pulse" : ""}`}
                  />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
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
