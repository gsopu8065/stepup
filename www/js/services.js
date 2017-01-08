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
        lastLogin: new Date().getTime(),
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
          var list = userQueryRes.val()
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
          var list = userQueryRes.val()
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

      facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authToken, ["public_profile"],
        function (response) {
          console.log("facebook response");
          console.log(response);
          info.resolve(response);
        },
        function (response) {
          console.log(JSON.stringify(response));
          info.reject(response);
        }
      );
      return info.promise;
    };
    return FacebookCtrl;
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
