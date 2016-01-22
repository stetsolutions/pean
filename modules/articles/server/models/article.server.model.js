'use strict';

/**
 * Article Schema
 */
module.exports = function(sequelize, DataTypes) {

  var Article = sequelize.define('Article', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null
    },
    content: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        Article.belongsTo(models.User, {
          foreignKey: 'userId',
          foreignKeyConstraint: true
        });
      }
    }
  });

  return Article;
};
