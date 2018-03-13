require('dotenv').config();
const express = require('express');
const register = require('./routes/registerRoute');
const login = require('./routes/loginRoute');
const users = require('./routes/usersRoute');
const books = require('./routes/booksRoute');
const categories = require('./routes/categoriesRoute');

const app = express();
const { PORT: port = 3000, HOST: host = '127.0.0.1' } = process.env;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/register', register);
app.use('/login', login);
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
});
app.use('/users', users);
// app.use('/books', books);
// app.use('/categories', categories);

function notFoundHandler(req, res, next) {
  // eslint-disable-line
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-line
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid json' });
  }
  return res.status(500).json({ error: 'Internal server error' });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://${host}:${port}/`);
});
