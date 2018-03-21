const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const users = require('../db/usersDb');

const {
  JWT_SECRET: jwtSecret,
} = process.env;

// Wraps the application with auth layer
function authenticateApp(app) {
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
  };

  // The auth strat
  async function strat(data, next) {
    const user = await users.findById(data.id);

    if (user) {
      next(null, user);
    } else {
      next(null, false);
    }
  }

  passport.use(new Strategy(jwtOptions, strat));

  app.use(passport.initialize());

  // Adds user to req.user if logged in
  function consistentLogin(req, res, next) {
    // Check the token
    passport.authenticate(
      'jwt',
      { session: false },
      (err, user) => {
        if (err) {
          return next(err);
        }
        // If valid token was found add authenticated user to res
        if (user) req.user = user;

        return next();
      },
    )(req, res, next);
  }
  app.use(consistentLogin);
}

module.exports = authenticateApp;
