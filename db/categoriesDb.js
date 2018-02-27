const { queryDb } = require('./db');

const INSERT_INTO_CATEGORIES =
  'INSERT INTO categories(title)VALUES($1) RETURNING *';
const UPDATE_CATEGORIES = 'UPDATE categories SET title = $2  WHERE id = $1';

async function select(tablename) {
  const query = `SELECT * FROM ${tablename}`;

  const result = await queryDb(query);

  return result;
}

module.exports = {
  select,
};
