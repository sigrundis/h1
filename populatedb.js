require('dotenv').config();
const { Client } = require('pg');
const csv = require('csvtojson');

const { READ_CATEGORY_BY_TITLE, INSERT_INTO_CATEGORIES } = require('./db/categoriesDb');
const { INSERT_INTO_BOOKS } = require('./db/booksDb');

const connectionString = process.env.DATABASE_URL;

// Custom query that doesnt close the connection
async function query(q, values, client) {
  try {
    const result = await client.query(q, values);
    return result;
  } catch (err) {
    console.error('Error running query, closing connection');
    client.end();
    throw err;
  }
}

// Populates the database with the data
async function populate(booksParsed) {
  const client = new Client({ connectionString });

  await client.connect();

  // Synchronusly write the books to the database
  for (let i = 0; i < booksParsed.length; i += 1) {
    const book = booksParsed[i];
    // Get the row for the title
    const queryCategoryRead = READ_CATEGORY_BY_TITLE;
    const valuesCategory = [book.category];
    let { rows: category } = await query(queryCategoryRead, valuesCategory, client);

    // If the row does not exist, add the title to the database
    if (category.length === 0) {
      const queryCategorCreate = INSERT_INTO_CATEGORIES;
      const { rows } = await query(queryCategorCreate, valuesCategory, client);
      category = rows;
    }

    // Add the book to the database
    const queryBooksCreate = INSERT_INTO_BOOKS;
    const valuesBooks = [book.title, book.isbn13, book.author, book.description, category[0].id];
    await query(queryBooksCreate, valuesBooks, client);
  }

  client.end();
  console.info('Database populated');
}

// Reads the csv file and parses the data
async function readFile() {
  const booksParsed = [];

  // Read the csv
  const csvFilePath = './data/books.csv';
  csv()
    .fromFile(csvFilePath)
    .on('json', (book) => {
      // Store each book
      booksParsed.push(book);
    })
    .on('done', async (error) => {
      if (error) {
        console.error(error);
        return;
      }
      console.info('File read');

      populate(booksParsed);
    });
  console.info('Starting');
}

readFile().catch((err) => {
  console.error('Error populating schema', err);
});
