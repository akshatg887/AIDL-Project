"use client";
import React, { useState } from "react";

export default function DebugPage() {
  const [linkedinUrl, setLinkedinUrl] = useState(
    "https://www.linkedin.com/in/akshat-gandhi-0993a0323"
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApifyLinkedIn = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/test-apify?url=${encodeURIComponent(linkedinUrl)}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnosis = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/diagnose-scraping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLinkedInAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-linkedin-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkedinUrl }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGemini = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-gemini");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testApify = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/test-apify?url=${encodeURIComponent(linkedinUrl)}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testApifyActorInfo = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-apify?test=true");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Resume Generator Debug Tools
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Test LinkedIn Profile Scraping
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              LinkedIn URL:
            </label>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="https://www.linkedin.com/in/username"
            />
          </div>
          <button
            onClick={testApifyActorInfo}
            disabled={loading}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 mr-4"
          >
            {loading ? "Testing..." : "Test Apify Setup"}
          </button>

          <button
            onClick={testApifyLinkedIn}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-4"
          >
            {loading ? "Scraping..." : "Test LinkedIn Scraping"}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Setup Requirements:
          </h3>
          <ul className="text-yellow-700 space-y-2">
            <li>
              <strong>Apify API Token:</strong> Get your token from
              console.apify.com/account/integrations
            </li>
            <li>
              <strong>LinkedIn Profile:</strong> Ensure the profile is public
              and accessible
            </li>
            <li>
              <strong>Environment Variables:</strong> Add APIFY_API_TOKEN to
              .env.local
            </li>
            <li>
              <strong>Rate Limits:</strong> Apify has rate limits - try waiting
              between tests if needed
            </li>
            <li>
              <strong>New Scraper:</strong> Now using
              dev_fusion/linkedin-profile-scraper which doesn't require LinkedIn
              cookies!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
