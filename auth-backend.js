/**
 * HouseOfSpeed Authentication Backend Client
 *
 * Client-side JavaScript library for authentication operations.
 * Replaces Supabase auth with backend API calls.
 *
 * All functions use cookies for session management via credentials: 'include'
 */

const HOS_AUTH_BACKEND = (function() {
  'use strict';

  // Use relative URLs to work with current domain
  const API_BASE = '';

  /**
   * Helper function to handle API responses
   * Parses JSON and throws error if response is not ok
   *
   * @param {Response} response - Fetch API response object
   * @returns {Promise<Object>} Parsed JSON data
   * @throws {Error} If response is not ok
   */
  async function handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  /**
   * Register a new customer account
   *
   * @param {string} email - Customer email address
   * @param {string} password - Customer password
   * @param {string} firstName - Customer first name
   * @param {string} lastName - Customer last name
   * @param {string} phone - Customer phone number
   * @returns {Promise<Object>} User data object
   * @throws {Error} If registration fails
   */
  async function signUp(email, password, firstName, lastName, phone) {
    try {
      const response = await fetch(`${API_BASE}/api/customer/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important: Send/receive cookies
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone
        })
      });

      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  /**
   * Login a customer
   *
   * @param {string} email - Customer email address
   * @param {string} password - Customer password
   * @returns {Promise<Object>} User data object
   * @throws {Error} If login fails
   */
  async function signIn(email, password) {
    try {
      const response = await fetch(`${API_BASE}/api/customer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important: Send/receive cookies
        body: JSON.stringify({
          email,
          password
        })
      });

      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  /**
   * Logout the current customer
   * Clears session cookie on server
   *
   * @returns {Promise<Object>} Success message
   * @throws {Error} If logout fails
   */
  async function signOut() {
    try {
      const response = await fetch(`${API_BASE}/api/customer/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important: Send cookies to clear session
      });

      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Logout failed. Please try again.');
    }
  }

  /**
   * Check if customer is authenticated
   * Returns authentication status and user data if logged in
   *
   * @returns {Promise<Object>} Object with authenticated boolean and user data
   * @example
   * // Returns: { authenticated: true, user: { id: 1, email: '...', ... } }
   * // or: { authenticated: false }
   */
  async function checkAuth() {
    try {
      const response = await fetch(`${API_BASE}/api/customer/check`, {
        method: 'GET',
        credentials: 'include' // Important: Send cookies for session validation
      });

      return await handleResponse(response);
    } catch (error) {
      // If check fails, assume not authenticated
      return { authenticated: false };
    }
  }

  /**
   * Get current user (synchronous compatibility function)
   * Note: This returns null. Use checkAuth() for async authentication check.
   *
   * @returns {null} Always returns null
   * @deprecated Use checkAuth() instead for actual user data
   */
  function getUser() {
    // Synchronous function for compatibility with existing code
    // Since auth is now cookie-based, we can't get user synchronously
    // Use checkAuth() instead
    return null;
  }

  /**
   * Check if user is logged in (synchronous compatibility function)
   * Note: This returns false. Use checkAuth() for actual authentication status.
   *
   * @returns {boolean} Always returns false
   * @deprecated Use checkAuth() instead for actual authentication status
   */
  function isLoggedIn() {
    // Synchronous function for compatibility with existing code
    // Since auth is now cookie-based, we can't check synchronously
    // Use checkAuth() instead
    return false;
  }

  // Public API
  return {
    signUp,
    signIn,
    signOut,
    checkAuth,
    getUser,
    isLoggedIn
  };
})();

// Make available globally if needed
if (typeof window !== 'undefined') {
  window.HOS_AUTH_BACKEND = HOS_AUTH_BACKEND;
}
