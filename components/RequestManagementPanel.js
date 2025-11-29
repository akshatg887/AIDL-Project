"use client";

import { useRouter } from "next/navigation";
import PropTypes from "prop-types";

export default function RequestManagementPanel({ projectId, requests }) {
  const router = useRouter();

  const handleAction = async (action, applicantId) => {
    const res = await fetch(`/api/projects/${projectId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId }),
    });

    if (res.ok) {
      alert(`Request ${action}d successfully.`);
      router.refresh(); // Reloads the page's data to show the updated list
    } else {
      const { error } = await res.json();
      alert(`Error: ${error || `Failed to ${action} request.`}`);
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md mt-8 border">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Manage Join Requests
      </h2>
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <p className="font-medium text-gray-700">
                {request.fullName} wants to join.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction("approve", request._id)}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction("decline", request._id)}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">There are no pending join requests.</p>
      )}
    </section>
  );
}

// Add PropTypes for basic type-checking and documentation
RequestManagementPanel.propTypes = {
  projectId: PropTypes.string.isRequired,
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      fullName: PropTypes.string.isRequired,
    })
  ).isRequired,
};
