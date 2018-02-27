const { queryDb } = require('./db');

const INSERT_INTO_BOOKS =
  'INSERT INTO books(title, ISBN13, author, description, category)VALUES($1, $2, $3, $4, $5) RETURNING *';
const UPDATE_BOOKS =
  'UPDATE books SET title = $2, ISBN13 = $3, author = $4, description = $5, category = $6  WHERE id = $1';

async function select(tablename) {
  const query = `SELECT * FROM ${tablename}`;

  const result = await queryDb(query);

  return result;
}

module.exports = {
  select,
};
