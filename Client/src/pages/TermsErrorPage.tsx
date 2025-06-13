import React from 'react';

const TermsErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-white flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#18192b] dark:text-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">Terms File Missing</h1>
        <p className="text-gray-600 mb-6 dark:text-white">
          Contact admin to upload a terms file to continue.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-[#D946EF] hover:bg-[#C026D3] text-white px-6 py-2 rounded-md transition"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default TermsErrorPage;
