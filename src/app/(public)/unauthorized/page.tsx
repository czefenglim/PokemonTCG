// app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-700 to-red-600 text-white">
      <div className="text-center space-y-4">
        <div className="text-6xl">🚫</div>
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-lg text-red-100">
          You do not have permission to view this page.
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-white text-red-700 rounded-lg hover:bg-red-100 transition"
        >
          Go Back
        </a>
      </div>
    </div>
  );
}
