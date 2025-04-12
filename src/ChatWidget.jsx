import React, { useState, useEffect, useRef } from "react";
import "./ChatWidget.css";
import botIconImage from "./farhan.png";

const ChatWidget = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [botDetails, setBotDetails] = useState({
    displayName: "Farhan Bar Training",
    menuConfig: {
      enabled: true,
      phone: "+923312164771",
      whatsapp: "+923312164771",
      email: "info@farhanbartrainingacademy.com",
    },
  });
  const [botIcon, setBotIcon] = useState(botIconImage);
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMenuHint, setShowMenuHint] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const initializedRef = useRef(false);

  // Define the OpenAI assistant ID
  const assistantId = "asst_jzBYR0asK0607iZb5t84nM8M";
  const [threadId, setThreadId] = useState(null);

  // Initialize chat on mount
  useEffect(() => {
    // Only run initialization once, even if effect runs twice due to StrictMode
    if (!initializedRef.current) {
      // Create a new thread
      createThread();

      // Add welcome message
      addBotMessage("Hello! How can I help you today?");

      // Show menu hint
      setShowMenuHint(true);

      initializedRef.current = true;
    }
  }, []);

  // Add a function to safely get the API key
  const getApiKey = () => {
    const apiKey =
      import.meta.env.VITE_OPENAI_API_KEY || window.env?.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(
        "OpenAI API key is not set. Please check your environment variables."
      );
      return null;
    }
    return apiKey;
  };

  // Create a new thread for OpenAI assistant
  const createThread = async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        addBotMessage(
          "Sorry, there's a configuration issue with the AI service. Please contact support."
        );
        return null;
      }

      const response = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Thread creation failed:", response.status, errorData);
        throw new Error(
          `API error: ${response.status} ${errorData.error?.message || ""}`
        );
      }

      const data = await response.json();
      setThreadId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      return null;
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add a bot message to the chat
  const addBotMessage = (text) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "assistant",
        content: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  // Add a user message to the chat
  const addUserMessage = (text) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      },
    ]);

    // Update status to delivered and then read
    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.role === "user" && msg.content === text
            ? { ...msg, status: "delivered" }
            : msg
        )
      );

      setTimeout(() => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.role === "user" && msg.content === text
              ? { ...msg, status: "read" }
              : msg
          )
        );
      }, 1000);
    }, 1000);
  };

  // Format bot response with markdown-like syntax
  const formatBotResponse = (text) => {
    if (!text) return text;

    // Format headers (h3 with ###)
    let formattedText = text.replace(
      /^###\s+(.*?)$/gm,
      '<h3 style="font-size:18px;font-weight:700;margin:12px 0 8px;color:#333;">$1</h3>'
    );

    // Format numbered lists
    formattedText = formattedText.replace(
      /(\d+\.\s)([^*\n]+)/g,
      '<span style="display:flex;margin-bottom:4px;"><span style="min-width:20px;font-weight:600;">$1</span><span>$2</span></span>'
    );

    // Format bold text
    formattedText = formattedText.replace(
      /\*\*(.*?)\*\*/g,
      '<strong style="font-weight:600;color:#4C4CFF;">$1</strong>'
    );

    // Format URLs as clickable links
    formattedText = formattedText.replace(
      /(https?:\/\/[^\s\)]+)/g,
      '<a href="$1" target="_blank" style="color:#4C4CFF;text-decoration:underline;">link</a>'
    );

    // Handle markdown links
    formattedText = formattedText.replace(
      /\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g,
      '<a href="$2" target="_blank" style="color:#4C4CFF;text-decoration:underline;">$1</a>'
    );

    // Add spacing between paragraphs
    formattedText = formattedText.replace(/\n\n/g, "<br><br>");
    formattedText = formattedText.replace(/\n/g, "<br>");

    return formattedText;
  };

  // Send message to OpenAI assistant
  const sendMessage = async (message) => {
    // Add user message to chat
    addUserMessage(message);

    // Show typing indicator
    setIsTyping(true);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setIsTyping(false);
        addBotMessage(
          "Sorry, there's a configuration issue with the AI service. Please contact support."
        );
        return;
      }

      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        if (!currentThreadId) {
          setIsTyping(false);
          addBotMessage(
            "Sorry, I couldn't establish a conversation. Please try again later."
          );
          return;
        }
      }

      // Add message to thread
      const messageResponse = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: "user",
            content: message,
          }),
        }
      );

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json().catch(() => ({}));
        console.error(
          "Adding message failed:",
          messageResponse.status,
          errorData
        );
        throw new Error(`API error: ${messageResponse.status}`);
      }

      // Run the assistant
      const runResponse = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            assistant_id: assistantId,
          }),
        }
      );

      if (!runResponse.ok) {
        const errorData = await runResponse.json().catch(() => ({}));
        console.error("Run creation failed:", runResponse.status, errorData);
        throw new Error(`API error: ${runResponse.status}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;

      // Poll for completion
      let runStatus = "queued";
      while (runStatus === "queued" || runStatus === "in_progress") {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await fetch(
          `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "OpenAI-Beta": "assistants=v2",
            },
          }
        );

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          console.error(
            "Status check failed:",
            statusResponse.status,
            errorData
          );
          throw new Error(`API error: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
      }

      // Hide typing indicator
      setIsTyping(false);

      if (runStatus === "completed") {
        // Get messages
        const messagesResponse = await fetch(
          `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "OpenAI-Beta": "assistants=v2",
            },
          }
        );

        if (!messagesResponse.ok) {
          const errorData = await messagesResponse.json().catch(() => ({}));
          console.error(
            "Getting messages failed:",
            messagesResponse.status,
            errorData
          );
          throw new Error(`API error: ${messagesResponse.status}`);
        }

        const messagesData = await messagesResponse.json();

        // Get the last assistant message
        const assistantMessages = messagesData.data.filter(
          (msg) => msg.role === "assistant"
        );
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages[0];
          addBotMessage(lastMessage.content[0].text.value);
        }
      } else {
        addBotMessage("Sorry, I encountered an error. Please try again.");
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setIsTyping(false);
      addBotMessage(
        "Sorry, there was an error processing your request. Please check the console for details."
      );
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle input submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (inputValue.trim()) {
      const message = inputValue.trim();
      setInputValue("");
      await sendMessage(message);
    }
  };

  // Handle Enter key
  const handleKeyPress = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (inputValue.trim()) {
        const message = inputValue.trim();
        setInputValue("");
        await sendMessage(message);
      }
    }
  };

  // Handle menu click
  const handleMenuClick = (type, value) => {
    switch (type) {
      case "phone":
        window.location.href = `tel:${value}`;
        break;
      case "whatsapp":
        // Format WhatsApp number
        let formattedNumber = value.replace(/\s+/g, "");
        if (!formattedNumber.startsWith("+")) {
          formattedNumber = `+${formattedNumber}`;
        }
        window.open(
          `https://wa.me/${formattedNumber.replace("+", "")}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:${value}`;
        break;
      case "meeting":
        // Open meeting URL in new tab
        window.open(value, "_blank");
        break;
      default:
        break;
    }

    setMenuOpen(false);
  };

  // Render message status indicator
  const renderMessageStatus = (status) => {
    switch (status) {
      case "sent":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        );
      case "delivered":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L7 17l-5-5" />
            <path d="M22 10L11 21l-5-5" />
          </svg>
        );
      case "read":
        return (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          >
            <path d="M18 6L7 17l-5-5" />
            <path d="M22 10L11 21l-5-5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-widget-container">
      {/* Chat header */}
      <div className="chat-widget-header">
        <div className="chat-widget-avatar">
          <img src={botIcon} alt="Bot Avatar" />
        </div>
        <div className="chat-widget-info">
          <div className="chat-widget-name">
            {botDetails?.displayName || "AI Assistant"}
          </div>
          <div className="chat-widget-status">
            <span className="chat-widget-status-dot"></span>
            <span>AI-Powered Assistant</span>
          </div>
        </div>

        {/* Menu hint animation - MODIFIED to handle click */}
        {showMenuHint && botDetails?.menuConfig?.enabled && (
          <div
            className="chat-widget-menu-hint"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ cursor: "pointer" }}
          >
            {botDetails.menuConfig.phone && (
              <div className="chat-widget-menu-hint-icon chat-widget-hint-phone">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
            )}

            {botDetails.menuConfig.whatsapp && (
              <div className="chat-widget-menu-hint-icon chat-widget-hint-whatsapp">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
            )}

            {botDetails.menuConfig.email && (
              <div className="chat-widget-menu-hint-icon chat-widget-hint-email">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            )}

            {botDetails.menuConfig.meetingUrl && (
              <div className="chat-widget-menu-hint-icon chat-widget-hint-meeting">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                </svg>
              </div>
            )}

            {/* ADD MENU DROPDOWN IN HEADER */}
            {menuOpen && (
              <div
                className="chat-widget-menu-dropdown"
                style={{ top: "40px", right: "0" }}
              >
                {botDetails.menuConfig.phone && (
                  <div
                    className="chat-widget-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick("phone", botDetails.menuConfig.phone);
                    }}
                  >
                    <div className="chat-widget-menu-icon chat-widget-phone-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="chat-widget-menu-text">
                      <span className="chat-widget-menu-title">Call us</span>
                      <span className="chat-widget-menu-subtitle">
                        Speak with us
                      </span>
                    </div>
                    <span className="chat-widget-menu-arrow">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                )}

                {botDetails.menuConfig.whatsapp && (
                  <div
                    className="chat-widget-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(
                        "whatsapp",
                        botDetails.menuConfig.whatsapp
                      );
                    }}
                  >
                    <div className="chat-widget-menu-icon chat-widget-whatsapp-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </div>
                    <div className="chat-widget-menu-text">
                      <span className="chat-widget-menu-title">
                        WhatsApp us
                      </span>
                      <span className="chat-widget-menu-subtitle">
                        Chat on WhatsApp
                      </span>
                    </div>
                    <span className="chat-widget-menu-arrow">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                )}

                {botDetails.menuConfig.email && (
                  <div
                    className="chat-widget-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick("email", botDetails.menuConfig.email);
                    }}
                  >
                    <div className="chat-widget-menu-icon chat-widget-email-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="chat-widget-menu-text">
                      <span className="chat-widget-menu-title">Email us</span>
                      <span className="chat-widget-menu-subtitle">
                        Contact via email
                      </span>
                    </div>
                    <span className="chat-widget-menu-arrow">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                )}

                {/* Add meeting URL menu item */}
                {botDetails.menuConfig.meetingUrl && (
                  <div
                    className="chat-widget-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(
                        "meeting",
                        botDetails.menuConfig.meetingUrl
                      );
                    }}
                  >
                    <div className="chat-widget-menu-icon chat-widget-meeting-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        {/* Simplified calendar icon */}
                        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                      </svg>
                    </div>
                    <div className="chat-widget-menu-text">
                      <span className="chat-widget-menu-title">Meeting</span>
                      <span className="chat-widget-menu-subtitle">
                        Book a time
                      </span>
                    </div>
                    <span className="chat-widget-menu-arrow">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className="chat-widget-close-button"
          onClick={() => window.history.back()}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>

      {/* Chat messages */}
      <div className="chat-widget-messages" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-widget-message ${
              message.role === "user"
                ? "chat-widget-user-message"
                : "chat-widget-bot-message"
            }`}
          >
            {message.role === "assistant" && (
              <div className="chat-widget-bot-avatar">
                <img src={botIcon} alt="Bot Avatar" />
              </div>
            )}
            <div className="chat-widget-message-container">
              <div className="chat-widget-message-bubble">
                {message.role === "assistant" ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatBotResponse(message.content),
                    }}
                  />
                ) : (
                  message.content
                )}
              </div>
              {message.role === "user" && (
                <div className="chat-widget-message-status">
                  <span className="chat-widget-message-time">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {message.timestamp}
                  </span>
                  {message.status && renderMessageStatus(message.status)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-widget-message chat-widget-bot-message">
            <div className="chat-widget-bot-avatar">
              <img src={botIcon} alt="Bot Avatar" />
            </div>
            <div className="chat-widget-typing-indicator">
              <div className="chat-widget-dot"></div>
              <div className="chat-widget-dot"></div>
              <div className="chat-widget-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="chat-widget-input-container">
        <form onSubmit={handleSubmit} className="chat-widget-input-form">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chat-widget-textarea"
          />
          <button type="submit" className="chat-widget-button">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Powered by footer */}
      <div className="chat-widget-footer">
        <div>
          <span>Powered by</span>
          <a
            href="https://remotehyra.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="chat-widget-pulse-dot"></span>
            remotehyra.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
