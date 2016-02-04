'use strict';

var _ = require('lodash'),
  path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')),
  should = require('should');

/**
 * Globals
 */
var user1, user2, user3;
var roleAdmin, roleUser; 

/**
 * Unit tests
 */
describe('User "model" Tests:', function() {
  before(function(done) {

    user1 =
      db.User
      .build({
        firstName: 'User',
        lastName: 'One',
        displayName: 'User One',
        email: 'one@test.com',
        username: 'userone',
        password: 'M3@n.jsI$Aw3$0m3',
        provider: 'local'
      });

    // user2 is a clone of user1
    user2 =
      db.User
      .build({
        firstName: 'User',
        lastName: 'One',
        displayName: 'User One',
        email: 'one@test.com',
        username: 'userone',
        password: 'M3@n.jsI$Aw3$0m3',
        provider: 'local'
      });

    user3 =
      db.User
      .build({
        firstName: 'User',
        lastName: 'Three',
        displayName: 'User Three',
        email: 'three@test.com',
        username: 'userthree',
        password: 'foobar',
        provider: 'local'
      });

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

  it('should begin with no users', function(done) {
    db.User
      .find({})
      .then(function(users) {
        should.not.exist(users);
        done();
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });

  it('should save without problems', function(done) {
    user1.save()
      .then(function(user) {
        should.exist(user);

        user.addRoles([roleAdmin, roleUser])
          .then(function(roles) {
            should.exist(roles);
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

  it('should fail to save an existing user', function(done) {
    user2.save()
      .then(function(user) {
        should.not.exist(user);
      })
      .catch(function(err) {
        should.exist(err);

        done();
      });
  });

  it('should show an error when trying to save without first name', function(done) {
    user3.firstName = '';

    user3.save()
      .then(function(user) {
        should.not.exist(user);
      })
      .catch(function(err) {
        should.exist(err);
        user3.firstName = 'User';
        done();
      });
  });

  it('should invalidate weak password (OWASP)', function(done) {
    user3.save()
      .then(function(user) {
        // should.not.exist(user);
        should.fail(user, null, 'Fail: Should test for weak password invalidation (not strong)');
      })
      .catch(function(err) {
        should.exist(err);
        done();
      });
  });

  it('should update user roles', function(done) {
    user1.save()
      .then(function(user) {
        should.exist(user);

        user.removeRoles([roleAdmin, roleUser])
          .then(function(roles) {
            should.exist(roles);

            user.addRole(roleUser)
              .then(function(roles) {
                should.exist(roles);
                done();
              })
              .catch(function(err) {
                should.not.exist(err);
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

  it('should show an error when trying to update an existing user with an invalid role', function(done) {
    user1.save()
      .then(function(user) {
        user.addRole(roleUser)
          .then(function(roles) {
            should.not.exist(roles);
          })
          .catch(function(err) {
            should.exist(err);
            done();
          });
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });

  it('should list users', function(done) {

    var limit = 10;
    var offset = 0;
    var search = 'user';

    var query = new RegExp(search, 'i');

    db.User
      .find({
        '$or': [{
          firstName: query
        }, {
          lastName: query
        }, {
          displayName: query
        }, {
          username: query
        }, {
          email: query
        }, {
          roles: query
        }],
        'limit': limit,
        'offset': offset,
        'order': [
          ['createdAt', 'DESC']
        ]
      })
      .then(function(users) {
        done();
      })
      .catch(function(err) {
        should.not.exist(err);
      });
  });
  
  it('should delete user ', function(done) {
    db.User
      .findOne({
        id: 1
      })
      .then(function(user) {

        user.destroy()
          .then(function() {
            done();
          })
          .catch(function(err) {
            should.not.exist(err);
          });
      })
      .catch(function(err) {
        done();
      });
  });

  after(function(done) {
    done();
  });
});
