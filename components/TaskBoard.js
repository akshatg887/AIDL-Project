"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import PropTypes from "prop-types";

const socket = io("http://localhost:4000");

export default function TaskBoard({ projectId, isCreator }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch the current user's data from the API
    async function fetchUser() {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      }
    }
    fetchUser();

    // Fetch initial tasks
    async function fetchTasks() {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (res.ok) {
        const { data } = await res.json();
        if (data) setTasks(data);
      }
    }
    fetchTasks();

    // Join room and listen for updates
    socket.emit("joinProjectRoom", projectId);
    socket.on("taskCreated", (newTask) =>
      setTasks((prev) => [...prev, newTask])
    );
    socket.on("taskStatusUpdated", ({ taskId, newStatus }) => {
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
    });

    return () => {
      socket.off("taskCreated");
      socket.off("taskStatusUpdated");
    };
  }, [projectId]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!isCreator || !newTaskTitle.trim() || !currentUser) return;

    // Use the real user ID from the session
    const taskData = {
      title: newTaskTitle,
      status: "todo",
      createdBy: currentUser.userId,
    };

    socket.emit("createTask", { projectId, taskData });
    setNewTaskTitle("");
  };

  const handleStatusChange = (taskId, newStatus) => {
    socket.emit("updateTaskStatus", { projectId, taskId, newStatus });
  };

  const columns = ["todo", "in-progress", "completed"];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Task Board</h2>

      {isCreator && (
        <form onSubmit={handleCreateTask} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow p-2 border rounded-md"
          />
          <button
            type="submit"
            disabled={!currentUser}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            Add Task
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((status) => (
          <div key={status} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold capitalize mb-4 text-gray-700">
              {status.replace("-", " ")}
            </h3>
            <div className="space-y-3 min-h-[200px]">
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <div
                    key={task._id}
                    className="bg-white p-3 rounded-md shadow"
                  >
                    <p>{task.title}</p>
                    <div className="text-xs mt-2 space-x-1">
                      {status !== "todo" && (
                        <button
                          onClick={() => handleStatusChange(task._id, "todo")}
                          className="text-blue-500 hover:underline"
                        >
                          Todo
                        </button>
                      )}
                      {status !== "in-progress" && (
                        <button
                          onClick={() =>
                            handleStatusChange(task._id, "in-progress")
                          }
                          className="text-orange-500 hover:underline"
                        >
                          In Progress
                        </button>
                      )}
                      {status !== "completed" && (
                        <button
                          onClick={() =>
                            handleStatusChange(task._id, "completed")
                          }
                          className="text-green-500 hover:underline"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add PropTypes for basic type-checking
TaskBoard.propTypes = {
  projectId: PropTypes.string.isRequired,
  isCreator: PropTypes.bool.isRequired,
};
