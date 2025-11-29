import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { Notification } from "@/models/notificationSchema.mjs";

export async function POST(request) {
  try {
    // 1. Get the user from the token
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

    // 2. Update all unread notifications for this user
    await Notification.updateMany(
      { recipient: userId, isRead: false }, // Find all documents matching this filter
      { $set: { isRead: true } } // Update their isRead field to true
    );

    return NextResponse.json(
      { success: true, message: "Notifications marked as read." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
