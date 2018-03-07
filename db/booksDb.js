const { queryDb } = require('./db');

const INSERT_INTO_BOOKS =
  'INSERT INTO books(title, ISBN13, author, description, categoryId) VALUES($1, $2, $3, $4, $5) RETURNING *';
const UPDATE_BOOKS =
  'UPDATE books SET title = $2, ISBN13 = $3, author = $4, description = $5, categoryId = $6  WHERE id = $1';

async function create(title, ISBN13, category, author = null, description = null) {
  const query = INSERT_INTO_BOOKS;

  const values = [title, ISBN13, author, description, category];

  const result = await queryDb(query, values);

  return result;
}

module.exports = {
  create,
  INSERT_INTO_BOOKS,
};
