const express = require('express');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

const {
  addOne,
  readOne,
  update,
  findAll,
} = require('../db/booksDb');

async function getAll(req, res) {
  const { search, offset = 0, limit = 10 } = req.query;

  const { data, error } = await findAll(search, offset, limit);

  if (error) {
    return res.status(error.status).json(error);
  }
  return res.json(data);
}

async function postBook(req, res) {
  const {
    title = '',
    isbn13 = '',
    author = '',
    description = '',
    categoryid = '',
  } = req.body;
  const info = {
    title,
    isbn13,
    author,
    description,
    categoryid,
  };
  const { item, error } = await addOne(info);

  try {
    if (error) {
      return res.status(error.status).json(error);
    }
    return res.status(201).json(item);
  } catch (err) {
    console.error('Error', err);
    return err;
  }
}

async function getOne(req, res) {
  const { id } = req.query;

  const { item, error } = await readOne(id);

  if (error) {
    return res.status(error.status).json(error);
  }
  return res.json(item);
}

async function patchOne(req, res) {
  const { id } = req.params;
  const {
    title = '',
    isbn13 = '',
    author = '',
    description = '',
    categoryid = '',
  } = req.body;

  const info = {
    title,
    isbn13,
    author,
    description,
    categoryid,
  };

  try {
    const { item, error } = await update(id, info);
    if (error) {
      return res.status(error.status).json(error);
    }
    return res.status(200).json(item);
  } catch (e) {
    console.error(e);
    return e;
  }
}

router.get('/', catchErrors(getAll));
router.post('/', catchErrors(postBook));
router.get('/:id', catchErrors(getOne));
router.patch('/:id', catchErrors(patchOne));

module.exports = router;
