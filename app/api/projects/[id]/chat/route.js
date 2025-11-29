import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Conversation } from "@/models/conversationSchema.mjs";

export async function GET(request, { params }) {
  // Correctly get the 'id' from the params object
  const id = (await params).id;

  try {
    await dbConnect();
    const conversation = await Conversation.findOne({
      project: id,
    }).populate("messages.sender", "fullName");

    return NextResponse.json(
      { success: true, data: conversation },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
