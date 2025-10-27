/**
 * API Configuration
 *
 * Centralizes all API endpoint URLs for easy switching between
 * development and production environments.
 *
 * Environment Variables:
 * - VITE_API_URL: Base URL for the backend API (set in Netlify/Vite config)
 *
 * Usage:
 *   import { API_ENDPOINTS } from './config/api';
 *   fetch(API_ENDPOINTS.standards, { ... });
 */

// Get API base URL from environment variable, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Debug: Log all environment variables
console.log('🔍 Environment Check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  'Final API_BASE_URL': API_BASE_URL
});

/**
 * API Endpoints
 * All backend API endpoints are defined here
 */
export const API_ENDPOINTS = {
  // Anthropic Chat API (proxied through backend)
  chat: `${API_BASE_URL}/api/chat`,

  // Task Collections
  collections: `${API_BASE_URL}/api/collections`,

  // Educational Standards
  standards: `${API_BASE_URL}/api/standards`,
  standardById: (id) => `${API_BASE_URL}/api/standards/${id}`,
  standardPrerequisites: (id) => `${API_BASE_URL}/api/standards/${id}/prerequisites`,

  // Session Management
  sessions: `${API_BASE_URL}/api/sessions`,
  sessionById: (id) => `${API_BASE_URL}/api/sessions/${id}`,
  deleteSession: (id) => `${API_BASE_URL}/api/sessions/${id}`,

  // Teacher endpoints
  teacherConversations: `${API_BASE_URL}/api/teacher/conversations`,
};

/**
 * Helper function to build full endpoint URLs
 * @param {string} endpoint - The endpoint key from API_ENDPOINTS
 * @param {string} [id] - Optional ID parameter
 * @returns {string} Full endpoint URL
 */
export function getEndpoint(endpoint, id) {
  if (typeof API_ENDPOINTS[endpoint] === 'function') {
    return API_ENDPOINTS[endpoint](id);
  }
  return API_ENDPOINTS[endpoint];
}

/**
 * Check if API is reachable
 * @returns {Promise<boolean>} True if API is healthy
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/standards`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

export default API_ENDPOINTS;
