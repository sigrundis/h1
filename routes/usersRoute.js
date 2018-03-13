const express = require('express');
const { readAll, findById, update } = require('../db/usersDb');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function readAllUsers(req, res) {
  const result = await readAll();

  const usersWithoutPw = result.data.map(d => {
    return { username: d.username, name: d.name, imgurl: d.imgurl };
  });

  return res.json(usersWithoutPw);
}

async function getUserById(req, res) {
  const { id } = req.params;
  const result = await findById(id);
  if (result.success) {
    return res.json(result.data);
  }
  return res.status(404).json({ error: 'User not found' });
}

async function getLoggedInUser(req, res) {
  console.log('isAuthinLoggedInUser', req.isAuthenticated());
  console.log('res.locals', res.locals);
  console.log('req.user i getloggedinuser', req.user);
  if (req.user) {
    const { username, name, imgurl } = req.user;
    const user = { username, name, imgurl };
    return res.json(user);
  }
  return res.status(401).json({ error: 'You are not logged in' });
}

async function updateUser(req, res) {
  const { password, name } = req.body;
  if (req.user) {
    const { id } = req.user.data;
    const result = await update(id, password, name);
    if (result.success) {
      return res.json(result.data);
    }
    return res.status(400).json({ error: 'Database error has occurred' });
  }
  return res.status(404).json({ error: 'You are not logged in' });
}

router.use((req, res, next) => {
  console.log('fer i router.use i users', req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
});

router.get('/', catchErrors(readAllUsers));
router.get('/me', catchErrors(getLoggedInUser));
router.patch('/me', catchErrors(updateUser));
router.get('/:id', catchErrors(getUserById));

module.exports = router;
