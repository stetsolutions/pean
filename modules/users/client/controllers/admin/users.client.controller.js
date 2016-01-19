'use strict';

angular.module('users').controller('UsersController', [
  'Authentication',
  'Users',

  'moment',
  '_',

  '$http',
  '$rootScope',
  '$scope',
  '$stateParams',
  '$location',
  '$modal',

  function(Authentication,
    Users,
    moment,
    _,
    $http,
    $rootScope,
    $scope,
    $stateParams,
    $location,
    $modal) {
    $scope.authentication = Authentication;

    // Authentication check
    if (!$scope.authentication.user) {
      $location.path('/authentication/signin');
    } else {
      var roles = $scope.authentication.user.roles;

      if (_.includes(roles, 'admin')) {
        $scope.authenticated = true;
      } else {
        $location.path('/');
      }
    }

    /**
     * Find users
     */
    $scope.find = function() {
      var limit = $scope.pageSize;
      var offset = ($scope.currentPage - 1) * $scope.pageSize;
      var search = $scope.search;

      var params = {
        'limit': limit,
        'offset': offset,
        'search': search
      };

      $http({
        url: 'api/users/admin',
        method: 'GET',
        params: params
      }).success(function(data) {
        $scope.totalItems = data.count;
        $scope.users = data.rows;

        $scope.numberOfPages = Math.ceil($scope.totalItems / $scope.pageSize);

        if ($scope.numberOfPages !== 0 && $scope.currentPage > $scope.numberOfPages) {
          $scope.currentPage = $scope.numberOfPages;
        }

        var beginning = $scope.pageSize * $scope.currentPage - $scope.pageSize;
        var end = (($scope.pageSize * $scope.currentPage) > $scope.totalItems) ? $scope.totalItems : ($scope.pageSize * $scope.currentPage);

        $scope.pageRange = beginning + ' ~ ' + end;
      });
    };

    /**
     * Remove user
     * @param article
     */
    $scope.remove = function(user) {
      console.log(user);

      if (user) {

        $http({
          url: 'api/users/admin/' + user.id,
          method: 'DELETE'
        }).success(function(data) {
          console.log(data);
        });

        for (var i in $scope.users) {
          if ($scope.users[i] === user) {
            $scope.users.splice(i, 1);
          }
        }
      } else {
        $scope.user.$remove(function() {
          $location.path('users');
        });
      }
    };

    /**
     * Search controls
     */

    $scope.changeSearch = function() {
      $scope.userForm.$setPristine();

      $scope.find();
    };

    /**
     * Pagination Controls
     */

    $scope.pageSizes = [1, 5, 10];
    $scope.currentPage = 1;

    $scope.pageSize = $scope.pageSizes[1];

    $scope.changePage = function() {
      if (!angular.isNumber($scope.currentPage)) {
        $scope.currentPage = 1;
      }

      if ($scope.currentPage === '') {
        $scope.currentPage = 1;
      } else if ($scope.currentPage > $scope.numberOfPages) {
        $scope.currentPage = $scope.numberOfPages;
      }

      $scope.paginationForm.$setPristine();
      $scope.find();
    };

    $scope.changeSize = function() {
      $scope.paginationForm.$setPristine();

      $scope.currentPage = 1;

      $scope.find();
    };

    $scope.clickFastBackward = function() {
      if ($scope.currentPage !== 1) {
        $scope.currentPage = 1;
        $scope.find();
      }
    };

    $scope.clickBackward = function() {
      if ($scope.currentPage !== 1) {
        $scope.currentPage--;
        $scope.find();
      }
    };

    $scope.clickForward = function() {
      if ($scope.currentPage !== $scope.numberOfPages && $scope.numberOfPages !== 0) {
        $scope.currentPage++;
        $scope.find();
      }
    };

    $scope.clickFastForward = function() {
      if ($scope.currentPage !== $scope.numberOfPages && $scope.numberOfPages !== 0) {
        $scope.currentPage = $scope.numberOfPages;
        $scope.find();
      }
    };

    /**
     * Init
     */
    $scope.init = function() {
      if ($scope.authenticated) {
        $scope.find();
      }
    };

    /*
     * Modal
     */

    /**
     * Open roles modal
     * @param index
     * @param size
     */
    $scope.openRolesModal = function(index, size) {
      var user = $scope.users[index];

      var modalInstance = $modal.open({
        templateUrl: 'roles-modal.html',
        controller: 'RolesController',
        size: size,
        resolve: {
          user: function() {
            return user;
          }
        }
      });
    };

    $rootScope.$on('rolesUpdate', function(event) {
      $scope.init();
    });
  }
]);
