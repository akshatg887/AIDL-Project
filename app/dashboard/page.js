import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Notifications from "@/components/Notifications";
import { getCurrentUser } from "@/lib/data"; // Import user function
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  // Get the current user
  const user = await getCurrentUser();

  // Get the name from the user object
  const userName = user?.fullName;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-500">
            Hello, {userName || "User"}! Choose a feature to get started.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <LogoutButton />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
        {/* Project Group Finder Feature */}
        <Link href="/projects">
          <Card className="hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-indigo-700">
                Project Group Finder
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Find teammates, collaborate on projects, and bring your ideas to
                life. Join exciting projects or create your own and find the
                perfect team members.
              </p>
              <div className="flex justify-center">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Find Projects →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* LinkedIn Resume Generator Feature */}
        <Link href="/resume-generator">
          <Card className="hover:shadow-xl hover:border-green-300 transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                LinkedIn Resume Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Generate professional resumes from your LinkedIn profile using
                AI. Customize content, tailor for specific jobs, and download in
                PDF or Word format.
              </p>
              <div className="flex justify-center">
                <Button className="bg-green-600 hover:bg-green-700">
                  Create Resume →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Quick Actions
        </h3>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/projects/create">
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              + Create New Project
            </Button>
          </Link>
          <Link href="/resume-generator">
            <Button
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              📄 Generate Resume
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
