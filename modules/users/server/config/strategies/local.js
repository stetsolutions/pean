'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

module.exports = function() {
  // Use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function(username, password, done) {
    db.User.findOne({
      where: {
        username: username
      }
    })
    .then(function(user) {
      if (!user || !user.authenticate(user, password)) {
        return done(null, false, {
          message: 'Invalid username or password'
        });
      }

      done(null, user);

      return null;
    })
    .catch(function(err) {
      done(err);
    });
  }));
};
