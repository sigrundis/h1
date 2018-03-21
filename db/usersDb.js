const bcrypt = require('bcrypt');
const { queryDb } = require('./db');
const validator = require('validator');
const xss = require('xss'); // eslint-disable-line
const { readOne } = require('./booksDb');

const INSERT_INTO_USERS =
  'INSERT INTO users(username, password, name)VALUES($1, $2, $3) RETURNING *';
const FIND_USER_BY_USERNAME = 'SELECT * FROM users WHERE username = $1';
const FIND_USER_BY_ID = 'SELECT * FROM users WHERE id = $1';
const READ_ALL_USERS = 'SELECT * FROM users ORDER BY id OFFSET $1 LIMIT $2';
const UPDATE_USER_IMGURL =
  'UPDATE users SET imgurl = $2 WHERE id = $1 RETURNING *';
const READ_BOOKS_BY_USER_ID_AND_BOOK_ID =
  'SELECT * FROM readbooks WHERE userId = $1 AND bookId = $2';
const READ_BOOKS_BY_USER_ID = 'SELECT * FROM readbooks WHERE userId = $1';
const FIND_READ_BOOK_BY_READ_BOOK_ID = 'SELECT * FROM readbooks WHERE id = $1';
const INSERT_INTO_READBOOKS =
  'INSERT INTO readbooks (userId, bookId, grade, review) VALUES ($1, $2, $3, $4) RETURNING *';
const UPDATE_READ_BOOKS =
  'UPDATE readbooks SET grade = $3, review = $4 WHERE userId = $1 AND bookId = $2 RETURNING *';
const DELETE_READ_BOOK = 'DELETE FROM readbooks where id = $1 RETURNING *';

function objToCleanArray(object) {
  let array = object && Object.values(object);
  array = array.map(a => xss(a));
  return array;
}

const xssArray = array => array.map(i => xss(i));

async function select() {
  const result = await queryDb(READ_ALL_USERS, []);
  return result;
}

async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);
  return result;
}

async function findByUsername(username) {
  const result = await queryDb(FIND_USER_BY_USERNAME, [xss(username)]);
  if (result.rowCount === 1) {
    return result.rows[0];
  }
  return null;
}

async function findById(id) {
  const result = await queryDb(FIND_USER_BY_ID, [xss(id)]);
  if (result.rowCount === 1) {
    return result.rows[0];
  }
  return null;
}

async function readAll(offset, limit) {
  const cleanOffset = xss(offset);
  const cleanLimit = xss(limit);
  const values = [Number(cleanOffset), Number(cleanLimit)];

  const result = await queryDb(READ_ALL_USERS, values, 'users');

  return {
    success: true,
    result,
  };
}

async function findReadBookById(id) {
  const result = await queryDb(FIND_READ_BOOK_BY_READ_BOOK_ID, [xss(id)]);
  if (result.rowCount === 1) {
    return result.rows[0];
  }
  return null;
}

async function validateNewUser({ username, password, name } = {}) {
  const user = await findByUsername(username);
  const validationArray = [];

  if (user) {
    validationArray.push({
      field: 'username',
      error: 'Notendanafn er þegar skráð',
    });
  }

  if (
    !validator.isByteLength(username, {
      min: 3,
    })
  ) {
    validationArray.push({
      field: 'username',
      error: 'Notendanafn verður að vera amk 3 stafir',
    });
  }

  if (
    typeof password !== 'string' ||
    !validator.isByteLength(password, {
      min: 6,
    })
  ) {
    validationArray.push({
      field: 'username',
      error: 'Lykilorð verður að vera amk 6 stafir',
    });
  }

  if (
    !validator.isByteLength(name, {
      min: 1,
    })
  ) {
    validationArray.push({
      field: 'name',
      error: 'Nafn má ekki vera tómt',
    });
  }

  return validationArray;
}

async function validateUpdatedUser({ password, name } = {}) {
  const validationArray = [];
  if (
    typeof password === 'string' &&
    !validator.isByteLength(password, {
      min: 6,
    })
  ) {
    validationArray.push({
      field: 'username',
      error: 'Lykilorð verður að vera amk 6 stafir',
    });
  }

  if (
    typeof name === 'string' &&
    !validator.isByteLength(name, {
      min: 1,
    })
  ) {
    validationArray.push({
      field: 'name',
      error: 'Nafn má ekki vera tómt',
    });
  }

  return validationArray;
}

