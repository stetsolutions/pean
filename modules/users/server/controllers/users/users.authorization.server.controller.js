'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  db = require(path.resolve('./config/lib/sequelize'));

/**
 * User middleware
 */
exports.userByID = function(req, res, next, id) {
  db.User
    .findOne({
      where: {
        id: id
      },
      include: [{
        all: true
      }]
    })
    .then(function(user) {
      if (!user) {
        return next(new Error('Failed to load User ' + id));
      } else {
        req.profile = user;
        next();
      }
    })
    .catch(function(error) {
      return next(error);
    });
};
