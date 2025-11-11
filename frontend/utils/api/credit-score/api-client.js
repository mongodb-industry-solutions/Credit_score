// frontend/utils/api/credit-score/api-client.js

// IMPORTANT: Use /api as base URL (Next.js proxy pattern)
// This points to Next.js API routes, NOT the backend directly
const API_BASE_URL = '/api';

class CreditScoreAPIClient {
  /**
   * Get credit score explanation for a user
   * @param {number} userId - The user ID to get credit score for
   * @returns {Promise<Object>} Credit score data including userProfile, userCreditProfile, etc.
   */
  static async getCreditScore(userId) {
    try {
      // Call Next.js proxy route
      // Browser calls: /api/credit-score/{userId}
      // Next.js proxies to: ${INTERNAL_API_URL}/credit_score/{userId}
      const response = await fetch(`${API_BASE_URL}/credit-score/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch credit score: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching credit score:', error);
      throw error;
    }
  }
}

export default CreditScoreAPIClient;

