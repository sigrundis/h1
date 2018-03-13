require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-local');
const users = require('../db/usersDb');

const router = express();
const sessionSecret = process.env.SESSION_SECRET;

router.use(express.urlencoded({ extended: true }));
router.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }),
);

async function strat(username, password, done) {
  const user = await users.findByUsername(username);

  if (!user) {
    return done(null, false);
  }

  let result = false;
  try {
    result = await users.comparePasswords(password, user.password);
  } catch (error) {
    done(error);
  }

  if (result) {
    return done(null, user);
  }

  return done(null, false);
}

passport.use(new Strategy(strat));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);
    return done(null, user.data);
  } catch (error) {
    return done(error);
  }
});

router.use(passport.initialize());
router.use(passport.session());

async function loginSuccess(req, res) {
  res.locals.user = req.user;
  console.log('req.user i loginsuccess');
  router.locals.user = req.user;

  return res.status(201).json({
    message: 'login success',
    username: req.user.name,
  });
}

router.post(
  '/',
  passport.authenticate('local', {
    failureRedirect: '/login',
  }),
  loginSuccess,
);

module.exports = router;
