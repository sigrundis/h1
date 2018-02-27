const { Client } = require('pg');

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/h1';
const client = new Client(connectionString);

const INSERT_INTO_BOOKS =
  'INSERT INTO books(id, title, ISBN13, author, description, category)VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
const UPDATE_BOOKS =
  'UPDATE books SET title = $2, ISBN13 = $3, author = $4, description = $5, category = $6  WHERE id = $1';

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
