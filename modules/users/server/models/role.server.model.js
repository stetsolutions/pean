'use strict';

module.exports = function(sequelize, DataTypes) {

  var Role = sequelize.define('Role', {
    role: {
      type: DataTypes.STRING
    }
  }, {
    classMethods: {
      associate: function(models) {
        Role.belongsToMany(models.User, {
          through: 'UserRole'
        });
      }
    }
  });

  return Role;
};
