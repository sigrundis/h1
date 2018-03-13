const express = require('express');
const passport = require('passport');

const router = express();

router.use(express.urlencoded({ extended: true }));

async function loginSuccess(req, res) {
  res.locals.user = req.user;
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
