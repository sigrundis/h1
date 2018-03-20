const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const { Strategy } = require('passport-local');
const users = require('../db/usersDb');

const sessionSecret = process.env.SESSION_SECRET;

function authenticate(app) {
  app.use(cookieParser());

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  }));

  function strat(username, password, done) {
    users
      .findByUsername(username)
      .then(async (user) => {
        if (!user) {
          return false;
        }
        const result = await users.comparePasswords(password, user.password);
        if (result) {
          return user;
        }
        return false;
      })
      .then(res => done(null, res))
      .catch((err) => {
        done(err);
      });
  }

  passport.use(new Strategy(strat));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    users
      .findById(id)
      .then(user => done(null, user))
      .catch(err => done(err));
  });

  app.use(passport.initialize());
  app.use(passport.session());

  function consistentLogin(req, res, next) {
    if (req.isAuthenticated()) {
      // Now we can use the user in veiws.
      res.locals.user = req.user;
    }
    next();
  }
  app.use(consistentLogin);
}

module.exports = authenticate;
