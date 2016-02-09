'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  _ = require('lodash'),
  async = require('async'),
  config = require(path.resolve('./config/config')),
  crypto = require('crypto'),
  db = require(path.resolve('./config/lib/sequelize')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  moment = require('moment'),
  nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function(req, res, next) {
  async.waterfall([

    // Generate random token
    function(done) {
      crypto.randomBytes(20, function(err, buffer) {
        var token = buffer.toString('hex');
        done(err, token);
      });
    },

    // Lookup user by username
    function(token, done) {
      if (req.body.username) {
        db.User
          .findOne({
            where: {
              username: req.body.username
            }
          })
          .then(function(user) {

            if (user.provider !== 'local') {
              return res.status(400).send({
                message: 'It seems like you signed up using your ' + user.provider + ' account'
              });
            } else {
              user.resetPasswordToken = token;
              user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

              user
                .save()
                .then(function() {
                  done(null, token, user);
                  return null;
                })
                .catch(function(err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                });
            }

            return null;
          })
          .catch(function(err) {
            return res.status(400).send({
              message: 'No account with that username has been found'
            });
          });
      } else {
        return res.status(400).send({
          message: 'Username field must not be blank'
        });
      }
    },

    // Render path
    function(token, user, done) {
      res.render(path.resolve('modules/users/server/templates/reset-password-email'), {
        name: user.displayName,
        appName: config.app.title,
        url: 'http://' + req.headers.host + '/api/auth/reset/' + token
      }, function(err, emailHTML) {
        done(err, emailHTML, user);
      });
    },

    // If valid email, send reset email using service
    function(emailHTML, user, done) {
      var mailOptions = {
        to: user.email,
        from: config.mailer.from,
        subject: 'Password Reset',
        html: emailHTML
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        if (!err) {
          res.send({
            message: 'An email has been sent to the provided email with further instructions.'
          });
        } else {
          return res.status(400).send({
            message: 'Failure sending email'
          });
        }

        done(err);
      });
    }
  ], function(err) {
    if (err) {
      return next(err);
    }
  });
};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = function(req, res) {

  db.User
    .findOne({
      where: {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: moment().format()
        }
      }
    })
    .then(function(user) {
      user.password = undefined;
      user.salt = undefined;

      if (!user) {
        return res.redirect('/password/reset/invalid');
      }

      return res.redirect('/password/reset/' + req.params.token);
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * Reset password POST from email token
 */
exports.reset = function(req, res, next) {
  // Init Variables
  var passwordDetails = req.body;

  async.waterfall([
    function(done) {
      var now = moment().toISOString();

      db.User
        .findOne({
          where: {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
              $gt: moment().format()
            }
          }
        })
        .then(function(user) {
          if (user) {
            if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
              user.password = passwordDetails.newPassword;
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
              user.salt = undefined;

              user
                .save()
                .then(function() {
                  user
                    .getRoles()
                    .then(function(roles) {
                      user.password = undefined;
                      user.salt = undefined;

                      var roleArray = [];

                      _.forEach(roles, function(role) {
                        roleArray.push(role.dataValues.name);
                      });

                      user.dataValues.roles = roleArray;

                      req.login(user, function(err) {
                        if (err) {
                          res.status(400).send(err);
                          return null;
                        } else {
                          // Return authenticated user
                          res.json(user);
                          done(null, user);
                          return null;
                        }
                      });

                      return null;
                    });

                  return null;
                })
                .catch(function(err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                });
            } else {
              return res.status(400).send({
                message: 'Passwords do not match'
              });
            }
          } else {
            return res.status(400).send({
              message: 'Password reset token is invalid or has expired.'
            });
          }

          return null;
        })
        .catch(function(err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        });
    },

    // Render
    function(user, done) {
      res.render('modules/users/server/templates/reset-password-confirm-email', {
        name: user.displayName,
        appName: config.app.title
      }, function(err, emailHTML) {
        done(err, emailHTML, user);
      });
    },

    // If valid email, send reset email using service
    function(emailHTML, user, done) {
      var mailOptions = {
        to: user.email,
        from: config.mailer.from,
        subject: 'Your password has been changed',
        html: emailHTML
      };

      smtpTransport.sendMail(mailOptions, function(err) {
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) {
      return next(err);
    }
  });
};

/**
 * Change Password
 */
exports.changePassword = function(req, res, next) {
  // Init Variables
  var passwordDetails = req.body,
    message = null;

  if (req.user) {
    if (passwordDetails.newPassword) {

      db.User
        .findOne({
          where: {
            id: req.user.dataValues.id
          }
        })
        .then(function(user) {

          if (user) {
            if (user.authenticate(user, passwordDetails.currentPassword)) {
              if (passwordDetails.newPassword === passwordDetails.verifyPassword) {

                user.password = passwordDetails.newPassword;

                user
                  .update({
                    password: user.password,
                    salt: null
                  })
                  .then(function() {
                    req.login(user, function(err) {
                      if (err) {
                        return res.status(400).send(err);
                      } else {
                        return res.send({
                          message: 'Password changed successfully'
                        });
                      }
                    });

                    return null;
                  })
                  .catch(function(err) {
                    return res.status(400).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  });
              } else {
                res.status(400).send({
                  message: 'Passwords do not match'
                });
              }
            } else {
              res.status(400).send({
                message: 'Current password is incorrect'
              });
            }
          } else {
            res.status(400).send({
              message: 'User is not found'
            });
          }

          return null;
        })
        .catch(function(err) {
          return next(err);
        });

    } else {
      res.status(400).send({
        message: 'Please provide a new password'
      });
    }
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};
