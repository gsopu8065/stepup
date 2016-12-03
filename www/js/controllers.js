angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $state, $ionicActionSheet) {
  $scope.settings = {
    enableFriends: true
  };

  $scope.logout = function () {
    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Logout',
      titleText: 'Are you sure you want to logout? This app is awsome so I recommend you to stay.',
      cancelText: 'Cancel',
      cancel: function () {
      },
      buttonClicked: function (index) {
        return true;
      },
      destructiveButtonClicked: function () {
        //facebook logout
        facebookConnectPlugin.logout(function () {
            console.log("logging out")
            $scope.authResponse = undefined;
            $state.go('login');
          },
          function (fail) {
            console.log("logging out error")
          });
      }
    });
  }

})

  .controller('LoginCtrl', function ($scope, $state, $q, $ionicLoading) {

    //This is the success callback from the login method
    var fbLoginSuccess = function(response) {
      var authResponse = response.authResponse;
      console.log(authResponse);
      $state.go('tab.dash');
    };


    //This is the fail callback from the login method
    var fbLoginError = function(error){
      console.log('fbLoginError', error);
      $ionicLoading.hide();
    };

    //This method is executed when the user press the "Login with facebook" button
    $scope.login = function() {

      console.log("login called")
      facebookConnectPlugin.getLoginStatus(function(success){
        console.log(success)
        if(success.status === 'connected'){
          console.log('getLoginStatus', success.status);
          $state.go('tab.dash');
        } else {
          console.log('getLoginStatus', success.status);
          facebookConnectPlugin.login([], fbLoginSuccess, fbLoginError);
        }
      });
    };

  });
