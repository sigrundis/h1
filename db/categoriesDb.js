const validator = require('validator');
const xss = require('xss');
const { queryDb } = require('./db');

// Constants
const INSERT_INTO_CATEGORIES = 'INSERT INTO categories(title) VALUES ($1) RETURNING *';
const READ_ALL_CATEGORIES = 'SELECT * FROM categories ORDER BY id OFFSET $1 LIMIT $2';
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

async function readByTitle(title) {
  const query = READ_CATEGORY_BY_TITLE;

  const values = [title];

  const result = await queryDb(query, values);

  return {
    success: true,
    data: result.rows[0],
  };
}

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

  // Check if title already exists
  const titleFromDb = await readByTitle(cleanTitle);

  if (titleFromDb.data) {
    return {
      success: false,
      validation: {
        field: 'title',
        message: 'Title already exists',
      },
      data: null,
    };
  }

  const query = INSERT_INTO_CATEGORIES;

  const values = [cleanTitle];

  const result = await queryDb(query, values);

  return {
    success: true,
    validation: [],
    data: result.rows[0],
  };
}

async function readAll(offset = 0, limit = 10) {
  const cleanOffset = xss(offset);
  const cleanLimit = xss(limit);
  const values = [Number(cleanOffset), Number(cleanLimit)];

  const result = await queryDb(READ_ALL_CATEGORIES, values, 'categories');

  return {
    success: true,
    data: result,
  };
}

module.exports = {
  create,
  readAll,
  READ_CATEGORY_BY_TITLE,
  INSERT_INTO_CATEGORIES,
};
