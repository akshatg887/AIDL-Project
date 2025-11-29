import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import { Notification } from "@/models/notificationSchema.mjs";

/**
 * @param {import("next/server").NextRequest} request
 */
export async function GET(request) {
  try {
    // 1. Get the token directly from the incoming request's cookies
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify the token and extract the user's ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // 3. Use the real user ID in your database query
    await dbConnect();
    const notifications = await Notification.find({
      recipient: userId,
      isRead: false,
    }).sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: notifications },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
