const bcrypt = require('bcrypt');
const { queryDb } = require('./db');
const validator = require('validator');
const xss = require('xss'); // eslint-disable-line

const INSERT_INTO_USERS =
  'INSERT INTO users(username, password, name)VALUES($1, $2, $3) RETURNING *';
const FIND_USER_BY_USERNAME = 'SELECT * FROM users WHERE username = $1';
const FIND_USER_BY_ID = 'SELECT * FROM users WHERE id = $1';
const READ_ALL_USERS = 'SELECT * FROM users';
const UPDATE_USERS = 'UPDATE users SET password = $2, name = $3 WHERE id = $1';

// const INSERT_INTO_READBOOKS =
//    'INSERT INTO readbooks(title, ISBN13, author, description, category)
//    VALUES($1, $2, $3, $4, $5)
//    RETURNING *';
// const DELETE_ROW_IN_READBOOKS = 'DELETE FROM readbooks WHERE  id = $1';

function objToCleanArray(object) {
  let array = object && Object.values(object);
  array = array.map(a => xss(a));
  return array;
}

async function select() {
  const result = await queryDb(READ_ALL_USERS);
  return result;
}

async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);
  return result;
}

async function findByUsername(username) {
  const result = await queryDb(FIND_USER_BY_USERNAME, [username]);
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

async function readAll() {
  const result = await queryDb(READ_ALL_USERS);
  return {
    success: true,
    data: result.rows,
  };
}

async function validateNewUser({ username, password, name } = {}) {
  const user = await findByUsername(username);

  if (user) {
    return {
      field: 'username',
      error: 'Notendanafn er þegar skráð',
    };
  }

  if (
    !validator.isByteLength(username, {
      min: 3,
    })
  ) {
    return {
      field: 'username',
      error: 'Notendanafn verður að vera amk 3 stafir',
    };
  }

  if (
    typeof password !== 'string' ||
    !validator.isByteLength(password, {
      min: 6,
    })
  ) {
    return {
      field: 'username',
      error: 'Lykilorð verður að vera amk 6 stafir',
    };
  }

  if (
    !validator.isByteLength(name, {
      min: 1,
    })
  ) {
    return {
      field: 'name',
      error: 'Nafn má ekki vera tómt',
    };
  }

  return null;
}

async function validateUpdatedUser({ password, name } = {}) {
  if (
    typeof password !== 'string' ||
    !validator.isByteLength(password, {
      min: 6,
    })
  ) {
    return {
      field: 'username',
      error: 'Lykilorð verður að vera amk 6 stafir',
    };
  }

  if (
    !validator.isByteLength(name, {
      min: 1,
    })
  ) {
    return {
      field: 'name',
      error: 'Nafn má ekki vera tómt',
    };
  }

  return null;
}

async function createUser({
  username,
  password,
  name,
} = {}) {
  const user = {
    username,
    password,
    name,
  };
  const validationMessage = await validateNewUser(user);
  if (validationMessage) {
    return {
      success: false,
      validation: validationMessage,
      data: null,
    };
  }
  const hashedPassword = await bcrypt.hash(password, 11);
  user.password = hashedPassword;
  const cleanArray = objToCleanArray(user);
  await queryDb(INSERT_INTO_USERS, cleanArray);
  // To get the id of the new user.
  const updatedTable = await select().catch(e => console.error(e));
  const newUser = updatedTable.rows.slice(-1).pop();
  const { id } = newUser;
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
  const user = { id, password, name };
  const userToUpdate = await findById(id);
  if (!userToUpdate) {
    return {
      success: false,
      validation: [{ error: `User with id: ${id} does not exist.` }],
      data: null,
    };
  }
  const validationMessage = await validateUpdatedUser({ password, name });
  if (validationMessage) {
    return {
      success: false,
      validationMessage,
      data: null,
    };
  }
  const hashedPassword = await bcrypt.hash(password, 11);
  user.password = hashedPassword;
  const cleanArray = objToCleanArray(user);
  await queryDb(UPDATE_USERS, cleanArray);
  const updatedUser = await findById(id);
  const { username, imgurl } = updatedUser;
  return {
    success: true,
    validation: [],
    data: {
      id,
      username,
      name,
      imgurl,
    },
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
};
