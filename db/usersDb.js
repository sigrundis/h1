const { Client } = require('pg');

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/h1';
const client = new Client(connectionString);

const INSERT_INTO_USERS =
  'INSERT INTO users(id, username, password, name, imgUrl)VALUES($1, $2, $3, $4, $5) RETURNING *';

const INSERT_INTO_READBOOKS =
  'INSERT INTO readbooks(id, title, ISBN13, author, description, category)VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
const DELETE_ROW_IN_READBOOKS = 'DELETE FROM readbooks WHERE  id = $1';

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
