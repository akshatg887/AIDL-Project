import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { Project } from "@/models/projectSchema.mjs";

export async function POST(request, { params }) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;

    const { applicantId } = await request.json();
    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: "Applicant ID is required." },
        { status: 400 }
      );
    }

    await dbConnect();
    const project = await Project.findById((await params).id);

    // Authorization: Check if the current user is the project creator
    if (project.creator.toString() !== currentUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the project creator can decline requests.",
        },
        { status: 403 }
      );
    }

    // Use .pull() to remove the applicant's ID from the joinRequests array
    project.joinRequests.pull(applicantId);
    await project.save();

    return NextResponse.json(
      { success: true, message: "Request declined." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error declining request:", error);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
