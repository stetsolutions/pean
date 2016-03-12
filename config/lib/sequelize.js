'use strict';

var config = require('../config'),
  env = process.env.NODE_ENV || 'development',
  fs = require('fs'),
  path = require('path'),
  Sequelize = require('sequelize');

var db = {};

// Sequelize
var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  dialect: 'postgres',
  logging: config.db.options.logging, 
  host: config.db.options.host,
  port: config.db.options.port
});

// Import models
config.files.server.models.forEach(function(modelPath) {
  var model = sequelize.import(path.resolve(modelPath));
  db[model.name] = model;
});

// Associate models
Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
