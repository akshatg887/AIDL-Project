// notificationSchema.js

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String, // e.g., "/projects/PROJECT_ID"
    },
    type: {
      type: String,
      enum: [
        "join_request",
        "request_approved",
        "new_message",
        "task_assigned",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
