'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  config = require(path.resolve('./config/config'));

/**
 * Update user details
 */
exports.update = function(req, res) {
  // Init Variables
  var user = req.user;

  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  if (user) {
    // Merge existing user
    user = _.extend(user, req.body);
    user.displayName = user.firstName + ' ' + user.lastName;

    user
      .save()
      .then(function() {
        user
          .getRoles()
          .then(function(roles) {
            var roleArray = [];

            _.forEach(roles, function(role) {
              roleArray.push(role.dataValues.name);
            });

            user.dataValues.roles = roleArray;

            req.login(user, function(err) {
              if (err) {
                res.status(400).send(err);
              } else {
                // Return authenticated user
                res.json(user);
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
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function(req, res) {
  var user = req.user;
  var upload = multer(config.uploads.profileUpload).single('newProfilePicture');
  var profileUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = profileUploadFileFilter;

  if (user) {
    upload(req, res, function(uploadError) {
      if (uploadError) {
        return res.status(400).send({
          message: 'Error occurred while uploading profile picture'
        });
      } else {
        user.profileImageURL = config.uploads.profileUpload.dest + req.file.filename;

        user
          .save()
          .then(function(user) {
            req.login(user, function(err) {
              if (err) {
                res.status(400).send(err);
              } else {
                res.json(user);
              }
            });

            return null;
          })
          .catch(function(err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Send User
 */
exports.me = function(req, res) {
  res.json(req.user || null);
};
