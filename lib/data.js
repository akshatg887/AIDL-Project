import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "./dbConnect";
import { Project } from "@/models/projectSchema.mjs";
import { Task } from "@/models/taskSchema.mjs";

// This import is for side-effects, ensuring the models are registered with Mongoose
import "@/models/userSchema.mjs";

// --- USERS ---
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies(); // Await cookies in Next.js 15
    const token = cookieStore.get("token")?.value;
    if (!token) {
      console.log("No token found");
      return null;
    }

    // Securely verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // Returns { userId, fullName }
  } catch (error) {
    // If token is invalid or expired, return null
    console.error("Failed to decode token:", error);
    return null;
  }
}

// --- PROJECTS ---
export async function getProjects() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(projects));
  } catch (error) {
    console.error("Database Error (getProjects):", error);
    throw new Error("Failed to fetch projects.");
  }
}

export async function getProjectById(id) {
  try {
    await dbConnect();
    const project = await Project.findById(id)
      .populate("creator", "fullName")
      .populate("members", "fullName")
      .populate("joinRequests", "fullName")
      .lean();
    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.error("Database Error (getProjectById):", error);
    throw new Error("Failed to fetch project.");
  }
}

// --- TASKS ---
export async function getTasksByProjectId(projectId) {
  try {
    await dbConnect();
    const tasks = await Task.find({ project: projectId })
      .sort({ createdAt: "asc" })
      .lean();
    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Database Error (getTasksByProjectId):", error);
    throw new Error("Failed to fetch tasks.");
  }
}
