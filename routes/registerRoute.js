const express = require('express');
const { createUser } = require('../db/usersDb');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function registerUser(req, res) {
  console.log('reynir ad registera');
  const { username, password, name, imgUrl } = req.body;
  console.log('username', username);

  const result = await createUser(username, password, name, imgUrl);
  console.log('result', result);

  if (!result.success) {
    return res.status(400).json(result.validation);
  }
  return res.status(201).json(result.data);
}

// POST

router.post('/', catchErrors(registerUser));

module.exports = router;
