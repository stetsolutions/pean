'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  db = require(path.resolve('./config/lib/sequelize')),
  passport = require('passport');

/**
 * Module init function.
 */
module.exports = function (app) {
  // Serialize sessions
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // Deserialize sessions
  passport.deserializeUser(function (id, done) {
    db.User.findOne({
      attributes: { 
        exclude: ['salt', 'password'] 
      },
      where: {
        id: id
      }
    })
    .then(function(user) {
      done(null, user);
    })
    .catch(function(err) {
      done(err);
    });

    // User.findOne({
    //   _id: id
    // }, '-salt -password', function (err, user) {
    //   done(err, user);
    // });
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function (strategy) {
    require(path.resolve(strategy))(config);
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
