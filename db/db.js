require('dotenv').config();
const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL;

const xssArray = array => array.map(i => xss(i));

async function queryDb(q, values = []) {
  const client = new Client({ connectionString });
  await client.connect();

  const cleanValues = xssArray(values);

  let result;

  try {
    result = await client.query(q, cleanValues);
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
