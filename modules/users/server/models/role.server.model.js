'use strict';

module.exports = function(sequelize, DataTypes) {

  var Role = sequelize.define('Role', {
    name: {
      type: DataTypes.STRING,
      unique: true,
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
