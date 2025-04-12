"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, X, Send } from "lucide-react";

export default function ChatBot() {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showTimestamp, setShowTimestamp] = useState(false);
  const messagesEndRef = useRef(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages } = 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (step === 0) {
      setUserName(input);
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: input },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "What is your email?",
        },
      ]);
      setStep(1);
      setShowTimestamp(true);
    } else if (step === 1) {
      setUserEmail(input);
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: input },
      ]);
      setStep(2);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-lg bg-white">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-full p-2 w-10 h-10 flex items-center justify-center">
            <div className="text-xl">😊</div>
          </div>
          <div>
            <div className="font-bold text-xl">CRESOL</div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              AI-Powered Customer Support
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-400 p-2 rounded-full">
            <Phone size={20} />
          </button>
          <button className="bg-blue-400 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 bg-white">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            {message.role === "assistant" && (
              <div className="inline-block bg-blue-600 rounded-full p-2 w-8 h-8 flex items-center justify-center mb-1">
                <div className="text-white text-sm">😊</div>
              </div>
            )}
            <div
              className={`inline-block p-3 rounded-2xl max-w-[80%] ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.content}
            </div>
            {message.role === "user" && index === 3 && showTimestamp && (
              <div className="text-xs text-gray-500 mt-1 flex justify-end items-center">
                15:18 <span className="text-blue-500 ml-1">✓</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-3">
        <form onSubmit={handleFormSubmit} className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="ml-2 bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 focus:outline-none"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-sm text-gray-600 border-t">
        Powered by{" "}
        <span className="text-blue-500 font-medium">● CRESOL.Ai</span>
      </div>
    </div>
  );
}
