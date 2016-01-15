'use strict';

var _ = require('lodash'),
  chalk = require('chalk'),
  config = require('../config'),
  crypto = require('crypto'),
  db = require('./sequelize');

// global seed options object
var seedOptions = {};

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
          reject(new Error('Failed due to local account already exists: ' + user.username));
        }
      })
      .catch(function(err) {
        reject(new Error('Failed to find local account ' + user.username));
      });
  });
}

/**
 * Report success 
 */
function reportSuccess(password) {
  return function(user) {
    return new Promise(function(resolve, reject) {
      if (seedOptions.logResults) {
        console.log(chalk.bold.red('Database Seeding:\t\t\tLocal account "' + user.username + '" added with password set to ' + password));
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
        'role': value
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

      if (user.username === seedOptions.seedAdmin.username && process.env.NODE_ENV === 'production') {
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
    if (seedOptions.logResults) {
      console.log('Database Seeding:\t\t\t' + err);
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
  seedOptions = _.clone(config.seedDB.options, true);

  // Check for provided options
  if (_.has(seedOptions, 'seedUser')) {
    var userAccount = db.User.build({
      username: seedOptions.seedUser.username,
      provider: seedOptions.seedUser.provider,
      email: seedOptions.seedUser.email,
      firstName: seedOptions.seedUser.firstName,
      lastName: seedOptions.seedUser.lastName,
      displayName: seedOptions.seedUser.displayName
    });

    _.forEach(seedOptions.seedUser.roles, function(value) {
      userRoles.push(config.roles.indexOf(value) + 1);
    });
  }

  if (_.has(seedOptions, 'seedAdmin')) {
    var adminAccount = db.User.build({
      username: seedOptions.seedAdmin.username,
      provider: seedOptions.seedAdmin.provider,
      email: seedOptions.seedAdmin.email,
      firstName: seedOptions.seedAdmin.firstName,
      lastName: seedOptions.seedAdmin.lastName,
      displayName: seedOptions.seedAdmin.displayName
    });

    _.forEach(seedOptions.seedAdmin.roles, function(value) {
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
