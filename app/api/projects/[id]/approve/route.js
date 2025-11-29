import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { Project } from "@/models/projectSchema.mjs";
import { Notification } from "@/models/notificationSchema.mjs";

export async function POST(request, { params }) {
  try {
    // 1. Get the current user's ID from the token
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;

    // 2. Get the ID of the user being approved from the request body
    const { applicantId } = await request.json();
    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: "Applicant ID is required." },
        { status: 400 }
      );
    }

    await dbConnect();
    const project = await Project.findById((await params).id);

    // 3. Authorization: Check if the current user is the project creator
    if (project.creator.toString() !== currentUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the project creator can approve requests.",
        },
        { status: 403 }
      );
    }

    // 4. Update the database: Move the applicant from joinRequests to members
    project.joinRequests.pull(applicantId);
    project.members.push(applicantId);
    await project.save();

    // 5. Create a notification for the applicant
    await Notification.create({
      recipient: applicantId,
      sender: currentUserId,
      type: "request_approved",
      message: `Your request to join the project "${project.title}" has been approved!`,
      link: `/projects/${project._id}`,
    });
    // TODO: Emit a socket event here to notify the applicant in real-time

    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error) {
    console.error("Error approving request:", error);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
