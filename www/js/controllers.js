angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $cordovaGeolocation) {

  var options = {timeout: 10000, enableHighAccuracy: true};

  $cordovaGeolocation.getCurrentPosition(options).then(function(position){

    var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    var mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

  }, function(error){
    console.log("Could not get location");
  });

})
.controller('ChatsCtrl', function($scope, Chats) {
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
