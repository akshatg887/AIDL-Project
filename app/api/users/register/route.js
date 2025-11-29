import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/models/userSchema.mjs";

export async function POST(request) {
  try {
    await dbConnect();
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists." },
        { status: 400 }
      );
    }

    // Hashing logic removed
    const newUser = new User({
      fullName,
      email,
      password: password, // Password is now saved in plaintext
    });
    await newUser.save();

    return NextResponse.json(
      { success: true, message: "User registered successfully." },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An error occurred during registration." },
      { status: 500 }
    );
  }
}
