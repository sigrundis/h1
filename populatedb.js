require('dotenv').config();

const csv = require('csvtojson');

const categories = require('./db/categoriesDb');
const books = require('./db/booksDb');

async function populate() {
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
      // Synchronusly write the books to the database
      for (let i = 0; i < booksParsed.length; i += 1) {
        const book = booksParsed[i];
        // Get the row for the title
        let { rows: category } = await categories.readByTitle(book.category);
        // If the row does not exist, add the title to the database
        if (category.length === 0) {
          const result = await categories.create(book.category);
          category = result.rows;
        }
        // Add the book to the database
        await books.create(book.title, book.isbn13, category[0].id, book.author, book.description);
      }

      console.info('Database populated');
    });
  console.info('Starting');
}

populate().catch((err) => {
  console.error('Error populating schema', err);
});
