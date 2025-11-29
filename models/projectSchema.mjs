import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      required: true,
      default: [], // Ensures this field always exists
    },
    membersRequired: {
      type: Number,
      required: true,
      min: 1,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [], // Ensures this field always exists
    },
    joinRequests: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [], // Ensures this field always exists
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed"],
      default: "open",
    },
    type: {
      type: String,
      enum: ["collaboration", "hackathon", "competition"],
      required: true,
    },
  },
  { timestamps: true }
);

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
