// pages/api/findOne.js

import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const { filter } = req.body;

    const client = await clientPromise;
    const db = client.db('bfsi-genai');
    const coll = db.collection('user_data');

    const data = await coll.findOne(filter);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