function validateReadBook({ grade, review } = {}) {
  const validationArray = [];

  if (typeof grade !== 'number' || (grade < 1) !== (grade > 5)) {
    validationArray.push({
      field: 'grade',
      error: 'Einkunn verður að vera tala á bilinu 1 - 5.',
    });
  }

  if (typeof review !== 'string') {
    validationArray.push({
      field: 'review',
      error: 'Umsögn verður að vera strengur',
    });
  }

  return validationArray;
}

async function createUser({ username, password, name } = {}) {
  const user = {
    username,
    password,
    name,
  };
  const validation = await validateNewUser(user);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }
  const hashedPassword = await bcrypt.hash(password, 11);
  user.password = hashedPassword;
  const cleanArray = objToCleanArray(user);
  const result = await queryDb(INSERT_INTO_USERS, cleanArray);
  const { id } = result.rows[0];
  return {
    success: true,
    validation: [],
    data: {
      id,
      username,
      name,
    },
  };
}

async function update({ id, password, name } = {}) {
  const userToUpdate = await findById(id);
  if (!userToUpdate) {
    return {
      success: false,
      validation: [{ error: `User with id: ${id} does not exist.` }],
      data: null,
    };
  }
  const validation = await validateUpdatedUser({ password, name });
  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }
  let insert = '';
  const values = [id];
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 11);
    insert += 'password = $2';
    values.push(xss(hashedPassword));
  }
  if (name) {
    if (values.length > 1) {
      insert += ', name = $3 ';
    } else {
      insert += 'name = $2 ';
    }
    values.push(xss(name));
  }
  const query = `UPDATE users SET ${insert} WHERE id = $1 RETURNING *`;
  const result = await queryDb(query, values);
  const updatedUser = result.rows[0];
  delete updatedUser.password;
  return {
    success: true,
    validation: [],
    data: updatedUser,
  };
}

async function updateImage({ id, imgurl } = {}) {
  const userToUpdate = await findById(id);
  if (!userToUpdate) {
    return {
      success: false,
      validation: [{ error: `User with id: ${id} does not exist.` }],
      data: null,
    };
  }
  const result = await queryDb(UPDATE_USER_IMGURL, [id, xss(imgurl)]);
  const updatedUser = result.rows[0];
  delete updatedUser.password;
  return {
    success: true,
    validation: [],
    data: updatedUser,
  };
}

async function findReadBooksByUserId({ id } = {}) {
  const query = READ_BOOKS_BY_USER_ID;

  const values = [id];

  const result = await queryDb(query, values);

  return {
    success: true,
    data: result.rows,
  };
}

async function getReadBookByBook({ id, bookId } = {}) {
  const query = READ_BOOKS_BY_USER_ID_AND_BOOK_ID;

  const values = [id, bookId];

  const result = await queryDb(query, values);

  return {
    success: true,
    data: result.rows[0],
  };
}

async function createReadBook({
  id,
  bookId,
  grade,
  review,
} = {}) {
  const validation = validateReadBook({ grade, review });
  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }

  const query = INSERT_INTO_READBOOKS;

  const values = xssArray([id, bookId, grade, review]);

  const result = await queryDb(query, values);

  return {
    success: true,
    validation: [],
    data: result.rows[0],
  };
}

async function updateReadBook(data, oldReadBook) {
  const {
    id,
    bookId,
    grade = oldReadBook.grade,
    review = oldReadBook.review,
  } = data;

  const validation = validateReadBook({ grade, review });
  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }

  const query = UPDATE_READ_BOOKS;

  const values = xssArray([id, bookId, grade, review]);

  const result = await queryDb(query, values);

  return {
    success: true,
    validation: [],
    data: result.rows[0],
  };
}

async function deleteReadBookById({ id } = {}) {
  const query = DELETE_READ_BOOK;

  const values = [id];

  const result = await queryDb(query, values);

  return {
    success: true,
    data: result.rows[0],
  };
}

module.exports = {
  select,
  comparePasswords,
  findByUsername,
  findById,
  createUser,
  readAll,
  update,
  updateImage,
  findReadBooksByUserId,
  readOne,
  findReadBookById,
  createReadBook,
  getReadBookByBook,
  updateReadBook,
  deleteReadBookById,
};
