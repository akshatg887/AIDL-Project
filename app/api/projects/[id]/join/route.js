import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { Project } from "@/models/projectSchema.mjs";
import { Notification } from "@/models/notificationSchema.mjs";

export async function POST(request, { params }) {
  try {
    // 1. Get user from token
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    await dbConnect();
    const project = await Project.findById((await params).id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // 2. Safely check user's status with the project
    const isCreator = project.creator.toString() === userId;
    const isMember = project.members && project.members.includes(userId);
    const hasRequested =
      project.joinRequests && project.joinRequests.includes(userId);

    if (isCreator || isMember || hasRequested) {
      return NextResponse.json(
        {
          success: false,
          error: "You are already involved with this project.",
        },
        { status: 400 }
      );
    }

    // 3. Add user to the joinRequests array
    project.joinRequests.push(userId);
    await project.save();

    // 4. Create a notification for the project creator
    await Notification.create({
      recipient: project.creator,
      sender: userId,
      type: "join_request",
      message: `${decoded.fullName} has requested to join your project: ${project.title}`,
      link: `/projects/${project._id}`,
    });

    // TODO: Emit a socket event to the creator here to show the notification in real-time

    return NextResponse.json(
      { success: true, message: "Join request sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /join route:", error);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
