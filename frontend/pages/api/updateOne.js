import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const { filter, update } = req.body;

    const client = await clientPromise;
    const db = client.db('bfsi-genai');
    const coll = db.collection('user_data');

    // Ensure _id is not part of the update object
    delete update.$set._id;

    const data = await coll.updateOne(filter, update);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
