// userSchema.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        techStack: { type: [String], default: [] },
      },
    ],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        duration: { type: String, required: true }, // e.g., "Jan 2024 - Present"
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
