import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv"; // Import the full package

// Explicitly load the .env.local file
dotenv.config({ path: ".env.local" });

// Import your Mongoose models using ES Module syntax
import { Conversation } from "./models/conversationSchema.mjs";
import { Task } from "./models/taskSchema.mjs";

const app = express();
const httpServer = createServer(app);

// --- Database Connection ---
// Now, process.env.MONGODB_URI will have the correct value
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected for socket server."))
  .catch((err) => console.error("MongoDB connection error:", err));

// ... (rest of your server.mjs file)

// --- Socket.IO Server Setup ---
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Your Next.js app URL
    methods: ["GET", "POST"],
  },
});

// In-memory map to track which user ID belongs to which socket ID
const userSocketMap = {}; // { userId: socketId }

// --- Socket Event Handling ---
io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Link a user's ID to their socket connection
  socket.on("register", (userId) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log("User registered:", userSocketMap);
    }
  });

  // Allow a user to join a project-specific room
  socket.on("joinProjectRoom", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined room ${projectId}`);
  });

  // Handle incoming chat messages
  socket.on("sendMessage", async ({ projectId, messageData }) => {
    try {
      await Conversation.findOneAndUpdate(
        { project: projectId },
        { $push: { messages: messageData } },
        { upsert: true, new: true }
      );
      socket.to(projectId).emit("receiveMessage", messageData);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Handle sending a private, real-time notification
  socket.on("sendNotification", ({ recipientId, notificationData }) => {
    const recipientSocketId = userSocketMap[recipientId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveNotification", notificationData);
    }
  });

  // Handle creating a new task
  socket.on("createTask", async ({ projectId, taskData }) => {
    try {
      const newTask = await Task.create({ ...taskData, project: projectId });
      io.to(projectId).emit("taskCreated", newTask);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  });

  // Handle updating a task's status
  socket.on("updateTaskStatus", async ({ projectId, taskId, newStatus }) => {
    try {
      await Task.findByIdAndUpdate(taskId, { status: newStatus });
      io.to(projectId).emit("taskStatusUpdated", { taskId, newStatus });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  });

  // Clean up when a user disconnects
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        console.log("Cleaned up user:", userId);
        break;
      }
    }
  });
});

// --- Start the Server ---
const PORT = process.env.SOCKET_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
