import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="text-center p-8 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-6">
          Your Complete Platform
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-indigo-600 mb-4">
          Project Collaboration & Resume Building
        </h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 mb-8">
          Find your team, join exciting projects, and create professional
          resumes from your LinkedIn profile. Everything you need to advance
          your career in one place.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
            <div className="text-indigo-600 text-3xl mb-3">🤝</div>
            <h3 className="font-semibold text-gray-800 mb-2">
              Project Group Finder
            </h3>
            <p className="text-gray-600 text-sm">
              Connect with teammates and collaborate on amazing projects
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-green-100">
            <div className="text-green-600 text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-gray-800 mb-2">
              AI Resume Generator
            </h3>
            <p className="text-gray-600 text-sm">
              Create professional resumes from your LinkedIn profile
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="py-3 px-8 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="py-3 px-8 bg-white text-indigo-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105 border border-indigo-200"
          >
            Log In
          </Link>
        </div>

        <div className="mt-6">
          <p className="text-gray-500 text-sm">
            Sign up once, access both features
          </p>
        </div>
      </div>
    </main>
  );
}
