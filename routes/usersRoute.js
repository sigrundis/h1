const express = require('express');
const { readAll, findById, update } = require('../db/usersDb');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function readAllUsers(req, res) {
  const result = await readAll();
  const usersWithoutPw = result.data.map((d) => {
    const { username, name, imgurl } = d;
    return { username, name, imgurl };
  });
  return res.json(usersWithoutPw);
}

async function getUserById(req, res) {
  const { id } = req.params;
  const user = await findById(id);
  if (user) {
    const {
      username,
      name,
      imgurl,
    } = user;
    return res.json({
      id,
      username,
      name,
      imgurl,
    });
  }
  return res.status(404).json({ error: 'User not found' });
}

async function getLoggedInUser(req, res) {
  if (req.user) {
    const { username, name } = req.user;
    const imgurl = req.user.imgurl || '';
    return res.json({ username, name, imgurl });
  }
  return res.status(401).json({ error: 'You are not logged in' });
}

async function updateLoggedInUser(req, res) {
  const { password, name } = req.body;
  if (req.user) {
    const { id } = req.user;
    const result = await update({ id, password, name });
    if (!result.success) {
      return res.json(result.validation);
    }
    const updatedUser = result.data;
    updatedUser.imgurl = result.data.imgurl || '';
    return res.json(updatedUser);
  }
  return res.status(404).json({ error: 'You are not logged in' });
}

router.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
});

router.get('/', catchErrors(readAllUsers));
router.get('/me', catchErrors(getLoggedInUser));
router.patch('/me', catchErrors(updateLoggedInUser));
router.get('/:id', catchErrors(getUserById));

module.exports = router;
