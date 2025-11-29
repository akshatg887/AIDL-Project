"use client";
import { useState } from "react";

export default function TestPostsPage() {
  const [input, setInput] = useState("akshat-gandhi-0993a0323");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-posts-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testActors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-linkedin-actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test LinkedIn Posts Scraper</h1>

      <div className="mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter LinkedIn username or URL"
          className="border p-2 w-full rounded"
        />
      </div>

      <button
        onClick={testPosts}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
      >
        {loading ? "Testing..." : "Test Current Posts Scraper"}
      </button>

      <button
        onClick={testActors}
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Different Actors"}
      </button>

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
