'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  sequelize = require('./sequelize'),
  express = require('./express'),
  seed = require('./seed');

chalk.enabled = true;

// Initialize Models
module.exports.init = function init(callback) {

  if (config.db.force) {
    console.log(chalk.bold.red('Warning:\tSequelize option "force" is set to "true"'));  
  }

  if (config.seedDB.seed) {
    config.db.force = true;
  }

  sequelize.sequelize.sync({
    force: config.db.force
  }).then(function (db) {
    var app = express.init(db);

    // Seed
    if (config.db.force) {  
      seed.setup();
    }
    
    if (config.seedDB.seed) {
      console.log(chalk.bold.red('Warning:\tDatabase seeding is turned on'));
      seed.start();
    } 
    
    if (callback) {
      callback(app, db, config);
    }

    return null;
  });
};

// Start
module.exports.start = function start(callback) {
  var _this = this;

  _this.init(function (app, db, config) {

    // Start the app by listening on <port> at <host>
    app.listen(config.port, config.host, function () {

      // Logging initialization
      console.log('--');
      console.log(chalk.green(config.app.title));
      console.log(chalk.green('Environment: ' + process.env.NODE_ENV));
      console.log(chalk.green('Port: ' + config.port));
      console.log(chalk.green('Database: ' + config.db.options.database));
      if (process.env.NODE_ENV === 'secure') {
        console.log(chalk.green('HTTPs: on'));
      }
      console.log(chalk.green('App version: ' + config.peanjs.version));
      if (config.peanjs['peanjs-version']) {
        console.log(chalk.green('PEAN.JS version: ' + config.peanjs['peanjs-version']));
        console.log('--');
      }
      if (callback) callback(app, db, config);
    });
  });
};
