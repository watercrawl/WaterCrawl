import { Link } from 'react-router-dom';
import { AuthService } from '../services/authService';

export const NotFoundPage = () => {
  const token = AuthService.getInstance().getToken();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Error Message */}
        <div className="mb-16">
          <h1 className="text-9xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="mt-8 text-3xl font-semibold text-gray-900 dark:text-white">Page not found</h2>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col space-y-4 max-w-xs mx-auto">
          {!token ? (
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
          >
            Back to Home
          </Link>
          ) : (
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
          )}
        </div>
      </div>
    </div>
  );
};
