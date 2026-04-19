import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Page not found.
      </p>
      <Link
        to="/"
        className="inline-block px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 transition"
      >
        Go Home
      </Link>
    </div>
  );
}

