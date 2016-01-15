'use strict';

/**
 * Module dependencies.
 */
var adminPolicy = require('../policies/admin.server.policy'),
  users = require('../controllers/users/users.admin.server.controller');

module.exports = function(app) {
  // User route registration first. Ref: #713
  require('./users.server.routes.js')(app);
  
  // Users collection routes
  app.route('/api/users/admin')
    .get(adminPolicy.isAllowed, users.list);

  // Single user routes
  app.route('/api/users/admin/:userId')
    .delete(adminPolicy.isAllowed, users.delete)
    .get(adminPolicy.isAllowed, users.read)
    .put(adminPolicy.isAllowed, users.modify);

  // Users collection routes
  app.route('/api/users/roles')
    .get(adminPolicy.isAllowed, users.roles);

};
