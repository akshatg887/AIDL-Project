"use client";

import PropTypes from "prop-types";

export default function RequestButtons({ projectId, requestId }) {
  const handleApprove = async () => {
    // TODO: Implement API call to approve the request
    console.log(`Approving request ${requestId} for project ${projectId}`);
    alert(`Approved request from user ${requestId}!`);
    // Example: await fetch(`/api/projects/${projectId}/approve`, { method: 'POST', body: JSON.stringify({ userId: requestId }) });
  };

  const handleDecline = async () => {
    // TODO: Implement API call to decline the request
    console.log(`Declining request ${requestId} for project ${projectId}`);
    alert(`Declined request from user ${requestId}!`);
    // Example: await fetch(`/api/projects/${projectId}/decline`, { method: 'POST', body: JSON.stringify({ userId: requestId }) });
  };

  return (
    <div className="mt-3 flex items-center gap-4">
      <button
        onClick={handleApprove}
        className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        Approve
      </button>
      <button
        onClick={handleDecline}
        className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
      >
        Decline
      </button>
    </div>
  );
}

// Add PropTypes for basic type-checking in JavaScript
RequestButtons.propTypes = {
  projectId: PropTypes.string.isRequired,
  requestId: PropTypes.string.isRequired,
};
