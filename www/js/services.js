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

    UserService.updateUserProfile = function(profileInfo, deviceId){

      var info = $q.defer();
      firebase.database().ref('users/' + profileInfo.id).update({
        displayName: profileInfo.name,
        token: profileInfo.id,
        lastLogin: new Date().getTime(),
        deviceId: deviceId,
        status: "active"
      });
      info.resolve();
      return info.promise;
    }

    UserService.getUserLastLogin = function(userId){
      var info = $q.defer();
       firebase.database().ref('users/' + userId).child('lastLogin').once('value').then(function(res){
         console.log(res.val())
         info.resolve(res.val());
       });
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

    UserService.removeContact = function(userId, contcatId){

      var userRef = firebase.database().ref('users/' + userId);
      var contactUserRef = firebase.database().ref('users/' + contcatId);

      userRef.child('contacts').once('value')
        .then(function (userQueryRes) {
          var list = userQueryRes.val()
          _.remove(list, {'contactid': contcatId})
          userRef.update({
            contacts: list
          })
        })

      contactUserRef.child('contacts').once('value')
        .then(function (userQueryRes) {
          var list = userQueryRes.val()
          _.remove(list, {'contactid': userId})
          contactUserRef.update({
            contacts: list
          })
        })

      var dbName = ""
      if (contcatId < userId) {
        dbName = contcatId + userId
      }
      else {
        dbName = userId + contcatId
      }
      var messagesRef = firebase.database().ref(dbName);
      messagesRef.remove()
        .then(function() {
          console.log("Remove succeeded.")
        })
        .catch(function(error) {
          console.log("Remove failed: " + error.message)
        });
    }

    UserService.blockContact = function(userId, contcatId){
      var userRef = firebase.database().ref('users/' + userId);
      var contactUserRef = firebase.database().ref('users/' + contcatId);

      userRef.child('contacts').once('value')
        .then(function (userQueryRes) {
          var list = userQueryRes.val() || [];
          var contactIndex = _.findIndex(list, {'contactid': contcatId})
          if(contactIndex != -1){
            list[contactIndex].status = "blocked"
          }
          else{
            var chatUserContactDetails = {
              contactid: contcatId,
              status: "blocked"
            }
            list.push(chatUserContactDetails)
          }
          userRef.update({
            contacts: list
          })

        })

      contactUserRef.child('contacts').once('value')
        .then(function (userQueryRes) {
          var list = userQueryRes.val() || [];
          var contactIndex = _.findIndex(list, {'contactid': userId})
          if(contactIndex != -1){
            list[contactIndex].status = "blocked"
          }
          else {
            var chatUserContactDetails = {
              contactid: userId,
              status: "blocked"
            }
            list.push(chatUserContactDetails)
          }
          contactUserRef.update({
            contacts: list
          })

        })
    }

    return UserService;
  })

  .factory('FacebookCtrl', function ($http, $q) {

    var FacebookCtrl = {};

    FacebookCtrl.getFacebookProfileInfo = function (authToken) {
      var info = $q.defer();
//"user_about_me", "user_photos", "user_likes", "user_education_history"
      facebookConnectPlugin.api('/me?fields=name,email,birthday&access_token=' + authToken, ["user_birthday", "email"],
        function (response) {
          console.log("facebook response");
          console.log(JSON.stringify(response));
          info.resolve(response);
        },
        function (response) {
          console.log("facebook error");
          console.log(JSON.stringify(response));
          info.reject(response);
        }
      );
      return info.promise;
    };
    return FacebookCtrl;
  })

  .factory('PushNotificationCtrl', function ($http, $q) {

    var PushNotificationCtrl = {};

    PushNotificationCtrl.sendPushNotification = function (deviceId, title, text) {

      var req = {
        method: 'POST',
        url: 'https://api.ionic.io/push/notifications',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1YTc1YzFjNS1iMDE4LTQ0YWQtYTNiYS00MzVmYTYwOTBjZGQifQ.bsXmG3Bu8xpp6amwpFvtD8kc9mrSY8GlQ1323hPFQdI'
        },
        data: {
          "tokens": [deviceId],
          "profile": "test",
          "notification": {
            "android": {
              "title": title,
              "message": text
            },
            "ios": {
              "title": title,
              "message": text,
              "badge":1,
              "sound":"default",
              "priority": 10
            }
          }
        }
      }

      var info = $q.defer();
      $http(req).then(function(success){
        console.log(success);
        info.resolve(success);
      }, function(error){
        console.log(error);
        info.reject(error);
      });
      return info.promise;
    };

    return PushNotificationCtrl;
  })

  .service('LocalStorage', function() {

    var setUser = function(user_data) {
      delete window.localStorage.starter_facebook_user;
      window.localStorage.starter_facebook_user = JSON.stringify(user_data);
    };

    var getUser = function(){
      return JSON.parse(window.localStorage.starter_facebook_user || '{}');
    };

    var removeUser = function(){
      window.localStorage.clear();
      window.localStorage.removeItem(starter_facebook_user);
    };

    return {
      getUser: getUser,
      setUser: setUser
    };
  });
