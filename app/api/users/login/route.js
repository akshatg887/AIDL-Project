import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/models/userSchema.mjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      // Note: Assumes plaintext password
      return NextResponse.json(
        { success: false, error: "Invalid credentials." },
        { status: 400 }
      );
    }

    const payload = { userId: user._id, fullName: user.fullName };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 1. Create a redirect response to the dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // 2. Set the cookie on that redirect response
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response; // 3. Return the redirect response
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login." },
      { status: 500 }
    );
  }
}
