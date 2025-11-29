import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Project } from "@/models/projectSchema.mjs";

export async function GET(request, { params }) {
  // Correctly get the 'id' from the params object
  const id = (await params).id;

  try {
    await dbConnect();

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}
