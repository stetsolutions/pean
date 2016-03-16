'use strict';

var _ = require('lodash'),
  chalk = require('chalk'),
  config = require('../config'),
  crypto = require('crypto'),
  db = require('./sequelize');

// global seed options object
var data = {};

/**
 * Remove user
 */
function removeUser(user) {
  return new Promise(function(resolve, reject) {
    user
      .destroy()
      .then(function() {
        resolve();
      })
      .catch(function() {
        reject(new Error('Failed to remove local ' + user.username));
      });
  });
}

/**
 * Save user
 */
function saveUser(user, roles) {
  return function() {
    return new Promise(function(resolve, reject) {
      user
        .save()
        .then(function(user) {
          user.addRoles(roles)
            .then(function() {
              resolve(user);
            });

          return null;
        })
        .catch(function(err) {
          reject(new Error('Failed to add local ' + user.username));
        });
    });
  };
}

/**
 * Check if user does not exist
 */
function checkUserNotExists(user) {
  return new Promise(function(resolve, reject) {
    db.User
      .findAll({
        where: {
          username: user.username
        }
      })
      .then(function(users) {
        if (users.length === 0) {
          resolve();
        } else {
          reject(new Error('Failed: local account already exists: ' + user.username));
        }
      })
      .catch(function(err) {
        reject(new Error('Failed: local account ' + user.username + ' does note exist'));
      });
  });
}

/**
 * Report success 
 */
function reportSuccess(password) {
  return function(user) {
    return new Promise(function(resolve, reject) {
      if (config.seed.logging) {
        console.log(chalk.bold.blue('Database Seeding:\tLocal account "' + user.username + '" added with password set to ' + password));
      }
      resolve();
    });
  };
}

/**
 * Seed roles
 */
function seedRoles(roles) {
  return new Promise(function(resolve, reject) {
    var rolesArray = [];

    _.forEach(roles, function(value) {
      var role = {
        'name': value
      };
      rolesArray.push(role);
    });

    // Create roles
    db.Role
      .bulkCreate(rolesArray)
      .then(function() {
        resolve();
      })
      .catch(function(err) {
        reject(err);
      });
  });
}

/**
 * Seed the user
 * 
 * Save the specified user with the password provided from the resolved promise.
 */
function seedUser(user, roles) {
  return function(password) {
    return new Promise(function(resolve, reject) {

      // Set the new password
      user.password = password;

      if (user.username === config.seed.data.admin.username && process.env.NODE_ENV === 'production') {
        checkUserNotExists(user)
          .then(saveUser(user, roles))
          .then(reportSuccess(password))
          .then(function() {
            resolve();
          })
          .catch(function(err) {
            reject(err);
          });
      } else {
        removeUser(user)
          .then(saveUser(user, roles))
          .then(reportSuccess(password))
          .then(function() {
            resolve();
          })
          .catch(function(err) {
            reject(err);
          });
      }
    });
  };
}

/**
 * Report error
 */
function reportError(reject) {

  return function(err) {
    if (config.seed.logging) {
      console.log('Database Seeding:\t' + err);
    }
    reject(err);
  };
}

/**
 * Setup
 */
module.exports.setup = function setup() {

  return new Promise(function(resolve, reject) {
    seedRoles(config.roles)
      .then(function() {
        resolve();
      })
      .catch(
        reportError(reject)
      );
  });
};

/**
 * Start
 */
module.exports.start = function start() {

  var adminRoles = [],
    userRoles = [];

  // Initialize the default seed options
  data = _.clone(config.seed.data, true);

  // Check for provided options
  if (_.has(data, 'user')) {
    var userAccount = db.User.build({
      username: data.user.username,
      provider: data.user.provider,
      email: data.user.email,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      displayName: data.user.displayName
    });

    _.forEach(data.user.roles, function(value) {
      userRoles.push(config.roles.indexOf(value) + 1);
    });
  }

  if (_.has(data, 'admin')) {
    var adminAccount = db.User.build({
      username: data.admin.username,
      provider: data.admin.provider,
      email: data.admin.email,
      firstName: data.admin.firstName,
      lastName: data.admin.lastName,
      displayName: data.admin.displayName
    });

    _.forEach(data.admin.roles, function(value) {
      adminRoles.push(config.roles.indexOf(value) + 1);
    });
  }

  return new Promise(function(resolve, reject) {

    //If production only seed admin if it does not exist
    if (process.env.NODE_ENV === 'production') {
      // Add Admin account
      db.User.generateRandomPassphrase()
        .then(seedUser(adminAccount, adminRoles))
        .then(function() {
          resolve();
        })
        .catch(reportError(reject));

    } else {
      // Add both Admin and User account
      db.User.generateRandomPassphrase()
        .then(seedUser(userAccount, userRoles))
        .then(db.User.generateRandomPassphrase)
        .then(seedUser(adminAccount, adminRoles))
        .then(function() {
          resolve();
        })
        .catch(reportError(reject));
    }
  });
};
