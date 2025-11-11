// frontend/utils/api/products/api-client.js

// IMPORTANT: Use /api as base URL (Next.js proxy pattern)
// This points to Next.js API routes, NOT the backend directly
const API_BASE_URL = '/api';

class ProductsAPIClient {
  /**
   * Get product suggestions based on user profile
   * @param {Object} userProfileData - User profile data including userProfile, userId, userCreditProfile, allowedCreditLimit
   * @returns {Promise<Object>} Product recommendations with card_suggestions
   */
  static async getProductSuggestions(userProfileData) {
    try {
      // Call Next.js proxy route
      // Browser calls: /api/product-suggestions
      // Next.js proxies to: ${INTERNAL_API_URL}/product_suggestions
      const response = await fetch(`${API_BASE_URL}/product-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfileData),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product suggestions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      throw error;
    }
  }
}

export default ProductsAPIClient;

