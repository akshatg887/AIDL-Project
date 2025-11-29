import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { Project } from "@/models/projectSchema.mjs";
import { getProjects } from "@/lib/data"; // Assumes you have this helper

// --- Handler for fetching all projects ---
export async function GET() {
  try {
    // This uses the reusable function from lib/data.js
    const projects = await getProjects();
    return NextResponse.json(
      { success: true, data: projects },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}

// --- Handler for creating a new project ---
export async function POST(request) {
  try {
    // 1. Get the user ID from the session token
    const cookieStore = await cookies(); // Correctly get the cookie store with await
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 2. Get project data from the request body
    const { title, description, requiredSkills, membersRequired, type } =
      await request.json();

    await dbConnect();

    // 3. Create the project with the user's ID as the creator
    const project = await Project.create({
      title,
      description,
      requiredSkills,
      membersRequired,
      type,
      creator: userId, // Use the ID from the token
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 400 }
    );
  }
}
