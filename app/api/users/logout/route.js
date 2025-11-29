import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Create a response object to indicate successful logout
    const response = NextResponse.json(
      {
        message: "Logout successful",
        success: true,
      },
      { status: 200 }
    );

    // Set the cookie with an immediate expiration date to effectively delete it
    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0), // Set expiration to a past date
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
