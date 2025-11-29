import PropTypes from "prop-types";
import RequestButtons from "./RequestButtons";

export default function RequestList({ projectsWithRequests }) {
  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        🔔 Incoming Requests
      </h2>
      {projectsWithRequests.length > 0 ? (
        <div className="space-y-4">
          {projectsWithRequests.map((project) =>
            project.joinRequests.map((request) => (
              <div key={request._id} className="p-4 border rounded-lg">
                <p className="text-gray-800">
                  <span className="font-bold">{request.fullName}</span> wants to
                  join your project:{" "}
                  <span className="font-semibold text-indigo-600">
                    {project.title}
                  </span>
                </p>
                <RequestButtons
                  projectId={project._id}
                  requestId={request._id}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <p className="text-gray-500">You have no pending requests.</p>
      )}
    </section>
  );
}

// Add PropTypes for runtime type-checking and documentation
RequestList.propTypes = {
  projectsWithRequests: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      joinRequests: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          fullName: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
};
