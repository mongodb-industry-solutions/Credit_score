import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const { col, merchant, zip, cc_num } = req.query;

  if (!col) {
    return res.status(400).json({ error: 'Both col parameter is required.' });
  } else if (col === 'usr_auth_rule_data' && !cc_num) {
    return res.status(400).json({ error: 'Both col and cc_num parameters are required.' });
  } else if (col === 'usr_auth_rmerchantsule_data' && !zip && !merchant) {
    return res.status(400).json({ error: 'Both col, zip and merchant parameters are required.' });
  }

  try {
    const dbName = process.env.NEXT_PUBLIC_MONGODB_DB;
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(col);

    let filter;
    if (col === 'usr_auth_rule_data') {
      filter = { "cc_num": parseInt(cc_num) };
    } else {
      filter = { "merchant": merchant, "zip": parseInt(zip) };
    } 
    const data = await collection.find(filter).limit(1).toArray();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error querying database:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
