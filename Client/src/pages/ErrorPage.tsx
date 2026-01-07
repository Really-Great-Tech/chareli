import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1221] flex items-center justify-center px-4 transition-colors duration-300">
      <div className="text-center">
        {/* 404 Text with gradient */}
        <h1 className="text-9xl font-bold font-dmmono bg-gradient-to-r from-[#00D9FF] to-[#7B61FF] bg-clip-text text-transparent mb-4 animate-pulse">
          404
        </h1>

        {/* Error Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-[#111826] dark:text-white mb-4 font-dmmono">
          Page Not Found
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto font-dmmono">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-[#00D9FF] to-[#7B61FF] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 font-dmmono shadow-md"
          >
            Go Home
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-transparent border-2 border-[#00D9FF] text-[#00D9FF] font-semibold rounded-lg hover:bg-[#00D9FF] hover:text-white transition-all duration-200 font-dmmono"
          >
            Go Back
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 text-gray-300 dark:text-gray-600">
          <svg
            className="w-64 h-64 mx-auto opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
