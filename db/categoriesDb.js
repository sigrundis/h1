const { Client } = require('pg');

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/h1';
const client = new Client(connectionString);

const INSERT_INTO_CATEGORIES =
  'INSERT INTO categories(id, titlery)VALUES($1, $2) RETURNING *';
const UPDATE_CATEGORIES = 'UPDATE categories SET title = $2  WHERE id = $1';

async function sqlQuery(query, values) {
  try {
    await client.query(query, values);
  } catch (err) {
    console.error(err);
  }
}

async function select(tablename) {
  try {
    const res = await client.query(`SELECT * FROM ${tablename}`);
    return res;
  } catch (e) {
    console.error('Error selecting', e);
    return e;
  }
}
