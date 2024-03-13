// pages/api/updateOne.js

import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const { filter, update } = req.body;

    console.log('body:', req.body);
    console.log('filter:', filter);
    console.log('update:', update);

    const client = await clientPromise;
    const db = client.db('bfsi-genai');
    const coll = db.collection('credit_history');

    const data = await coll.updateOne(filter,update);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
