const { queryDb } = require('./db');

const validator = require('validator');

const xss = require('xss');

const INSERT_INTO_BOOKS =
  'INSERT INTO books(id, title, ISBN13, author, description, categoryId) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
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
//Hér er eitthvað vandamál í hvernig strengurinn er skilgreindur
const SEARCH_BOOKS =
  'SELECT * FROM books WHERE title LIKE %$1%';

//Bætir bókum í gagnagrunninn
async function create(title, ISBN13, category, author = null, description = null) {
  const query = INSERT_INTO_BOOKS;

  const values = [title, ISBN13, author, description, category];

  const result = await queryDb(query, values);

  return result;
}

//Vinnur úr beiðnum og sendir þær áfram á gagnagrunninn
async function select(tablename) {
  const query = `SELECT * FROM ${tablename}`;

  const result = await queryDb(query);

  return result;
}

//Athugar hvort gildið er einstakt
async function checkUnique(queryCheck, id, valueCheck) {
  console.log(queryCheck);
  const query = queryCheck;
  let values = [];
  if (id) {
    values = [id, valueCheck];
  } else {
    values = [valueCheck];
  }
  console.log(values);
  const result = await queryDb(query, values);

  return {
    success: true,
    data: result.rows[0],
  };
}

//Athugar hvort það séu einhverjar villur í þeim gögnum sem sett eru inn
async function errorCheck(note) {
  console.log(note.categoryid);
  if (!validator.isByteLength(note.title, { min: 1 })) {
    return {
      field: 'title',
      error: 'Title must be a string of at least length 1',
      status: 400,
    };
  }
  if (!note.title.replace(/\s/g, '').length) {
    return {
      field: 'title',
      error: 'Title can not be empty ',
      status: 400,
    };
  }
  let titleFromDB;

  if (note.id) {
    titleFromDB = await checkUnique(UNIQUE_TITLE_UPDATE, note.id, xss(note.title));
  } else {
    titleFromDB = await checkUnique(UNIQUE_TITLE, note.id, xss(note.title));
  }
  if (titleFromDB.data) {
    return {
      field: 'title',
      error: 'Title already exists',
    };
  }
  if (!validator.isInt(note.isbn13)) {
    return {
      field: 'isbn13',
      error: 'isbn13 must be an integer',
      status: 400,
    };
  }
  if (note.isbn13.length !== 13) {
    return {
      field: 'isbn13',
      error: 'isbn13 must be an integer of length 13',
      status: 400,
    };
  }
  let ISBN13FromDb;

  if (note.id) {
    ISBN13FromDb = await checkUnique(UNIQUE_ISBN13_UPDATE, note.id, xss(note.isbn13));
  } else {
    ISBN13FromDb = await checkUnique(UNIQUE_ISBN13, note.id, xss(note.isbn13));
  }

  if (ISBN13FromDb.data) {
    return {
      field: 'isbn13',
      error: 'isbn13 must be unique',
    };
  }

  if (!note.categoryid) {
    return {
      field: 'categoryid',
      error: 'categoryid must be defined',
      status: 400,
    };
  }
  return null;
}

//Bætir við bók
async function addOne({
  title,
  isbn13,
  author,
  description,
  categoryid,
} = {}) {
  const createItem = {};
  const info = {
    title,
    isbn13,
    author,
    description,
    categoryid,
  };
  console.log(info);
  const validatorErrors = await errorCheck(info);
 
  if (validatorErrors) {
    createItem.error = {
      field: validatorErrors.field,
      error: validatorErrors.error,
      status: 400,
    };
    return createItem;
  }

  try {
    const table = await select('books');
    const nextId = table.rows.map(i => i.id).reduce((a, b) => (a > b ? a : b + 1), 1);

    const item = {
      id: nextId,
      title: xss(title),
      isbn13: xss(isbn13),
      author: xss(author),
      description: xss(description),
      categoryid: xss(categoryid),
    };
    const id = nextId;
    const cleanArray = item && Object.values(item);
    await queryDb(INSERT_INTO_BOOKS, cleanArray);
    const updateTable = await select('books');
    createItem.item = updateTable.rows.find(i => i.id === parseInt(id, 10));
    return createItem;
  } catch (e) {
    console.error(e);
    createItem.error = {
      error: 'Database error has occurred',
      status: 400,
    };
    return createItem;
  }
}

//Finnur allar bækur eða bækur sem uppfylla viðeigandi leitarstreng
async function findAll(search) {
  const info = {};
  const table = await select('books');
  

  try {
    if (!search) {
      info.data = table.rows;
      return info;
    } else {
      const searchClean = search.replace(/\s/g, '');
      if (searchClean.length === 0) {
        info.error = {
          error: 'The search string is empty',
          status: 400,
        };
        return info;
      } 
      
      const values = [xss(search)];
      const result = await queryDb(SEARCH_BOOKS, values);
  
      if (result.rows.length === 0) {
        info.error = {
          error: 'No books matching the query',
          status: 404,
        };
      }
      info.data = result.rows;
      return info;
    }
  } catch (e) {
    info.error = {
      error: 'Database error has occurred',
      status: 400,
    };
    return info;
  }  
}

//Uppfærir bók
async function update(id, {
  title,
  isbn13,
  author,
  description,
  categoryid,
} = {}) {
  const updateItem = {};
  const info = {
    id,
    title,
    isbn13,
    author,
    description,
    categoryid,
  };

  try {
    const table = await select('books');
    const item = table.rows.find(i => i.id === parseInt(id, 10));
    const errors = await errorCheck(info);

    if (errors) {
      updateItem.error = {
        field: errors.field,
        error: errors.error,
        status: 400,
      };
    } else if (item) {
      item.title = xss(title);
      item.isbn13 = xss(isbn13);
      item.author = xss(author);
      item.description = xss(description);
      const cleanArray = item && Object.values(item);
      await queryDb(UPDATE_BOOKS, cleanArray);
      const updateTable = await select('books');
      updateItem.item = updateTable.rows.find(i => i.id === parseInt(id, 10));
    } else {
      updateItem.error = {
        error: `Book with id ${id} does note exist`,
        status: 404,
      };
    }
    return updateItem;
  } catch (e) {
    console.error(e);
    updateItem.error = {
      error: 'Database error occurred',
      status: 400,
    };
    return updateItem;
  }
}

//Finnur eina bók eftir id-inu hennar
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
