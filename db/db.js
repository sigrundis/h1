require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function queryDb(q, values = []) {
  const client = new Client({ connectionString });
  await client.connect();

  let result;

  try {
    result = await client.query(q, values);
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
  return result;
}

module.exports = {
  queryDb,
};
