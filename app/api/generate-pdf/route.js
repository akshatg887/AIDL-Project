import { NextResponse } from "next/server";
import { ResumeGenerator } from "@/lib/resumeGenerator";
import WordResumeGenerator from "@/lib/wordResumeGenerator";

export async function POST(request) {
  try {
    const { resumeContent, format = "pdf" } = await request.json();

    if (!resumeContent) {
      return NextResponse.json(
        { error: "Resume content is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!resumeContent.personalInfo?.name) {
      return NextResponse.json(
        { error: "Personal information with name is required" },
        { status: 400 }
      );
    }

    let fileBuffer;
    let filename;
    let mimeType;

    if (format === "word" || format === "docx") {
      // Generate Word document
      const wordGenerator = new WordResumeGenerator();
      fileBuffer = await wordGenerator.generate(resumeContent);
      filename = `${resumeContent.personalInfo.name.replace(
        /\s+/g,
        "_"
      )}_Resume.docx`;
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else {
      // Generate PDF (default)
      const resumeGenerator = new ResumeGenerator();
      fileBuffer = resumeGenerator.generate(resumeContent);
      filename = `${resumeContent.personalInfo.name.replace(
        /\s+/g,
        "_"
      )}_Resume.pdf`;
      mimeType = "application/pdf";
    }

    // Return the file as base64
    const base64File = Buffer.from(fileBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      file: base64File,
      resume: base64File, // backward compatibility
      filename,
      mimeType,
      format,
    });
  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: "Failed to generate document: " + error.message },
      { status: 500 }
    );
  }
}
