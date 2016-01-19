'use strict';

angular.module('users').controller('RolesController', [
  'Authentication',

  '$http',
  '$location',
  '$modalInstance',
  '$rootScope',
  '$scope',

  '_',
  'user',

  function(
    Authentication,

    $http,
    $location,
    $modalInstance,
    $rootScope,
    $scope,

    _,
    user
  ) {
    $scope.user = user;

    /**
     * Dismiss
     */
    $scope.dismiss = function() {
      $modalInstance.dismiss(true);
    };

    /**
     * Get roles
     * @return {[type]} [description]
     */
    $scope.getRoles = function() {
      $http({
        url: 'api/users/roles',
        method: 'GET'
      })
      .success(function(data) {
        console.log(data);
        $scope.roles = data;
      });
    };

    /**
     * Is checked
     * @param roleId
     * @returns {boolean}
     */
    $scope.isChecked = function(roleId) {
      var rolesArray = [];

      _.each(user.Roles, function(Role) {
        rolesArray.push(Role.id);
      });

      if (rolesArray.indexOf(roleId) !== -1) {
        return true;
      }
    };

    /**
     * Update
     * @param roleId
     */
    $scope.update = function(roleId) {
      var rolesArray = [];

      _.each(user.Roles, function(Role) {
        rolesArray.push(Role.id);
      });

      if (rolesArray.indexOf(roleId) === -1) {
        rolesArray.push(roleId);

      } else {
        var index = rolesArray.indexOf(roleId);
        rolesArray.splice(index, 1);
      }

      var params = {
        roles: rolesArray
      };

      $http({
        url: 'api/users/admin/' + user.id,
        method: 'PUT',
        params: params
      })
      .success(function(data) {
        $rootScope.$emit('rolesUpdate');
        user = data;
      });
    };
    
    /**
     * Init
     * @return {[type]} [description]
     */
    $scope.init = function() {
      $scope.getRoles();
    };
  }
]);
