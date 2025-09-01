"use client";
import React, { useState } from "react";
import ResumePreview from "@/components/ResumePreview";

function page() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [editedResumeContent, setEditedResumeContent] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleGenerateResume = async () => {
    if (!linkedinUrl) {
      setError("Please enter your LinkedIn profile URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setResumeData(null);
    setShowPreview(false);

    try {
      // Use the new API to get resume content for preview
      const response = await fetch("/api/generate-resume-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkedinUrl,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate resume content");
      }

      setResumeData(data);
      setEditedResumeContent(data.resumeContent);
      setShowPreview(true);

      // Show warning if using fallback data
      if (data.warning) {
        setError(`⚠️ ${data.warning}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditResume = (updatedContent) => {
    setEditedResumeContent(updatedContent);
  };

  const handleGeneratePDF = async (finalResumeContent, format = "pdf") => {
    setIsGeneratingPDF(true);
    setError("");

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeContent: finalResumeContent,
          format: format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to generate ${format.toUpperCase()}`
        );
      }

      // Download the file automatically
      const fileBlob = new Blob(
        [Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0))],
        { type: data.mimeType }
      );

      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      setError(
        `✅ ${format.toUpperCase()} generated and downloaded successfully!`
      );
    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      setError(`Failed to generate ${format.toUpperCase()}: ` + error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
    setEditedResumeContent(null);
    setResumeData(null);
    setError("");
  };

  return (
    <div>
      {showPreview && editedResumeContent ? (
        <ResumePreview
          resumeContent={editedResumeContent}
          onEdit={handleEditResume}
          onBack={handleBackToForm}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          {/* Hero Section */}
          <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                AI-Powered Resume Builder
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Turn Your{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  LinkedIn
                </span>{" "}
                Into a Perfect Resume
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Generate a professional, ATS-optimized resume tailored to any
                job description in seconds. Just paste your LinkedIn profile URL
                and let AI do the magic.
              </p>

              {/* Input Section */}
              <div className="max-w-3xl mx-auto mb-12">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {error}
                    {error.includes("scraping") ? (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Troubleshooting steps:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>
                            Ensure the LinkedIn profile is public and accessible
                          </li>
                          <li>
                            Check if your Apify API key is valid at their
                            dashboard
                          </li>
                          <li>Try again in a few minutes (rate limiting)</li>
                          <li>
                            Visit{" "}
                            <a
                              href="/debug"
                              className="underline text-blue-600"
                            >
                              /debug
                            </a>{" "}
                            page to test API connections
                          </li>
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Success Message */}
                {showPreview && (
                  <div className="mb-4 p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
                    📝 Resume content generated! Review and edit below, then
                    generate your PDF.
                  </div>
                )}

                {resumeData && !showPreview && (
                  <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                    ✅ Resume generated successfully! Download should start
                    automatically.
                  </div>
                )}

                {/* LinkedIn URL Input */}
                <div className="mb-4 p-2 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <input
                    type="url"
                    placeholder="Paste your LinkedIn profile URL here..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-6 py-4 text-lg border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>

                {/* Job Description Input */}
                <div className="mb-4 p-2 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <textarea
                    placeholder="Paste the job description here (optional - helps tailor your resume)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 text-lg border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none"
                  />
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGenerateResume}
                    disabled={!linkedinUrl || isLoading}
                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generating Resume Preview...
                      </div>
                    ) : (
                      "Generate Resume Preview"
                    )}
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Lightning Fast
                  </h3>
                  <p className="text-gray-600 text-center">
                    Generate your resume in under 30 seconds
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ATS Optimized
                  </h3>
                  <p className="text-gray-600 text-center">
                    Beat applicant tracking systems every time
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h4a2 2 0 012 2v4a2 2 0 01-2 2h-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Job Tailored
                  </h3>
                  <p className="text-gray-600 text-center">
                    Customized for specific job descriptions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default page;
