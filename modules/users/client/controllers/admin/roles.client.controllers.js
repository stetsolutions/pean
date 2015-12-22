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
    $scope.roles = [{
      id: 1,
      label: 'User'
    },{
      id: 2,
      label: 'Admin'
    }];

    $scope.user = user;

    /**
     * Dismiss
     */
    $scope.dismiss = function() {
      $modalInstance.dismiss(true);
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
        console.log('pull');
        var index = rolesArray.indexOf(roleId);
        rolesArray.splice(index, 1);
      }

      var params = {
        roles: rolesArray,
        userId: user.id
      };

      $http({
        url: 'api/users/admin',
        method: 'PUT',
        params: params
      }).success(function(data) {
        console.log(data);
        $rootScope.$emit('rolesUpdate');
        user = data;
      });
    };
  }
]);
