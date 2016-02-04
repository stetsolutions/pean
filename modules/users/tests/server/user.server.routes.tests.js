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
var credentials, data, user;
var roleAdmin, roleUser; 

/**
 * User routes tests
 */
describe('User "routes" Tests:', function() {

  before(function(done) {
    // Get application
    app = express.init(db.sequelize);
    agent = request.agent(app);

    // Get roles
    db.Role
      .findAll ()
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

    // Save user
    user
      .save()
      .then(function(user) {
        should.exist(user);
        done();
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });

  it('should be able to register a new user', function(done) {

    data.username = 'register_newdata';
    data.email = 'register_newdata_@test.com';

    // Sign up 
    agent
      .post('/api/auth/signup')
      .send(data)
      .expect(200)
      .end(function(err, res) {

        if (err) {
          return done(err);
        }

        res.body.username.should.equal(data.username);
        res.body.email.should.equal(data.email);
        res.body.profileImageURL.should.not.be.empty();
        res.body.roles.should.be.instanceof(Array).and.have.lengthOf(1);
        res.body.roles.indexOf('user').should.equal(0);

        return done();
      });
  });

  it('should be able to login successfully and logout successfully', function(done) {
    // Sign in 
    agent
      .post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {

        if (err) {
          return done(err);
        }

        // Sign out 
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

            return done();
          });
      });
  });

  it('should not be able to retrieve a list of users if not admin', function(done) {
    // Sign in 
    agent
      .post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {

        if (err) {
          return done(err);
        }

        // Request list of users
        agent
          .get('/api/users/admin')
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should be able to retrieve a list of users if admin', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRoles([roleAdmin, roleUser])
          .then(function() {
            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                // Get list of users
                agent
                  .get('/api/users/admin')
                  .expect(200)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.rows.should.be.instanceof(Array).and.have.lengthOf(2);

                    // Sign out 
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

                        return done();
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

  it('should be able to get a single user details if admin', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRoles([roleAdmin, roleUser])
          .then(function() {
            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }
                // Get single user information from the database
                agent
                  .get('/api/users/admin/' + user.id)
                  .expect(200)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.should.be.instanceof(Object);
                    res.body.id.should.be.equal(user.id);

                    // Sign out
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

                        return done();
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

  it('should be able to update a single user details if admin', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRoles([roleAdmin, roleUser])
          .then(function() {

            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {
                // Handle signin error
                if (err) {
                  return done(err);
                }

                var userUpdate = {
                  firstName: 'admin_update_first',
                  lastName: 'admin_update_last'
                };

                // Update user
                agent
                  .put('/api/users')
                  .send(userUpdate)
                  .expect(200)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.should.be.instanceof(Object);
                    res.body.firstName.should.be.equal('admin_update_first');
                    res.body.lastName.should.be.equal('admin_update_last');
                    res.body.roles.should.be.instanceof(Array).and.have.lengthOf(2);
                    res.body.id.should.be.equal(user.id);

                    // Sign out
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

                        return done();
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

  it('forgot password should return 400 for non-existent username', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {
            // Forgot
            agent
              .post('/api/auth/forgot')
              .send({
                username: 'somedataname_that_doesnt_exist'
              })
              .expect(400)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                res.body.message.should.equal('No account with that username has been found');

                return done();
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

  it('forgot password should return 400 for no username provided', function(done) {
    user.provider = 'facebook';

    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {
            // Forgot
            agent
              .post('/api/auth/forgot')
              .send({
                username: ''
              })
              .expect(400)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                res.body.message.should.equal('Username field must not be blank');

                return done();
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

  it('forgot password should return 400 for non-local provider set for the user object', function(done) {
    user.provider = 'facebook';

    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {
            // Forgot
            agent
              .post('/api/auth/forgot')
              .send({
                username: user.username
              })
              .expect(400)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                res.body.message.should.equal('It seems like you signed up using your ' + user.provider + ' account');

                return done();
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

  it('forgot password should be able to reset password for user password reset request', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {
            // Forgot
            agent
              .post('/api/auth/forgot')
              .send({
                username: user.username
              })
              .expect(400)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                db.User
                  .findOne({
                    where: {
                      username: user.username.toLowerCase()
                    }
                  })
                  .then(function(user) {
                    user.resetPasswordToken.should.not.be.empty();
                    should.exist(user.resetPasswordExpires);

                    return done();
                  })
                  .catch(function(err) {
                    should.not.exist(err);
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

  it('forgot password should be able to reset the password using reset token', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {
            // Forgot
            agent
              .post('/api/auth/forgot')
              .send({
                username: user.username
              })
              .expect(400)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                db.User
                  .findOne({
                    where: {
                      username: user.username.toLowerCase()
                    }
                  })
                  .then(function(user) {
                    user.resetPasswordToken.should.not.be.empty();
                    should.exist(user.resetPasswordExpires);

                    agent
                      .get('/api/auth/reset/' + user.resetPasswordToken)
                      .expect(302)
                      .end(function(err, res) {
                        // Handle error
                        if (err) {
                          return done(err);
                        }

                        res.headers.location.should.be.equal('/password/reset/' + user.resetPasswordToken);

                        return done();
                      });
                  })
                  .catch(function(err) {
                    should.not.exist(err);
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

  it('forgot password should return error when using invalid reset token', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {
            // Forgot
            agent
              .post('/api/auth/forgot')
              .send({
                username: user.username
              })
              .expect(400)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                db.User
                  .findOne({
                    where: {
                      username: user.username.toLowerCase()
                    }
                  })
                  .then(function(user) {
                    user.resetPasswordToken.should.not.be.empty();
                    should.exist(user.resetPasswordExpires);

                    var invalidToken = 'someTOKEN1234567890';

                    agent
                      .get('/api/auth/reset/' + invalidToken)
                      .expect(400)
                      .end(function(err, res) {
                        if (err) {
                          return done(err);
                        }

                        res.accepted.should.be.equal(false);

                        return done();
                      });
                  })
                  .catch(function(err) {
                    should.not.exist(err);
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

  it('should be able to change user own password successfully', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {
        // Handle signin error
        if (err) {
          return done(err);
        }

        // Change password
        agent.post('/api/users/password')
          .send({
            newPassword: '1234567890Aa$',
            verifyPassword: '1234567890Aa$',
            currentPassword: credentials.password
          })
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            res.body.message.should.equal('Password changed successfully');

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should not be able to change user own password if wrong verifyPassword is given', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {
        // Handle signin error
        if (err) {
          return done(err);
        }

        // Change password
        agent.post('/api/users/password')
          .send({
            newPassword: '1234567890Aa$',
            verifyPassword: '1234567890-ABC-123-Aa$',
            currentPassword: credentials.password
          })
          .expect(400)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            res.body.message.should.equal('Passwords do not match');

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should not be able to change user own password if wrong currentPassword is given', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {
        // Handle signin error
        if (err) {
          return done(err);
        }

        // Change password
        agent.post('/api/users/password')
          .send({
            newPassword: '1234567890Aa$',
            verifyPassword: '1234567890Aa$',
            currentPassword: 'some_wrong_passwordAa$'
          })
          .expect(400)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            res.body.message.should.equal('Current password is incorrect');

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should not be able to change user own password if no new password is at all given', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {
        // Handle signin error
        if (err) {
          return done(err);
        }

        // Change password
        agent.post('/api/users/password')
          .send({
            newPassword: '',
            verifyPassword: '',
            currentPassword: credentials.password
          })
          .expect(400)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            res.body.message.should.equal('Please provide a new password');

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should not be able to change user own password if no new password is at all given', function(done) {
    // Change password
    agent.post('/api/users/password')
      .send({
        newPassword: '1234567890Aa$',
        verifyPassword: '1234567890Aa$',
        currentPassword: credentials.password
      })
      .expect(400)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        res.body.message.should.equal('User is not signed in');

        // Sign out
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

            return done();
          });
      });
  });

  it('should be able to get own user details successfully', function(done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function(err, res) {
        // Handle signin error
        if (err) {
          return done(err);
        }

        // Get own user details
        agent.get('/api/users/me')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            res.body.should.be.instanceof(Object);
            res.body.username.should.equal(user.username);
            res.body.email.should.equal(user.email);

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should not be able to get any user details if not logged in', function(done) {
    // Get own user details
    agent.get('/api/users/me')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        should.not.exist(res.body);

        return done();
      });
  });

  it('should not be able to update own user roles if not admin', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRole(roleUser)
          .then(function() {

            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {
                // Handle signin error
                if (err) {
                  return done(err);
                }

                var update = {
                  roles: [1, 2]
                };

                // Update user roles
                agent
                  .put('/api/users/admin/' + user.id)
                  .send(update)
                  .expect(403)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.message.should.equal('User is not authorized');

                    // Sign out
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

                        return done();
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

  it('should not be able to update own user details with existing username', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRoles([roleAdmin, roleUser])
          .then(function() {

            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {
                // Handle signin error
                if (err) {
                  return done(err);
                }

                var update = {
                  username: 'register_newdata'
                };

                // Update user
                agent
                  .put('/api/users')
                  .send(update)
                  .expect(400)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.message.should.equal('username must be unique');

                    // Sign out
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

                        return done();
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

  it('should not be able to update own user details with existing email address', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRoles([roleAdmin, roleUser])
          .then(function() {

            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {
                // Handle signin error
                if (err) {
                  return done(err);
                }

                var update = {
                  email: 'register_newdata_@test.com'
                };

                // Update user
                agent
                  .put('/api/users')
                  .send(update)
                  .expect(400)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.message.should.equal('email must be unique');

                    // Sign out
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

                        return done();
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

  it('should not be able to update own user profile picture without being logged in', function (done) {
    // Update picture
    agent.post('/api/users/picture')
      .send({})
      .expect(400)
      .end(function (err, res) {

        if (err) {
          return done(err);
        }

        res.body.message.should.equal('User is not signed in');

        // Call the assertion callback
        return done();
      });
  });

  it('should be able to change profile picture if signed in', function (done) {
    // Sign in
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (err, res) {
        
        if (err) {
          return done(err);
        }
        // Update picture
        agent.post('/api/users/picture')
          .attach('newProfilePicture', './modules/users/client/img/profile/default.png')
          .send(credentials)
          .expect(200)
          .end(function (err, res) {
            // Handle change profile picture error
            if (err) {
              return done(err);
            }

            res.body.should.be.instanceof(Object);
            res.body.profileImageURL.should.be.a.String();
            res.body.id.should.be.equal(user.id);

            // Sign out
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

                return done();
              });
          });
      });
  });

  it('should not be able to change profile picture if attach a picture with a different field name', function (done) {
    // Sign in
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (err, res) {
        
        if (err) {
          return done(err);
        }

        agent.post('/api/users/picture')
          .attach('fieldThatDoesntWork', './modules/users/client/img/profile/default.png')
          .send(credentials)
          .expect(400)
          .end(function (err, res) {

            // Sign out
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

  it('should be able to delete a single user if admin', function(done) {
    // Save user
    user
      .save()
      .then(function(user) {
        user
          .addRoles([roleAdmin, roleUser])
          .then(function() {

            // Sign in 
            agent
              .post('/api/auth/signin')
              .send(credentials)
              .expect(200)
              .end(function(err, res) {

                if (err) {
                  return done(err);
                }

                // Delete user
                agent
                  .delete('/api/users/admin/' + user.id)
                  .expect(200)
                  .end(function(err, res) {

                    if (err) {
                      return done(err);
                    }

                    res.body.should.be.instanceof(Object);
                    res.body.id.should.be.equal(user.id);

                    return done();
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

  after(function(done) {
    db.User
      .destroy({
        where: {
          displayName: 'Full Name'
        }
      })
      .then(function() {
        fs.emptyDir(path.resolve('./modules/users/client/img/profile/uploads'), function(err) {
          if (err) {
            console.error(err);
          } else {
            done();
          }
        });
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });
});
