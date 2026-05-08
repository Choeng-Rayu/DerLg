import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Simple 404 Not Found page.
 * Displays a large "404" title, a subtitle, and a button linking back to the home page.
 */
const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-9xl font-extrabold text-gray-800">404</h1>
      <p className="text-2xl font-medium text-gray-600 mb-6">Page Not Found</p>
      <Link
        to="/"
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
