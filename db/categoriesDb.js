const validator = require('validator');
const xss = require('xss');
const { queryDb } = require('./db');

// Constants
const INSERT_INTO_CATEGORIES = 'INSERT INTO categories(title) VALUES ($1) RETURNING *';
// const UPDATE_CATEGORIES = 'UPDATE categories SET title = $2  WHERE id = $1';
const READ_ALL_CATEGORIES = 'SELECT * FROM categories';
const READ_CATEGORY_BY_TITLE = 'SELECT * FROM categories WHERE title = $1';

// Validation for category
function validateCategory(title) {
  const errors = [];

  if (typeof title !== 'string' || !validator.isLength(title, { min: 1 })) {
    errors.push({
      field: 'title',
      message: 'Title must be a string of length 1',
    });
  }

  return errors;
}

// Database functions

async function create(title) {
  const validation = validateCategory(title);

  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }

  const cleanTitle = xss(title);

  const query = INSERT_INTO_CATEGORIES;

  const values = [cleanTitle];

  const result = await queryDb(query, values);

  return {
    success: true,
    validation: [],
    data: result.rows[0],
  };
}

async function readAll() {
  const query = READ_ALL_CATEGORIES;

  const result = await queryDb(query);

  return {
    success: true,
    data: result.rows,
  };
}

module.exports = {
  create,
  readAll,
  READ_CATEGORY_BY_TITLE,
  INSERT_INTO_CATEGORIES,
};
