'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  _ = require('lodash'),
  chalk = require('chalk'),
  db = require(path.resolve('./config/lib/sequelize')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

chalk.enabled = true;

/**
 * Show the current user
 */
exports.read = function (req, res) {
  // console.log('* user.server.controller - read *');

  var userId = req.params.userId;
  
  db.User
    .findOne({
      where: {
        id: userId
      },
      include: [{
        all: true
      }],
    })
    .then(function(user) {
      res.json(user);
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * Delete
 * @param req
 * @param res
 */
exports.delete = function(req, res) {
  // console.log('* user.server.controller - delete *');

  var userId = req.params.userId;

  db.User
    .findOne({
      where: {
        id: userId
      },
      include: [{
        all: true
      }],
    })
    .then(function(user) {
      user
        .destroy()
        .then(function() {
          res.json(user);
        })
        .catch(function(err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        });
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * List
 * @param req
 * @param res
 */
exports.list = function(req, res) {
  // console.log('* user.server.controller - list *');

  var limit = req.query.limit;
  var offset = req.query.offset;
  var search = (req.query.search === undefined) ? '%' : req.query.search;

  var query = '%' + search + '%';

  db.User
    .findAndCountAll({
      where: {
        $or: [{
          firstName: {
            $like: query
          }
        }, {
          lastName: {
            $like: query
          }
        }, {
          displayName: {
            $like: query
          }
        }, {
          username: {
            $like: query
          }
        }, {
          email: {
            $like: query
          }
        }]
      },
      include: [{
        all: true
      }],
      limit: limit,
      offset: offset,
      order: [
        ['createdAt', 'DESC']
      ]
    })
    .then(function(users) {
      res.json(users);
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * Modify
 * @param req
 * @param res
 */
exports.modify = function(req, res) {
  console.log('* user.server.controller - modify *');

  var userId = req.params.userId;
  var roles = req.query.roles;

  if (!roles) {
    roles = [];
  }

  db.User
    .findOne({
      where: {
        id: userId
      },
      include: [{
        all: true
      }],
    })
    .then(function(user) {

      user
        .setRoles(roles)
        .then(function(roles) {

          db.User
            .findOne({
              where: {
                id: userId
              },
              include: [{
                all: true
              }],
            })
            .then(function(user) {
              res.json(user);
            })
            .catch(function(err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            });
        })
        .catch(function(err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        });
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};
