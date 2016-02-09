'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a article
 */
exports.create = function(req, res) {
  // console.log('* articles.server.controller - create *');

  // save and return and instance of article on the res object. 
  db.Article.create({
    title: req.body.title,
    content: req.body.content,
    userId: req.user.id
  })
  .then(function(newArticle) {
    return res.json(newArticle);
  })
  .catch(function(err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Delete an article
 */
exports.delete = function(req, res) {
  // console.log('* articles.server.controller - delete *');

  var id = req.params.articleId;

  db.Article
    .findOne({
      where: {
        id: id
      },
      include: [
        db.User
      ]
    })
    .then(function(article) {
      article.destroy()
        .then(function() {
          return res.json(article);
        })
        .catch(function(err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        });

      return null;
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * List of Articles
 */
exports.list = function(req, res) {
  // console.log('* articles.server.controller - list *');

  db.Article.findAll({
    include: [
      db.User
    ]
  })
  .then(function(articles) {
    return res.json(articles);
  })
  .catch(function(err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Show the current article
 */
exports.read = function(req, res) {
  // console.log('* articles.server.controller - read *');

  var id = req.params.articleId;

  db.Article.find({
    where: {
      id: id
    },
    include: [
      db.User
    ]
  })
  .then(function(article) {
    return res.json(article);
  })
  .catch(function(err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Update a article
 */
exports.update = function(req, res) {
  // console.log('* articles.server.controller - update *');

  var id = req.params.articleId;

  db.Article
    .findOne({
      where: {
        id: id
      },
      include: [
        db.User
      ]
    })
    .then(function(article) {
      article.updateAttributes({
        title: req.body.title,
        content: req.body.content
      })
      .then(function() {
        return res.json(article);
      })
      .catch(function(err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      });

      return null;
    })
    .catch(function(err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};
