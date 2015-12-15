'use strict';

var crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test');

/**
 * Hash password
 */
var hashPassword = function(user, password) {
  if (!password) {
    password = user.dataValues.password;
  }

  if (user.dataValues.salt && user.dataValues.password) {
    return crypto.pbkdf2Sync(password, new Buffer(user.dataValues.salt, 'base64'), 10000, 64).toString('base64');
  } else {
    return password;
  }
};

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    firstName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    lastName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    displayName: DataTypes.STRING,
    email: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    username: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      allowNull: function() {
        var isLocal = this.provider === 'local';
        return isLocal;
      },
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [7],
          msg: 'Password must be at least 7 characters long.'
        }
      }
    },
    salt: DataTypes.STRING,
    profileImageURL: {
      type: DataTypes.STRING
    },
    provider: {
      type: DataTypes.STRING
    },
    providerData: {
      type: DataTypes.JSONB
    },
    additionalProvidersData: {
      type: DataTypes.JSONB
    },
    resetPasswordToken: {
      type: DataTypes.STRING
    },
    resetPasswordExpires: {
      type: DataTypes.DATE
    }
  }, {
    classMethods: {
      associate: function(models) {
        User.belongsToMany(models.Role, {
          through: 'UserRole'
        });
      },
      findUniqueUsername: function(username, suffix, callback) {
        var _this = this;
        var possibleUsername = username.toLowerCase() + (suffix || '');

        _this.findOne({
          username: possibleUsername
        }, function(err, user) {
          if (!err) {
            if (!user) {
              callback(possibleUsername);
            } else {
              return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
            }
          } else {
            callback(null);
          }
        });
      },
      generateRandomPassphrase: function() {
        return new Promise(function(resolve, reject) {
          var password = '';
          var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

          // iterate until the we have a valid passphrase. 
          // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present.
          while (password.length < 20 || repeatingCharacters.test(password)) {
            // build the random password
            password = generatePassword.generate({
              length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
              numbers: true,
              symbols: false,
              uppercase: true,
              excludeSimilarCharacters: true,
            });

            // check if we need to remove any repeating characters.
            password = password.replace(repeatingCharacters, '');
          }

          // Send the rejection back if the passphrase fails to pass the strength test
          if (owasp.test(password).errors.length) {
            reject(new Error('An unexpected problem occured while generating the random passphrase'));
          } else {
            // resolve with the validated passphrase
            resolve(password);
          }
        });
      }
    },
    instanceMethods: {
      authenticate: function(user, password) {
        return user.dataValues.password === hashPassword(user, password);
      }
    }
  });

  /**
   * Before create
   */
  User.beforeCreate(function(user, options) {
    var profileImageURLDefault = 'modules/users/client/img/profile/default.png';

    if (!user.dataValues.profileImageURL) {
      user.dataValues.profileImageURL = profileImageURLDefault;
    }

    if (user.dataValues.password && user._changed.password && user.dataValues.password.length > 6) {
      user.dataValues.salt = crypto.randomBytes(16).toString('base64');
      user.dataValues.password = hashPassword(user);
    } else {
      user.dataValues.salt = null;
      user.dataValues.password = null;
    }
  });

  /**
   * Before update
   */
  User.beforeUpdate(function(user, options) {
    var profileImageURLDefault = 'modules/users/client/img/profile/default.png';

    if (!user.dataValues.profileImageURL) {
      user.dataValues.profileImageURL = profileImageURLDefault;
    }

    if (user.dataValues.password && user._changed.password && user.dataValues.password.length > 6) {
      user.dataValues.salt = crypto.randomBytes(16).toString('base64');
      user.dataValues.password = hashPassword(user);
    } else {
      user.dataValues.salt = null;
      user.dataValues.password = null;
    }
  });

  return User;
};
