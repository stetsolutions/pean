'use strict';

/**
 * Module dependencies.
 */
var adminPolicy = require('../policies/admin.server.policy'),
  users = require('../controllers/users/users.admin.server.controller');

module.exports = function(app) {
  // User route registration first. Ref: #713
  require('./users.server.routes.js')(app);

  app.route('/api/users/admin')
    .delete(users.delete)
    .get(users.list)
    .put(users.modify);

  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};
