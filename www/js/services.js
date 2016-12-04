angular.module('starter.services', [])

  .factory('Chats', function ($q) {
    var ChatsService = {};
    return ChatsService;
  })

  .factory('UserGeoService', function () {

    var UserGeoService = {};

    var firebaseRef = firebase.database().ref();
    var geoFire = new GeoFire(firebaseRef);

    UserGeoService.saveUserLocation = function(userId, lat, long){
      return geoFire.set(userId, [lat, long]);
    }

    return UserGeoService
  })

  .factory('UserService', function ($q) {
    var UserService = {};

    UserService.updateUserProfile = function(profileInfo){

      var info = $q.defer();
      firebase.database().ref('users/' + profileInfo.id).update({
        displayName: profileInfo.name,
        token: profileInfo.id,
        status: "active"
      });
      info.resolve();
      return info.promise;
    }

    UserService.getUserProfile = function(userId){
      var info = $q.defer();
      firebase.database().ref('users/' + userId).once('value')
        .then(function (userQueryRes) {
          info.resolve(userQueryRes);
        })
      return info.promise;
    }

    return UserService;
  })

  .factory('FacebookCtrl', function ($http, $q) {

    var FacebookCtrl = {};

    FacebookCtrl.getFacebookProfileInfo = function (authToken) {
      var info = $q.defer();

      facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authToken, ["public_profile"],
        function (response) {
          console.log("facebook response");
          console.log(response);
          info.resolve(response);
        },
        function (response) {
          console.log(response);
          info.reject(response);
        }
      );
      return info.promise;
    };
    return FacebookCtrl;
  })

  .service('LocalStorage', function() {

    var setUser = function(user_data) {
      window.localStorage.starter_facebook_user = JSON.stringify(user_data);
    };

    var getUser = function(){
      return JSON.parse(window.localStorage.starter_facebook_user || '{}');
    };

    return {
      getUser: getUser,
      setUser: setUser
    };
  });
