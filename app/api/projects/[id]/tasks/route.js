import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Task } from "@/models/taskSchema.mjs";

// This Next.js config line is valid in JavaScript
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  // Correctly get the 'id' from the params object
  const id = (await params).id;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Project ID is missing" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const tasks = await Task.find({ project: id }).sort({
      createdAt: "asc",
    });
    return NextResponse.json({ success: true, data: tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
