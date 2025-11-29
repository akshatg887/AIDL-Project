import Chat from "@/components/Chat";
import TaskBoard from "@/components/TaskBoard";
import JoinButton from "@/components/JoinButton";
import { getProjectById } from "@/lib/data";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import RequestManagementPanel from "@/components/RequestManagementPanel";

export const dynamic = "force-dynamic";

export default async function ProjectWorkspacePage({ params }) {
  // Correctly access the id from params
  const id = (await params).id;
  const project = await getProjectById(id);

  if (!project) {
    return <div className="p-8">Project not found.</div>;
  }

  // Securely get the current user's ID
  const cookieStore = await cookies(); // Correctly get the cookie store without await
  const token = cookieStore.get("token")?.value;
  let currentUserId = null;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.userId;
    }
  } catch (error) {
    console.error("Invalid token:", error);
  }

  // Determine the user's role
  const isCreator = project.creator?._id.toString() === currentUserId;
  const isMember = project.members?.some(
    (member) => member._id.toString() === currentUserId
  );

  return (
    <main className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-black">{project.title}</h1>
      <p className="text-lg text-gray-500 my-2">
        Project created by{" "}
        <span className="font-semibold text-gray-700">
          {project.creator?.fullName || "a user"}
        </span>
      </p>

      {isCreator || isMember ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TaskBoard
              projectId={project._id.toString()}
              isCreator={isCreator}
            />
          </div>
          <div className="lg:col-span-1">
            <Chat projectId={project._id.toString()} />
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <p className="mb-5 text-gray-700">{project.description}</p>
          <JoinButton projectId={project._id.toString()} />
        </div>
      )}

      {isCreator && project.joinRequests && project.joinRequests.length > 0 && (
        <div className="mt-12">
          <RequestManagementPanel
            projectId={project._id.toString()}
            requests={JSON.parse(JSON.stringify(project.joinRequests))}
          />
        </div>
      )}
    </main>
  );
}
