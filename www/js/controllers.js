angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope, $cordovaGeolocation, $stateParams, GOOGLE_CONFIG, UserGeoService, FacebookCtrl, UserService) {

    var options = {timeout: 10000, enableHighAccuracy: true};
    $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      var mapOptions = {
        center: latLng,
        zoom: 17,
        disableDefaultUI: true,
        styles: GOOGLE_CONFIG,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

      //draw circle
      $scope.circle = new google.maps.Circle({
        map: $scope.map,
        radius: 150,  // IN METERS.
        fillColor: '#80dfff',
        fillOpacity: 0.3,
        strokeColor: "#FFF",
        strokeWeight: 0,
        center: latLng
      });

      //update location start
      UserGeoService.saveUserLocation($stateParams.profileInfoId, position.coords.latitude, position.coords.longitude).then(function () {
        console.log("User Location saved to Geo database");
      }, function (error) {
        console.log("User Location can't saved to Geo database: " + error);
      });

    }, function (error) {
      console.log("Could not get location");
    });


  })
  .controller('ChatsCtrl', function ($scope, Chats) {
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($scope, $state, $ionicActionSheet) {
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

  .controller('LoginCtrl', function ($scope, $state, FacebookCtrl, UserService) {

    //This is the success callback from the login method
    var fbLoginSuccess = function (response) {
      var authResponse = response.authResponse;
      console.log(authResponse);
      //get facebook profile
      FacebookCtrl.getFacebookProfileInfo(response.authResponse.authToken).then(function (profileInfo) {
        //update user info
        UserService.updateUserProfile(profileInfo);
        $state.go('tab.dash', {profileInfoId: profileInfo.id});
      })
    };


    //This is the fail callback from the login method
    var fbLoginError = function (error) {
      console.log('fbLoginError', error);
    };

    //This method is executed when the user press the "Login with facebook" button
    $scope.login = function () {

      console.log("login called")
      facebookConnectPlugin.getLoginStatus(function (success) {
        console.log(success)
        if (success.status === 'connected') {
          console.log('getLoginStatus', success.status);

          //get facebook profile
          FacebookCtrl.getFacebookProfileInfo(success.authToken).then(function (profileInfo) {
            //update user info
            UserService.updateUserProfile(profileInfo);
            $state.go('tab.dash', {profileInfoId: profileInfo.id});
          })

        } else {
          console.log('getLoginStatus', success.status);
          facebookConnectPlugin.login([], fbLoginSuccess, fbLoginError);
        }
      });
    };

  })
  .constant('GOOGLE_CONFIG', [{
    "featureType": "landscape.natural",
    "elementType": "geometry.fill",
    "stylers": [{"visibility": "on"}, {"color": "#e0efef"}]
  }, {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [{"visibility": "on"}, {"hue": "#1900ff"}, {"color": "#c0e8e8"}]
  }, {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"lightness": 100}, {"visibility": "simplified"}]
  }, {
    "featureType": "road",
    "elementType": "labels",
    "stylers": [{"visibility": "off"}]
  }, {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{"visibility": "on"}, {"lightness": 700}]
  }, {"featureType": "water", "elementType": "all", "stylers": [{"color": "#7dcdcd"}]}]);
