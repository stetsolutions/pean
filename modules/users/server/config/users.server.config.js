'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  db = require(path.resolve('./config/lib/sequelize')),
  passport = require('passport');

/**
 * Module init function.
 */
module.exports = function(app) {
  // Serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);

    return null;
  });

  // Deserialize sessions
  passport.deserializeUser(function(id, done) {
    db.User
      .findOne({
        where: {
          id: id
        }
      })
      .then(function(user) {
        if (user) {
          user
            .getRoles()
            .then(function(roles) {
              var roleArray = [];

              _.each(roles, function(role) {
                roleArray.push(role.dataValues.name);
              });

              user.dataValues.roles = roleArray;
              
              done(null, user);

              return null;
            });

          return null;
        }
      })
      .catch(function(error) {
        done(error);
      });
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function(strategy) {
    require(path.resolve(strategy))(config);
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
