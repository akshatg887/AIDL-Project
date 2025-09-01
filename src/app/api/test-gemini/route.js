import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.",
        },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(
      "Say 'Hello, I am Gemini 2.0 Flash and I'm working!' in JSON format with a 'message' field."
    );
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: "Gemini API is working correctly!",
      geminiResponse: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to Gemini API: " + error.message,
        help: "Check your API key at https://makersuite.google.com/app/apikey",
      },
      { status: 500 }
    );
  }
}
