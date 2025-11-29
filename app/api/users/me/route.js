import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Securely verify the token on the server
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return the user's data
    return NextResponse.json(
      {
        userId: decoded.userId,
        fullName: decoded.fullName,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
