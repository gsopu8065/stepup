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
      var locationFireDBRef = firebase.database().ref('/locations/' + userId);
      return new Promise(function (resolve, reject) {
        locationFireDBRef
          .once("value")
          .then(function (snapshot) {
            var active = snapshot.exists() ? snapshot.child("active").val() : true;
            geoFire.set(userId, [lat, long]).then(function () {
              console.log("User Location saved to Geo database");
              locationFireDBRef.update({
                active: active
              });
              resolve(active);
            }, function (error) {
              console.log("User Location can't saved to Geo database: " + error);
              reject(error)
            });
          })
      });

    }

    UserGeoService.activeUserLocation = function (userId) {
      firebase.database().ref('/locations/' + userId).update({
        active: true
      });
    }

    UserGeoService.deActiveUserLocation = function (userId) {
      firebase.database().ref('/locations/' + userId).update({
        active: false
      });
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
      if (profileInfo.work[0] != undefined && profileInfo.work[0].employer != undefined) {
        work = profileInfo.work[0].employer.name;
      }
      return work;
    };

    var getEducation = function(profileInfo) {
      var education = "";
      if (profileInfo.education[0] != undefined && profileInfo.education[0].school != undefined) {
        education = profileInfo.education[0].school.name;
      }
      return education;
    };

    var getPhotos = function(profileInfo) {
      var photos = [];
      if(profileInfo.albums != undefined && profileInfo.albums.data != undefined){

        var profilePictures = _.filter(profileInfo.albums.data, {"type": "profile"});

        console.log("<---profile pics---->")
        console.log(profilePictures);

        if (profilePictures.length > 0 && profilePictures[0].photos) {
          _.forEach(profilePictures[0].photos.data, function (photoImages) {
            photos.push(photoImages.images[0].source);
          });
        }
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

    return UserService;
  })

  .factory('FacebookCtrl', function ($http, $q) {

    var FacebookCtrl = {};

    FacebookCtrl.getFacebookProfileInfo = function (authToken) {
      var info = $q.defer();

      var req = {
        method: 'GET',
        url: 'https://graph.facebook.com/v2.8/me?fields=about,gender,name,email,birthday,likes,albums%7Bname%2Cphotos%7Bimages%7D%2Ctype%7D,work,education,location&access_token=' + authToken,
      };

      $http(req).then(function(success){
        console.log("login response");
        console.log(success);
        info.resolve(success);
      }, function(error){
        console.log("login error");
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
