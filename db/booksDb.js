const { queryDb } = require('./db');
const validator = require('validator');
const { pagingSelect } = require('../paging');
const xss = require('xss');

const INSERT_INTO_BOOKS =
  'INSERT INTO books(title, ISBN13, author, description, categoryId)VALUES($1, $2, $3, $4, $5) RETURNING *';
const UPDATE_BOOKS =
  'UPDATE books SET title = $2, ISBN13 = $3, author = $4, description = $5, categoryId = $6  WHERE id = $1';
const UNIQUE_TITLE_UPDATE =
  'SELECT * FROM books WHERE id <> $1 AND title = $2';
const UNIQUE_ISBN13_UPDATE =
  'SELECT * FROM books WHERE id <> $1 AND ISBN13 = $2';
const UNIQUE_TITLE =
  'SELECT * FROM books WHERE title = $1';
const UNIQUE_ISBN13 =
  'SELECT * FROM books WHERE ISBN13 = $1';

function objToCleanArray(object) {
  let array = object && Object.values(object);
  array = array.map(a => xss(a));
  return array;
}

// Bætir bókum í gagnagrunninn
async function create(title, ISBN13, category, author = null, description = null) {
  const query = INSERT_INTO_BOOKS;

  const values = [title, ISBN13, author, description, category];

  const result = await queryDb(query, values);

  return result;
}

// Vinnur úr beiðnum og sendir þær áfram á gagnagrunninn
async function select(tablename) {
  const query = `SELECT * FROM ${tablename}`;

  const result = await queryDb(query);

  return result;
}

// Athugar hvort gildið er einstakt
async function checkUnique(queryCheck, id, valueCheck) {
  const query = queryCheck;
  let values = [];
  if (id) {
    values = [id, valueCheck];
  } else {
    values = [valueCheck];
  }
  const result = await queryDb(query, values);

  return {
    success: true,
    data: result.rows[0],
  };
}

// Athugar hvort það séu einhverjar villur í þeim gögnum sem sett eru inn
async function errorCheck(note) {
  const validationArray = [];
  if (!validator.isByteLength(note[1], { min: 1 })) {
    validationArray.push({
      field: 'title',
      error: 'Title must be a string of at least length 1',
    });
  }
  if (note[1].replace(/\s/g, '').length === 0) {
    validationArray.push({
      field: 'title',
      error: 'Title can not be empty ',
    });
  }
  let titleFromDB;

  if (note[0].length !== 0) {
    titleFromDB = await checkUnique(UNIQUE_TITLE_UPDATE, note[0], note[1]);
  } else {
    titleFromDB = await checkUnique(UNIQUE_TITLE, '', note[1]);
  }

  if (titleFromDB.data) {
    validationArray.push({
      field: 'title',
      error: 'Title already exists',
    });
  }
  if (!validator.isInt(note[2])) {
    validationArray.push({
      field: 'isbn13',
      error: 'isbn13 must be an integer',
    });
  }
  if (note[2].length !== 13) {
    validationArray.push({
      field: 'isbn13',
      error: 'isbn13 must be an integer of length 13',
    });
  }
  let ISBN13FromDb;

  if (note[0].length !== 0) {
    ISBN13FromDb = await checkUnique(UNIQUE_ISBN13_UPDATE, note[0], note[2]);
  } else {
    ISBN13FromDb = await checkUnique(UNIQUE_ISBN13, '', note[2]);
  }

  if (ISBN13FromDb.data) {
    validationArray.push({
      field: 'isbn13',
      error: 'isbn13 must be unique',
    });
  }
  if (note[5].length === 0) {
    validationArray.push({
      field: 'categoryid',
      error: 'categoryid must be defined',
    });
  }
  return validationArray;
}

// Bætir við bók
async function addOne({
  title,
  isbn13,
  author,
  description,
  categoryid,
} = {}) {
  const info = {
    title,
    isbn13,
    author,
    description,
    categoryid,
  };


  const values = ['', xss(title), xss(isbn13), xss(author), xss(description), xss(categoryid)];

  const validation = await errorCheck(values);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }

  const cleanArray = objToCleanArray(info);
  const result = await queryDb(INSERT_INTO_BOOKS, cleanArray);
  const { id } = result.rows[0];
  return {
    success: true,
    valdatorErrors: [],
    data: {
      id,
      title,
      isbn13,
      author,
      description,
      categoryid,
    },
  };
}

// Finnur allar bækur eða bækur sem uppfylla viðeigandi leitarstreng
async function findAll(search, offset = 0, limit = 10) {
  const info = {};

  try {
    if (!search) {
      const query = `SELECT * FROM books ORDER BY id OFFSET ${offset} LIMIT ${limit}`;
      const rows = await pagingSelect('books', [], search, query, offset, limit);

      return rows;
    }

    const searchClean = search.replace(/\s/g, '');
    if (searchClean.length === 0) {
      info.error = {
        error: 'The search string is empty',
        status: 400,
      };
      return info;
    }

    const values = [xss(search)];

    const queryAll = `SELECT * FROM books WHERE to_tsvector(title) @@ to_tsquery($1) ORDER BY id OFFSET ${offset} LIMIT ${limit}`;
    const result = await pagingSelect('books', values, search, queryAll, offset, limit);

    return await result;
  } catch (e) {
    console.error(e);
    info.error = {
      error: 'Database error has occurred',
      status: 400,
    };
    return info;
  }
}

// Uppfærir bók
async function update(id, {
  title,
  isbn13,
  author,
  description,
  categoryid,
} = {}) {
  const info = {
    id,
    title,
    isbn13,
    author,
    description,
    categoryid,
  };

  const values = ['', xss(title), xss(isbn13), xss(author), xss(description), xss(categoryid)];

  const table = await select('books');
  const item = table.rows.find(i => i.id === parseInt(id, 10));

  let validation = [];

  if (!item) {
    validation.push({
      field: 'id',
      error: `Book with id ${id} does note exist`,
    });
    return {
      success: false,
      validation,
      data: null,
    };
  }
  validation = await errorCheck(values);

  if (validation.length > 0) {
    return {
      success: false,
      validation,
      data: null,
    };
  }

  const cleanArray = objToCleanArray(info);
  await queryDb(UPDATE_BOOKS, cleanArray);
  return {
    success: true,
    valdatorErrors: [],
    data: {
      id,
      title,
      isbn13,
      author,
      description,
      categoryid,
    },
  };
}

// Finnur eina bók eftir id-inu hennar
async function readOne(id) {
  const info = {};

  try {
    const table = await select('books');
    const item = table.rows.find(i => i.id === parseInt(id, 10));

    if (item) {
      info.item = item;
    } else {
      info.error = {
        error: `Book with id ${id} does not exist`,
        status: 404,
      };
    }
    return info;
  } catch (e) {
    console.error(e);
    info.error = {
      error: 'Database error occurred',
      status: 400,
    };
    return info;
  }
}

module.exports = {
  addOne,
  readOne,
  update,
  create,
  INSERT_INTO_BOOKS,
  findAll,
};
