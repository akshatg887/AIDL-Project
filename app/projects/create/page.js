"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [membersRequired, setMembersRequired] = useState(2);
  const [type, setType] = useState("collaboration");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // The component no longer needs to know the user's ID.
    // It just sends the project data, and the server figures out who the user is.
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        requiredSkills: requiredSkills.split(",").map((skill) => skill.trim()),
        membersRequired: Number(membersRequired), // Ensure it's a number
        type,
      }),
    });

    if (res.ok) {
      alert("Project created successfully!");
      router.push("/dashboard");
    } else {
      const { error } = await res.json();
      setError(error || "Failed to create project.");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* Required Skills */}
            <div>
              <Label htmlFor="requiredSkills">
                Required Skills (comma-separated)
              </Label>
              <Input
                id="requiredSkills"
                type="text"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Members Required */}
            <div>
              <Label htmlFor="membersRequired">Members Required</Label>
              <Input
                id="membersRequired"
                type="number"
                value={membersRequired}
                onChange={(e) => setMembersRequired(Number(e.target.value))}
                min="1"
                required
                className="mt-1"
              />
            </div>

            {/* Project Type */}
            <div>
              <Label htmlFor="type">Project Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="collaboration">Collaboration</option>
                <option value="hackathon">Hackathon</option>
                <option value="competition">Competition</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full">
              Post Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
