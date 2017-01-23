angular.module('starter.services', [])

  .factory('Chats', function ($q) {
    var ChatsService = {};
    return ChatsService;
  })

  .factory('UserGeoService', function () {

    var UserGeoService = {};

    var firebaseRef = firebase.database();
    var geoFire = new GeoFire(firebaseRef.ref('/locations/'));

    UserGeoService.saveUserLocation = function(userId, lat, long){
      return geoFire.set(userId, [lat, long]);
    }

    return UserGeoService
  })

  .factory('UserService', function ($q) {
    var UserService = {};

    UserService.updateUserProfile = function(profileInfo, deviceId){

      var info = $q.defer();

      var userInfo = {
        displayName: profileInfo.name,
        email: profileInfo.email || "",
        birthday: profileInfo.birthday || "",
        photos: getPhotos(profileInfo),
        likes: getLikes(profileInfo),
        gender: profileInfo.gender || "",
        about: profileInfo.about || "",
        education: getEducation(profileInfo),
        work: getWork(profileInfo),
        location: getLocation(profileInfo),
        token: profileInfo.id,
        lastLogin: new Date().getTime(),
        status: "active"
      }

      if(deviceId != undefined){
        userInfo.deviceId = deviceId;
      }

      firebase.database().ref('users/' + profileInfo.id).update(userInfo);
      info.resolve();
      return info.promise;
    };

    var getLocation = function(profileInfo) {
      var location = "";
      if(profileInfo.location != undefined){
        location = profileInfo.location.name;
      }
      return location;
    };

    var getWork = function(profileInfo) {
      var work = "";
      if(profileInfo.work != undefined && profileInfo.work.employer != undefined){
        work = profileInfo.work.employer.name;
      }
      return work;
    };

    var getEducation = function(profileInfo) {
      var education = "";
      if(profileInfo.education != undefined && profileInfo.education.school != undefined){
        education = profileInfo.education.school.name;
      }
      return education;
    };

    var getPhotos = function(profileInfo) {
      var photos = [];
      if(profileInfo.albums != undefined && profileInfo.albums.data != undefined){
        _.forEach(profileInfo.albums.data, function(photoObj) {
          photos.push(photoObj.picture.data.url);
        });
      }
      return photos;
    };

    var getLikes = function(profileInfo) {
      var likes = [];
      if(profileInfo.likes != undefined && profileInfo.likes.data !=undefined){
        _.forEach(profileInfo.likes.data, function(likeObj) {
          likes.push(likeObj.name);
        });
      }
      return likes;
    };

    UserService.getUserLastLogin = function(userId){
      var info = $q.defer();
       firebase.database().ref('users/' + userId).child('lastLogin').once('value').then(function(res){
         console.log(res.val())
         info.resolve(res.val());
       });
      return info.promise;
    };

    UserService.getUserProfile = function(userId){
      var info = $q.defer();
      firebase.database().ref('users/' + userId).once('value')
        .then(function (userQueryRes) {
          info.resolve(userQueryRes);
        });
      return info.promise;
    };

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
        });

      contactUserRef.child('contacts').once('value')
        .then(function (userQueryRes) {
          var list = userQueryRes.val()
          _.remove(list, {'contactid': userId})
          contactUserRef.update({
            contacts: list
          })
        });

      var dbName = "";
      if (contcatId < userId) {
        dbName = contcatId + userId
      }
      else {
        dbName = userId + contcatId
      }
      var messagesRef = firebase.database().ref('/chat/'+dbName);
      messagesRef.remove()
        .then(function() {
          console.log("Remove succeeded.")
        })
        .catch(function(error) {
          console.log("Remove failed: " + error.message)
        });
    };

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
            };
            list.push(chatUserContactDetails)
          }
          userRef.update({
            contacts: list
          })

        });

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
            };
            list.push(chatUserContactDetails)
          }
          contactUserRef.update({
            contacts: list
          })

        })
    };

    return UserService;
  })

  .factory('FacebookCtrl', function ($http, $q) {

    var FacebookCtrl = {};

    FacebookCtrl.getFacebookProfileInfo = function (authToken) {
      var info = $q.defer();

      var req = {
        method: 'GET',
        url: 'https://graph.facebook.com/v2.8/me?fields=about,gender,name,email,birthday,likes,albums%7Bpicture%7Burl%7D%7D,work,education,location&access_token='+ authToken,
      };

      $http(req).then(function(success){
        console.log(success);
        info.resolve(success);
      }, function(error){
        console.log(error);
        info.reject(error);
      });

      /*facebookConnectPlugin.api('/me?fields=about,gender,name,email, birthday,likes,albums%7Bpicture%7Burl%7D%7D&access_token=' + authToken, ["user_birthday", "email", "user_about_me", "user_photos", "user_likes"],
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
      );*/
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
