const { queryDb } = require('./db');

const INSERT_INTO_CATEGORIES = 'INSERT INTO categories(title) VALUES ($1) RETURNING *';
const UPDATE_CATEGORIES = 'UPDATE categories SET title = $2  WHERE id = $1';
const READ_ALL_CATEGORIES = 'SELECT * FROM categories';
const READ_CATEGORIE_BY_TITLE = 'SELECT * FROM categories WHERE title = $1';

async function create(title) {
  const query = INSERT_INTO_CATEGORIES;

  const values = [title];

  const result = await queryDb(query, values);

  return result;
}

async function readByTitle(title) {
  const query = READ_CATEGORIE_BY_TITLE;

  const values = [title];

  const result = await queryDb(query, values);

  return result;
}

module.exports = {
  create,
  readByTitle,
};
