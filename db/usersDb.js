const { queryDb } = require('./db');

const INSERT_INTO_USERS =
  'INSERT INTO users(username, password, name, imgUrl)VALUES($1, $2, $3, $4) RETURNING *';

const INSERT_INTO_READBOOKS =
  'INSERT INTO readbooks(title, ISBN13, author, description, category)VALUES($1, $2, $3, $4, $5) RETURNING *';
const DELETE_ROW_IN_READBOOKS = 'DELETE FROM readbooks WHERE  id = $1';

async function select(tablename) {
  const query = `SELECT * FROM ${tablename}`;

  const result = await queryDb(query);

  return result;
}

module.exports = {
  select,
};
