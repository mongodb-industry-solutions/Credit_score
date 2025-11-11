// frontend/pages/api/credit-score/[userId].js
// Next.js API proxy route for GET /credit_score/{user_id}

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract dynamic parameter from URL
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get backend URL from environment (server-side only)
    // This env var is NOT available to the browser
    const backendUrl = process.env.INTERNAL_API_URL || 
                       process.env.NEXT_PUBLIC_API_URL || 
                       'http://localhost:8080';
    
    // Build full backend URL
    // Backend endpoint: GET /credit_score/{user_id}
    const url = `${backendUrl}/credit_score/${userId}`;
    
    console.log(`🔗 Proxying GET request to: ${url}`);
    
    // Forward request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to connect to backend',
      details: error.message,
    });
  }
}

