"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import PropTypes from "prop-types";

// Connect to your Socket.IO server
const socket = io("http://localhost:4000");

export default function Chat({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function fetchInitialData() {
      // Fetch the current user's data from the API route
      const userRes = await fetch("/api/users/me");
      if (userRes.ok) {
        const user = await userRes.json();
        setCurrentUser(user);
        socket.emit("register", user.userId);
      }

      // Fetch historical messages
      const chatRes = await fetch(`/api/projects/${projectId}/chat`);
      if (chatRes.ok) {
        const { data } = await chatRes.json();
        if (data && data.messages) setMessages(data.messages);
      }
    }
    fetchInitialData();

    socket.emit("joinProjectRoom", projectId);

    const handleReceiveMessage = (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    };
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser) {
      const messageData = {
        sender: {
          _id: currentUser.userId,
          fullName: currentUser.fullName,
        },
        content: newMessage,
      };
      socket.emit("sendMessage", { projectId, messageData });
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-[500px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Project Chat</h2>
      <div className="flex-grow overflow-y-auto mb-4 space-y-4 p-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender._id === currentUser?.userId
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs ${
                msg.sender._id === currentUser?.userId
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="font-bold text-sm">{msg.sender.fullName}</p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow p-2 border rounded-md"
          placeholder="Type a message..."
          disabled={!currentUser}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          disabled={!currentUser}
        >
          Send
        </button>
      </form>
    </div>
  );
}

// Add PropTypes for basic type-checking in JavaScript
Chat.propTypes = {
  projectId: PropTypes.string.isRequired,
};
