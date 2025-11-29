import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Notifications from "@/components/Notifications";
import { getProjects, getCurrentUser } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  // Fetch user and projects in parallel
  const [user, projects] = await Promise.all([getCurrentUser(), getProjects()]);

  // Get the name from the user object
  const userName = user?.fullName;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Project Group Finder
          </h1>
          <p className="text-gray-500">
            Find your team and collaborate on amazing projects!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
          <Notifications />
          <Link href="/projects/create">
            <Button>+ Create Project</Button>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div>
        <h2 className="text-2xl font-bold mb-4">Open Projects</h2>
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              href={`/projects/${project._id}`}
              key={project._id}
              className="block"
            >
              <Card className="hover:shadow-md hover:border-indigo-200 transition-all">
                <CardHeader>
                  <CardTitle className="text-indigo-700">
                    {project.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {project.description?.substring(0, 150) || ""}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {project.members?.length || 0} member
                        {(project.members?.length || 0) !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline">
                        {project.joinRequests?.length || 0} request
                        {(project.joinRequests?.length || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      by {project.creator?.fullName || "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects available yet.</p>
              <Link href="/projects/create">
                <Button>Create the first project!</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
