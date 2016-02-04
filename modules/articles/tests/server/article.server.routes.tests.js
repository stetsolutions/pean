
'use strict';

var _ = require('lodash'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  db = require(path.resolve('./config/lib/sequelize')),
  express = require(path.resolve('./config/lib/express')),
  fs = require('fs-extra'),
  request = require('supertest'),
  should = require('should');

/**
 * Globals
 */
var agent, app;
var credentials, data, user, article;
var roleAdmin, roleUser;

/**
 * Article routes tests
 */
describe('Article "routes" Tests:', function() {
  before(function(done) {
    // Get application
    app = express.init(db.sequelize);
    agent = request.agent(app);

    // Get roles
    db.Role
      .findAll()
      .then(function(roles) {
        _.each(roles, function(value) {
          if (value.name === 'admin') {
            roleAdmin = value.id;
          } else if (value.name === 'user') {
            roleUser = value.id;
          }
        });
        done();
      })
      .catch(function(err) {
        return done(err);
      });
  });

  beforeEach(function(done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'sW1kXqrbyZUBNub6FKJgEA'
    };

    data = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    };

    // Build new user
    user =
      db.User
      .build(data);

    // Save 
    user
      .save()
      .then(function(user) {
        user.addRoles([roleUser, roleAdmin])
        .then(function(roles){
          done();
        })
        .catch(function(err) {
          should.not.exist(err);
        });
      })
      .catch(function(err) {
        should.not.exist(err);
      });

  });

  it('should be able to save an article if logged in', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        var userId = user.id;
        article = {
          title: 'Article Title',
          content: 'Article Content',
          userId: user.id
        };

        // Save a new article
        agent.post('/api/articles')
          .send(article)
          .expect(200)
          .end(function(articleSaveErr, articleSaveRes) {
            // Handle article save error
            if (articleSaveErr) {
              done(articleSaveErr);
            }
            // Get a list of articles
            agent.get('/api/articles')
              .end(function(articlesGetErr, articlesGetRes) {
                // Handle article save error
                if (articlesGetErr) {
                  done(articlesGetErr);
                }

                // Get articles list
                var articles = articlesGetRes.body;

                // Set assertions
                (articles[0].User.id).should.equal(userId);
                (articles[0].title).should.match('Article Title');

                agent
                  .get('/api/auth/signout')
                  .expect(302)
                  .end(function(err, res) {
                    if (err) {
                      return done(err);
                    }
                    res.redirect.should.equal(true);

                    // NodeJS v4 changed the status code representation so we must check
                    // before asserting, to be comptabile with all node versions.
                    if (process.version.indexOf('v4') === 0) {
                      res.text.should.equal('Found. Redirecting to /');
                    } else {
                      res.text.should.equal('Moved Temporarily. Redirecting to /');
                    }
                    done();
                  });
              });
          });
      });
  });

  it('should not be able to save an article if not logged in', function(done) {
    var mockArticle = {
      title: 'Article Title',
      content: 'Article Content',
    };
    request(app).post('/api/articles')
      .send(mockArticle)
      .expect(403)
      .end(function(articleSaveErr, articleSaveRes) {
        // Call the assertion callback
        if (articleSaveErr) {
          done(articleSaveErr);
        }
        done();
      });
  });

  it('should not be able to save an article if no title is provided', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        var mockArticle = {
          content: 'Article content',
          userId: user.id
        };

        // Save a new article
        agent.post('/api/articles')
          .send(mockArticle)
          .expect(400)
          .end(function(articleSaveErr, articleSaveRes) {
            if (articleSaveErr) {
              done(articleSaveErr);
            }
            articleSaveRes.body.message.should.equal('title cannot be null');

            agent
              .get('/api/auth/signout')
              .expect(302)
              .end(function(err, res) {
                if (err) {
                  return done(err);
                }
                res.redirect.should.equal(true);
                
                // NodeJS v4 changed the status code representation so we must check
                // before asserting, to be comptabile with all node versions.
                if (process.version.indexOf('v4') === 0) {
                  res.text.should.equal('Found. Redirecting to /');
                } else {
                  res.text.should.equal('Moved Temporarily. Redirecting to /');
                }
                done();
              });
          });
      });
  });

  it('should be able to update an article if signed in', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          done(signinErr);
        }

        article = {
          title: 'Article Title',
          content: 'Article Content',
          userId: user.id
        };

        // Save a new article
        agent.post('/api/articles')
          .send(article)
          .expect(200)
          .end(function(articleSaveErr, articleSaveRes) {
            // Handle article save error
            if (articleSaveErr) {
              done(articleSaveErr);
            }

            // Update article title
            article = {
              title: 'New Article Title',
              content: 'Article Content',
              userId: user.id
            };

            // Update an existing article
            agent.put('/api/articles/' + articleSaveRes.body.id)
              .send(article)
              .expect(200)
              .end(function(articleUpdateErr, articleUpdateRes) {
                // Handle article update error
                if (articleUpdateErr) {
                  done(articleUpdateErr);
                }

                // Set assertions
                (articleUpdateRes.body.id).should.equal(articleSaveRes.body.id);
                (articleUpdateRes.body.title).should.match('New Article Title');
                agent
                  .get('/api/auth/signout')
                  .expect(302)
                  .end(function(err, res) {
                    if (err) {
                      return done(err);
                    }
                    res.redirect.should.equal(true);

                    // NodeJS v4 changed the status code representation so we must check
                    // before asserting, to be comptabile with all node versions.
                    if (process.version.indexOf('v4') === 0) {
                      res.text.should.equal('Found. Redirecting to /');
                    } else {
                      res.text.should.equal('Moved Temporarily. Redirecting to /');
                    }
                    // Call the assertion callback
                    done();
                  });
              });
          });
      });
  });

  it('should be able to get a list of articles if not signed in', function(done) {
    // Create new article model instance
    article = {
      title: 'Article Title',
      content: 'Article Content',
      userId: user.id
    };
    var articleObj = db.Article.build(article);

    // Save the article
    articleObj.save()
      .then(function() {
        // Request articles
        request(app).get('/api/articles')
          .end(function(req, res) {
            // Set assertion
            res.body.should.be.instanceof(Array).and.not.have.lengthOf(0);
            done();
          });
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });

  it('should be able to get a single article if not signed in', function(done) {
    article = {
      title: 'Article Title',
      content: 'Article Content',
      userId: user.id
    };

    // Create new article model instance
    var articleObj = db.Article.build(article);
    // Save the article
    articleObj.save()
      .then(function() {
        // Request articles
        request(app).get('/api/articles/' + articleObj.id)
          .end(function(req, res) {
            // Set assertion
            res.body.should.be.instanceof(Object).and.have.property('title', article.title);
            done();
          });
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });

  it('should return proper error for single article with an invalid Id, if not signed in', function(done) {
    // test is not a valid sequelize Id
    request(app).get('/api/articles/test')
      .end(function(req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', '');
        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single article which doesnt exist, if not signed in', function(done) {
    // This is a valid sequelize Id but a non-existent article
    request(app).get('/api/articles/559')
      .end(function(req, res) {
        // Set assertion
        should.equal(res.body,null);
        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an article if signed in', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          console.log(signinErr.text);
          done(signinErr);
        }

        article = {
          title: 'Article Title',
          content: 'Article Content',
          userId: user.id
        };

        // Save a new article
        agent.post('/api/articles')
          .send(article)
          .expect(200)
          .end(function(articleSaveErr, articleSaveRes) {
            // Handle article save error
            if (articleSaveErr) {
              done(articleSaveErr);
            }
            
            // Delete an existing article
            agent.delete('/api/articles/' + articleSaveRes.body.id)
              .send(article)
              .expect(200)
              .end(function(articleDeleteErr, articleDeleteRes) {
                // Handle article error error
                if (articleDeleteErr) {
                  done(articleDeleteErr);
                }

                // Set assertions
                (articleDeleteRes.body.id).should.equal(articleSaveRes.body.id);

                agent
                  .get('/api/auth/signout')
                  .expect(302)
                  .end(function(err, res) {
                    if (err) {
                      return done(err);
                    }
                    res.redirect.should.equal(true);

                    // NodeJS v4 changed the status code representation so we must check
                    // before asserting, to be comptabile with all node versions.
                    if (process.version.indexOf('v4') === 0) {
                      res.text.should.equal('Found. Redirecting to /');
                    } else {
                      res.text.should.equal('Moved Temporarily. Redirecting to /');
                    }
                    // Call the assertion callback
                    done();
                  });
              });
          });
      });
  });

  it('should not be able to delete an article if not signed in', function(done) {
    article = {
      title: 'Article Title',
      content: 'Article Content',
      userId: user.id
    };

    // Create new article model instance
    var articleObj = db.Article.build(article);

    // Save the article
    articleObj.save()
      .then(function() {
        // Try deleting article
        request(app).delete('/api/articles/' + articleObj.id)
          .expect(403)
          .end(function(articleDeleteErr, articleDeleteRes) {
            // Set message assertion
            (articleDeleteRes.body.message).should.match('User is not authorized');

            // Handle article error error
            done(articleDeleteErr);
          });
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });

  it('should be able to get a single article that has an orphaned user reference', function(done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = db.User.build({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });
    _orphan.save()
      .then(function(orphan) {
        orphan.addRoles([roleUser, roleAdmin])
          .then(function(roles) {

            agent.post('/api/auth/signin')
              .send(_creds)
              .expect(200)
              .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) {
                  done(signinErr);
                }

                // Get the userId
                var orphanId = orphan.id;
                article = {
                  title: 'Article title',
                  content: 'Article content',
                  userId: orphanId
                };

                // Save a new article
                agent.post('/api/articles')
                  .send(article)
                  .expect(200)
                  .end(function(articleSaveErr, articleSaveRes) {
                    // Handle article save error
                    if (articleSaveErr) {
                      done(articleSaveErr);
                    }
                    //console.log(articleSaveRes.body);
                    // Set assertions on new article
                    (articleSaveRes.body.title).should.equal(article.title);
                    //should.exist(articleSaveRes.body.User);
                    should.equal(articleSaveRes.body.userId, orphanId);
                    agent
                      .get('/api/auth/signout')
                      .expect(302)
                      .end(function(err, res) {
                        if (err) {
                          return done(err);
                        }
                        res.redirect.should.equal(true);

                        // NodeJS v4 changed the status code representation so we must check
                        // before asserting, to be comptabile with all node versions.
                        if (process.version.indexOf('v4') === 0) {
                          res.text.should.equal('Found. Redirecting to /');
                        } else {
                          res.text.should.equal('Moved Temporarily. Redirecting to /');
                        }
                        // force the article to have an orphaned user reference
                        orphan.destroy()
                          .then(function() {
                            // now signin with valid user
                            agent.post('/api/auth/signin')
                              .send(credentials)
                              .expect(200)
                              .end(function(err, res) {
                                // Handle signin error
                                if (err) {
                                  done(err);
                                }
                                // Get the article
                                agent.get('/api/articles/' + articleSaveRes.body.id)
                                  .expect(200)
                                  .end(function(articleInfoErr, articleInfoRes) {
                                    // Handle article error
                                    if (articleInfoErr) {
                                      done(articleInfoErr);
                                    }

                                    // Set assertions
                                    (articleInfoRes.body.id).should.equal(articleSaveRes.body.id);
                                    (articleInfoRes.body.title).should.equal(article.title);
                                    //should.equal(articleInfoRes.body.user, undefined);

                                    // Call the assertion callback
                                    done();
                                  });
                              });
                          })
                          .catch(function(err) {
                            should.not.exist(err);
                          });

                      });
                  });
              });
          })
          .catch(function(err) {
            should.not.exist(err);
          });
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });
  afterEach(function(done) {
    user
      .destroy()
      .then(function() {
        done();
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });
  after(function(done){
    db.Article.destroy({
      where: {
        title: 'Article Title'
      }
    })
    .then(function(){
      done();
    })
    .catch(function(err) {
      should.not.exist(err);
    });
  });
});
