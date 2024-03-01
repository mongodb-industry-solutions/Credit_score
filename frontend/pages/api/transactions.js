// pages/api/transactions.js

import clientPromise from '../../lib/mongodb';

export default async (req, res) => {
  let client;

  try {

    if (!process.env.NEXT_PUBLIC_MONGODB_DB) {
      throw new Error('Invalid/Missing environment variables: "NEXT_PUBLIC_MONGODB_DB"')
    }

    const dbName = process.env.NEXT_PUBLIC_MONGODB_DB;
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection('txn-data');

    const page = parseInt(req.query.page) || 1;
    const pageSize = 200;
    const skip = (page - 1) * pageSize;

    const transactions = await collection
      .find()
      .skip(skip)
      .limit(pageSize)
      .toArray();


    res.status(200).json(transactions);

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
