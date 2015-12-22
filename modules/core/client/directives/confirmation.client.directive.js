'use strict';

angular.module('core').directive('customConfirmation', ['$modal',
  function($modal) {

    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.ok = function() {
        $modalInstance.close();
      };

      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };

    return {
      restrict: 'A',
      scope: {
        customConfirmation: '&'
      },
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          var message = attrs.customMessage || 'Are you sure?';

          //var modalHtml;
          var modalHtml = '<div class="modal-header"><h4 class="modal-title">Confirmation</h4></div>';
          modalHtml += '<div class="modal-body">' + message + '</div>';
          modalHtml += '<div class="modal-footer"><button class="btn btn-success" ng-click="ok()">Yes</button><button class="btn btn-danger" ng-click="cancel()">No</button></div>';

          var modalInstance = $modal.open({
            template: modalHtml,
            controller: ModalInstanceCtrl
          });

          modalInstance.result.then(function() {
            scope.customConfirmation();
          }, function() {
            //Modal dismissed
          });

        });
      }
    };
  }
]);
