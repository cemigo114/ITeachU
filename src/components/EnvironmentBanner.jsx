/**
 * EnvironmentBanner Component
 *
 * Displays a prominent banner showing which environment and backend URL is being used.
 * This helps identify if you're viewing localhost vs. production deployment.
 */

import { API_ENDPOINTS } from '../config/api';

const EnvironmentBanner = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  const mode = import.meta.env.MODE;
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;

  // Show banner in all environments for clarity
  const isLocalhost = apiUrl.includes('localhost');

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-mono ${
        isLocalhost
          ? 'bg-yellow-500 text-black'
          : 'bg-green-600 text-white'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold">
            {isLocalhost ? '🔧 DEVELOPMENT' : '🚀 PRODUCTION'}
          </span>
          <span>Mode: {mode}</span>
          <span>Backend: {apiUrl}</span>
          <span>Frontend: {window.location.href}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={isDev ? 'text-white' : 'text-gray-300'}>
            DEV: {isDev ? '✓' : '✗'}
          </span>
          <span className={isProd ? 'text-white' : 'text-gray-300'}>
            PROD: {isProd ? '✓' : '✗'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentBanner;
