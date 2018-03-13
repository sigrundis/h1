const express = require('express');

const {
  create,
  readAll,
} = require('../db/categoriesDb');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function readAllRoute(req, res) {
  const result = await readAll();

  return res.json(result.data);
}

async function createRoute(req, res) {
  const { title } = req.body;

  const result = await create(title);

  if (!result.success) {
    return res.status(400).json(result.validation);
  }

  return res.status(201).json(result.data);
}

router.get('/', catchErrors(readAllRoute));
router.post('/', catchErrors(createRoute));

module.exports = router;
