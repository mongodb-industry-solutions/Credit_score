// apiConfig.js

//const API_URL = process.env.NEXT_PUBLIC_MONGODB_URL || 'default_url';
//const API_KEY = process.env.NEXT_PUBLIC_MONGODB_API_KEY || 'default_api_key';

export const apiConfig = {
  body: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "collection":"credit_history",
      "database":"bfsi-genai",
      "filter": {}
  }),
  }
  
};
