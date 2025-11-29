"use client";
import React, { useState } from "react";
import Link from "next/link";
import ResumePreview from "@/components/ResumePreview";
import { Button } from "@/components/ui/button";

function ResumeGeneratorPage() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [includePosts, setIncludePosts] = useState(false);
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
          includePosts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate resume content");
      }

      setResumeData(data);
      setEditedResumeContent(data.resumeContent);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating resume:", error);
      setError(
        error.message || "An error occurred while generating the resume"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditedContentChange = (newContent) => {
    setEditedResumeContent(newContent);
  };

  const backToForm = () => {
    setShowPreview(false);
    setResumeData(null);
    setEditedResumeContent(null);
  };

  if (showPreview && editedResumeContent) {
    return (
      <ResumePreview
        resumeContent={editedResumeContent}
        onEdit={handleEditedContentChange}
        onBack={backToForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              LinkedIn Resume Generator
            </h1>
            <p className="text-gray-600 text-lg">
              Transform your LinkedIn profile into a professional resume using
              AI
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left side - Form */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                🔗 LinkedIn Profile Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile URL *
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-profile/"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Make sure your LinkedIn profile is public
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description (Optional)
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here to tailor your resume..."
                    rows={6}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    AI will optimize your resume for this specific role
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includePosts"
                    checked={includePosts}
                    onChange={(e) => setIncludePosts(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="includePosts"
                    className="text-sm text-gray-700"
                  >
                    Include LinkedIn posts analysis (experimental)
                  </label>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerateResume}
                disabled={isLoading || !linkedinUrl.trim()}
                className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating Resume...
                  </>
                ) : (
                  "🚀 Generate Resume"
                )}
              </button>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                ✨ Features
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-700">
                    AI-powered content optimization
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-700">Professional formatting</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-700">Job-specific tailoring</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-700">PDF & Word export</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-gray-700">
                    Inline editing capabilities
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                📋 How it works
              </h3>
              <ol className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <span className="text-gray-700">
                    Enter your LinkedIn profile URL
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    2
                  </span>
                  <span className="text-gray-700">
                    Optionally add job description
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    3
                  </span>
                  <span className="text-gray-700">
                    AI generates optimized resume
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    4
                  </span>
                  <span className="text-gray-700">
                    Edit and download your resume
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">💡</span>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Pro Tip
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    For best results, ensure your LinkedIn profile is complete
                    and up-to-date before generating your resume. The AI works
                    better with more information!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeGeneratorPage;
