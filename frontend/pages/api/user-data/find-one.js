// frontend/pages/api/user-data/find-one.js
// Next.js API proxy route for POST /user_data/find_one

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request body
    const body = req.body;

    if (!body || !body.filter) {
      return res.status(400).json({ error: 'Filter is required' });
    }

    // Get backend URL from environment (server-side only)
    // This env var is NOT available to the browser
    const backendUrl = process.env.INTERNAL_API_URL || 
                       process.env.NEXT_PUBLIC_API_URL || 
                       'http://localhost:8080';
    
    // Build full backend URL
    // Backend endpoint: POST /user_data/find_one
    const url = `${backendUrl}/user_data/find_one`;
    
    console.log(`🔗 Proxying POST request to: ${url}`);
    
    // Forward request to backend
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

