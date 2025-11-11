// frontend/utils/api/user-data/api-client.js

// IMPORTANT: Use /api as base URL (Next.js proxy pattern)
// This points to Next.js API routes, NOT the backend directly
const API_BASE_URL = '/api';

class UserDataAPIClient {
  /**
   * Find a single user document from MongoDB
   * @param {Object} filter - MongoDB filter query (e.g., { Customer_ID: 8625 })
   * @returns {Promise<Object>} User data document
   */
  static async findOne(filter) {
    try {
      // Call Next.js proxy route
      // Browser calls: /api/user-data/find-one
      // Next.js proxies to: ${INTERNAL_API_URL}/user_data/find_one
      const response = await fetch(`${API_BASE_URL}/user-data/find-one`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filter }),
      });

      if (!response.ok) {
        throw new Error(`Failed to find user data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  /**
   * Update a single user document in MongoDB
   * @param {Object} filter - MongoDB filter query (e.g., { Customer_ID: 8625 })
   * @param {Object} update - MongoDB update query (e.g., { $set: { field: value } })
   * @returns {Promise<Object>} Update result with matched_count, modified_count, etc.
   */
  static async updateOne(filter, update) {
    try {
      // Call Next.js proxy route
      // Browser calls: /api/user-data/update-one
      // Next.js proxies to: ${INTERNAL_API_URL}/user_data/update_one
      const response = await fetch(`${API_BASE_URL}/user-data/update-one`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filter, update }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }
}

export default UserDataAPIClient;

