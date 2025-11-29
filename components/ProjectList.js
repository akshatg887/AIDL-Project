import PropTypes from "prop-types";
import Link from "next/link"; // It's better to use Next.js's Link component

export default function ProjectList({ title, projects }) {
  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
      {projects.length > 0 ? (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project._id}
              className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Link
                href={`/projects/${project._id}`}
                className="font-medium text-indigo-600"
              >
                {project.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No projects to display.</p>
      )}
    </section>
  );
}

// Add PropTypes for runtime type-checking and documentation
ProjectList.propTypes = {
  title: PropTypes.string.isRequired,
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
};
