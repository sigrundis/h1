const express = require('express');
const users = require('../db/usersDb');
const jwt = require('jsonwebtoken');
const { ExtractJwt } = require('passport-jwt');

const router = express();

const {
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifetime = 20000,
} = process.env;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

router.use(express.urlencoded({ extended: true }));

async function login(req, res) {
  const { username, password } = req.body;

  const user = await users.findByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'No such user' });
  }

  const passwordIsCorrect = await users.comparePasswords(password, user.password);
  console.log(tokenLifetime)
  if (passwordIsCorrect) {
    const payload = { id: user.id };
    const tokenOptions = { expiresIn: 50000000 };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid password' });
}

router.post('/', login);

module.exports = router;
