var stepNote = angular.module('starter.controllers', []);

stepNote.controller('DashCtrl', function ($scope, $rootScope, $state, $filter, $ionicModal, GOOGLE_CONFIG, UserGeoService, UserService) {

  var markersList = [];
  var firebaseRef = firebase.database();
  var geoFire = new GeoFire(firebaseRef.ref('/locations/'));
  $scope.userMap = {};

  readSucessPosition($rootScope.location.latitude, $rootScope.location.longitude);

  function readSucessPosition(latitude, longitude) {
    $scope.latLng = new google.maps.LatLng(latitude, longitude);
    var mapOptions = {
      center: $scope.latLng,
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
      center: $scope.latLng
    });

    google.maps.event.trigger($scope.map, 'resize');
    $scope.map.setZoom(17);
    $scope.map.setCenter($scope.latLng);
    $scope.circle.setCenter($scope.latLng);

    //add id to map for css
    var myoverlay = new google.maps.OverlayView();
    myoverlay.draw = function () {
      this.getPanes().markerLayer.id = 'markerLayer';
    };
    myoverlay.setMap($scope.map);

    //save location
    UserGeoService.saveUserLocation($rootScope.uid, $rootScope.photoURL, latitude, longitude)
      .then(function (activeVal, error) {
        console.log("User Location saved to Geo database", activeVal);
        $scope.userMap.showOnMap = activeVal;
        //update markers
        var geoQuery = geoFire.query({center: [latitude, longitude], radius: 0.15});
        geoQuery.on("key_entered", function (key, location, distance, active, photoURL) {
          updateMap(key, location, active, photoURL)
        });
        geoQuery.on("ready", function () {
          geoQuery.cancel();
        });
        $scope.$apply()
      }, function (error) {
        console.log("User Location can't saved to Geo database: " + error);
      });
  }

  function updateMap(key, location, active, photoURL) {

    //var photo = photoURL == false ? './img/userPhoto.jpg' : photoURL;
    var result_find = $filter('filter')(markersList, {id: key});
    if (result_find.length == 0) {
      if (active) {
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(location[0], location[1]),
          map: $scope.map,
          icon: {
            url: photoURL,
            scaledSize: new google.maps.Size(28, 28),
            scale: 10
          },
          optimized: false,
          draggable: true
        });
        markersList.push({id: key, active: active, marker: marker});
        marker.addListener('click', function () {
          $scope.openModal(key, marker);
        });
      }
      else {
        markersList.push({id: key, active: active, marker: null});
      }
    }
    else {
      if (result_find[0].active == false && active == true) {
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(location[0], location[1]),
          map: $scope.map,
          icon: {
            url: photoURL,
            scaledSize: new google.maps.Size(28, 28),
            scale: 10
          },
          optimized: false,
          draggable: true
        });
        marker.addListener('click', function () {
          $scope.openModal(key, marker);
        });

        _.forEach(markersList, function (v) {
          if (v.id == key) {
            v.active = true;
            v.marker = marker;
          }
        });
      }
      if (result_find[0].active == true && active == false) {
        _.forEach(markersList, function (v) {
          if (v.id == key) {
            v.active = false;
            v.marker.setMap(null);
          }
        });
      }
    }
  }

//on every tab level
  $scope.$on('$ionicView.enter', function (e) {
    if ($scope.map) {
      google.maps.event.trigger($scope.map, 'resize');
      $scope.map.setZoom(17);
      $scope.map.setCenter($scope.latLng);
      $scope.circle.setCenter($scope.latLng);
    }
  });

//modal open

  $scope.openModal = function (userId) {

    $scope.chatUserId = userId;
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    UserService.getUserProfile(userId).then(function (userQueryRes) {
      $scope.userInfoDisplay = userQueryRes.val();
      $scope.chatButton = userId != $rootScope.uid;

      $scope.modal.show();
      var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflow: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true
        }
      });
    })
  };
  $scope.closeModal = function () {
    $scope.modal.remove();
  };
  $scope.startConversation = function () {
    var photoURL = ($scope.userInfoDisplay.photoURL && $scope.userInfoDisplay.photoURL.length > 0 )? $scope.userInfoDisplay.photoURL[0] : './img/userPhoto.jpg';
    $state.go('tab.chat-detail', {chatId: $scope.chatUserId});
    $scope.modal.remove();
  };

  $scope.changeOnMap = function (x) {
    $scope.userMap.showOnMap = x;
    //update showonmap
    if (x) {
      var marker = new google.maps.Marker({
        position: $scope.latLng,
        map: $scope.map,
        icon: {
          url: $rootScope.photoURL,
          scaledSize: new google.maps.Size(28, 28),
          scale: 10
        },
        optimized: false,
        draggable: true
      });
      marker.addListener('click', function () {
        $scope.openModal($rootScope.uid);
      });

      _.forEach(markersList, function (v) {
        if (v.id == $rootScope.uid) {
          v.active = true;
          v.marker = marker;
        }
      });
      UserGeoService.activeUserLocation($rootScope.uid);
    }
    else {
      _.forEach(markersList, function (v) {
        if (v.id == $rootScope.uid) {
          v.active = false;
          v.marker.setMap(null);
        }
      });
      UserGeoService.deActiveUserLocation($rootScope.uid);
    }
  };
});

stepNote.controller('ChatsCtrl', function ($scope, $rootScope, $state, $ionicPopup, UserService) {

  //$rootScope.uid = "00ealwMukASMV01JG6rZ4WXOiDI2"
  $scope.chats = [];
  firebase.database().ref('/users/' + $rootScope.uid).once('value').then(function (user) {
    var userDetails = user.val();
    if (userDetails.contacts) {

      _.forEach(userDetails.contacts, function (eachContact) {
        var eachContactUser = eachContact;
        UserService.getUserLastLogin(eachContact.contactid).then(function (lastLogin) {
          eachContactUser.lastLogin = lastLogin;
          $scope.chats.push(eachContactUser);
        });
      });
      if(userDetails.contacts.length == 0){
        $scope.chats = undefined;
      }
    }
    else {
      $scope.chats = undefined;
      $scope.$apply()
    }
  });

  $scope.getChatUserImage = function (chatObject) {
    return chatObject.photoURL?chatObject.photoURL:'./img/userPhoto.jpg';
  };

  $scope.deleteChat = function (chatId) {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Remove Contact',
      template: 'Are you sure you want to remove this contact?'
    });

    confirmPopup.then(function (res) {
      if (res) {
        UserService.removeContact($rootScope.uid, chatId);
        $state.transitionTo($state.current, $state.$current.params, {reload: true, inherit: true, notify: true});//reload
      }
    });
  };
});

stepNote.controller('ChatDetailCtrl', function ($ionicActionSheet, $scope,$timeout,$ionicScrollDelegate, $rootScope, $stateParams, $state, $ionicModal, $ionicPopup, UserService, PushNotificationCtrl) {

  $scope.$on('$ionicView.enter', function (e) {
    $ionicScrollDelegate.scrollBottom(true);
    //document.getElementById('messageList').scrollToBottom(0);
  });

  //dom start
  var messageList = document.getElementById('messageList');
  var messageText = document.getElementById('messageText');
  //dom end
 // $rootScope.uid = "00ealwMukASMV01JG6rZ4WXOiDI2"


  firebase.database().ref('users/' + $rootScope.uid).child('contacts').once('value').then(function(res){
    var currentContactId = _.filter(res.val(), function(o) { return o.contactid == $stateParams.chatId; });
    if(currentContactId.length > 0){
      $scope.titleUserDisplayName = currentContactId[0].displayName;
      $scope.titleUserDisplayUrl = currentContactId[0].photoURL || './img/userPhoto.jpg';
    }
  });


  var dbName = "";
  if ($stateParams.chatId < $rootScope.uid) {
    dbName = $stateParams.chatId + $rootScope.uid
  }
  else {
    dbName = $rootScope.uid + $stateParams.chatId
  }


  var messagesRef = firebase.database().ref('/chat/' + dbName);
  // Make sure we remove all previous listeners.
  messagesRef.off();


  $scope.gotoChats = function () {
    $state.go('tab.chats')
  };

  $scope.scrollDown = function () {
    console.log("srujan down")
    $ionicScrollDelegate.scrollBottom(true);
  };

  //block contact
  $scope.deleteChat = function () {

    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Remove Contact',
      titleText: 'Are you sure you want to remove this contact?',
      cancelText: 'Cancel',
      cancel: function () {
      },
      buttonClicked: function (index) {
        return true;
      },
      destructiveButtonClicked: function () {
        UserService.removeContact($rootScope.uid, $stateParams.chatId);
        $state.go('tab.chats');
      }
    });

    /*var confirmPopup = $ionicPopup.confirm({
      title: 'Remove Contact',
      template: 'Are you sure you want to remove this contact?'
    });

    confirmPopup.then(function (res) {
      if (res) {
        UserService.removeContact($rootScope.uid, $stateParams.chatId);
        $state.go('tab.chats');
      }
    });*/
  };

  // Saves a new message on the Firebase DB.
  $scope.saveMessage = function (message) {
    // Add a new message entry to the Firebase Database.
    if (message) {

      //save in sender and receiver contacts start
      messagesRef.once("value", function (snapshot) {
        if (!snapshot.exists()) {

          firebase.database().ref('users/' + $stateParams.chatId).once('value').then(function (userQueryRes) {

            var chatUser = userQueryRes.val();
            var chatUserPhoto = (chatUser.photos && chatUser.photos.length > 0)? chatUser.photos[0] : null;

            var currentUserContactDetails = {
              messageDb: dbName,
              contactid: $stateParams.chatId,
              displayName: chatUser.displayName,
              deviceId: chatUser.deviceId,
              status: chatUser.status,
              photoURL: chatUserPhoto
            };

            firebase.database().ref('users/' + $rootScope.uid).once('value').then(function (currentUserQueryRes) {

              var currentUser = currentUserQueryRes.val();
              var currentUserPhoto = (currentUser.photos && currentUser.photos.length > 0)? currentUser.photos[0] : null;

              var currentUserContacts = currentUserQueryRes.val().contacts || [];
              currentUserContacts.push(currentUserContactDetails);
              firebase.database().ref('users/' + $rootScope.uid).update({
                contacts: currentUserContacts
              });

              var chatUserContacts = chatUser.contacts || [];
              var chatUserContactDetails = {
                messageDb: dbName,
                contactid: $rootScope.uid,
                displayName: currentUser.displayName,
                deviceId: currentUser.deviceId,
                status: currentUser.status,
                photoURL: currentUserPhoto
              };
              chatUserContacts.push(chatUserContactDetails);
              firebase.database().ref('users/' + $stateParams.chatId).update({
                contacts: chatUserContacts
              })

            })
          });
        }

        messagesRef.push({
          text: message.text,
          timestamp: new Date().getTime(),
          sender: $rootScope.uid
        }).then(function () {
          // Clear message text field and SEND button state.
          messageText.value = '';
        }.bind(this)).catch(function (error) {
          console.error('Error writing new message to Firebase Database', error);
        });

        //send push notification
        firebase.database().ref('users/' + $stateParams.chatId).once('value').then(function (userQueryRes) {
          PushNotificationCtrl.sendPushNotification(userQueryRes.val().deviceId, $rootScope.displayName, message.text).then(function (sucess) {
            console.log("push sucess")
          });
        })

        $ionicScrollDelegate.scrollBottom(true);
      });
      //save in sender and receiver contacts end
    }

  };

  var loadMessages = function () {

    // Loads the last 12 messages and listen for new ones.
    var setMessage = function (data) {
      var val = data.val();
      displayMessage(val.text, val.timestamp, val.sender, val.imageUrl);
    }.bind(this);
    messagesRef.on('child_added', setMessage);
    messagesRef.on('child_changed', setMessage);
  };

  var MESSAGE_TEMPLATE =
    '<div class="msg">' +
    '<p></p>' +
    '</div>';

  var displayMessage = function (text, timestamp, sender, imageUri) {

    var container = document.createElement('li');
    container.innerHTML = MESSAGE_TEMPLATE;
    var pDiv = container.firstChild.firstChild;
    if ($rootScope.uid == sender) {
      container.setAttribute('class', "self");
    }
    else {
      container.setAttribute('class', "other");
    }

    messageList.appendChild(container);

    // If the message is text.
    if (text) {
      pDiv.textContent = text;
      // Replace all line breaks by <br>.
      pDiv.innerHTML = pDiv.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUri) { // If the message is an image.
      var image = document.createElement('img');
      image.addEventListener('load', function () {
        messageList.scrollTop = messageList.scrollHeight;
      }.bind(this));
      //this.setImageUrl(imageUri, image);
      pDiv.innerHTML = '';
      pDiv.appendChild(image);
    }
    //add timestamp
    var timeElement = document.createElement('time');
    var date = new Date(timestamp);
    var hour = date.getHours() - (date.getHours() >= 12 ? 12 : 0);
    var period = date.getHours() >= 12 ? 'PM' : 'AM';

    timeElement.textContent = hour + ':' + date.getMinutes() + ' ' + period;
    pDiv.appendChild(timeElement);
    // Show the card fading-in.
    setTimeout(function () {
      container.classList.add('visible')
    }, 1);
    container.scrollTop = container.scrollHeight;
  };

  //show profile
  $scope.showProfile = function () {
    $scope.openModal($stateParams.chatId);
  };

  $scope.openModal = function (userId) {
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });
    $scope.chatUserId = userId;
    UserService.getUserProfile(userId).then(function (userQueryRes) {
      $scope.userInfoDisplay = userQueryRes.val();
      $scope.chatButton = false;
      $scope.modal.show();
      var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflow: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true
        }
      });
    })
  };

  $scope.closeModal = function () {
    $scope.modal.remove();
  };

  loadMessages();
});

stepNote.controller('AccountCtrl', function ($scope, $rootScope, $state, $ionicActionSheet, $ionicModal, $firebaseAuth, UserService) {

  //show profile
  $scope.showProfile = function () {
    $scope.openModal($rootScope.uid);
  };

  $scope.getPhotoURL = function(){
    return $rootScope.photoURL != null ? $rootScope.photoURL : './img/userPhoto.jpg';
  };

  $scope.openModal = function (userId) {
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });
    UserService.getUserProfile(userId).then(function (userQueryRes) {
      $scope.userInfoDisplay = userQueryRes.val();
      $scope.chatButton = false;
      $scope.modal.show();
      var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflow: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true
        }
      });
    })
  };
  $scope.closeModal = function () {
    $scope.modal.remove();
  };

  $scope.logout = function () {
    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Logout',
      titleText: 'Are you sure you want to logout? This app is awesome so I recommend you to stay.',
      cancelText: 'Cancel',
      cancel: function () {
      },
      buttonClicked: function (index) {
        return true;
      },
      destructiveButtonClicked: function () {
        $firebaseAuth(firebase.auth()).$signOut();
        $state.go('login');
      }
    });
  }

});

stepNote.controller('LoginCtrl2', function ($scope,$rootScope, $state, $firebaseAuth, $cordovaOauth, FirebaseUserCtrl){

  var auth = $firebaseAuth(firebase.auth());

  $scope.fbLogin = function () {
    console.log("started");
    facebookConnectPlugin.login(["user_birthday", "email", "user_about_me", "user_photos", "user_likes", "user_work_history", "user_education_history", "user_location"], function(response) {
      $scope.providerAccessToken = response.authResponse.accessToken;
      var credential = firebase.auth.FacebookAuthProvider.credential(response.authResponse.accessToken);
      auth.$signInWithCredential(credential).then(successLogin).catch(errorLogin);
    }, errorLogin);
  };

  $scope.gmailLogin = function () {
    $cordovaOauth.google("666075061271-h83tsb3cdqcieq6cek63eb9lrke8f1df.apps.googleusercontent.com", ["email", "profile"]).then(function(result) {
      $scope.providerAccessToken = result.access_token;
      var credential = firebase.auth.GoogleAuthProvider.credential(null, result.access_token);
      auth.$signInWithCredential(credential).then(successLogin).catch(errorLogin);
    },errorLogin);
  };

  var successLogin = function(firebaseUser){
    firebaseUser.providerAccessToken = $scope.providerAccessToken;
    FirebaseUserCtrl.updateFirebaseUser(firebaseUser)
      .then(goToApp(firebaseUser), goToApp(firebaseUser));
  };

  var errorLogin = function(error){
    $state.go('login');
  }

  var goToApp = function(firebaseUser){
    $rootScope.uid = firebaseUser.uid;
    $rootScope.displayName = firebaseUser.displayName;
    $rootScope.photoURL = firebaseUser.photoURL;
    cordova.exec(undefined, undefined, "FirebasePlugin", "grantPermission", []);
    $state.go('tab.account');
  }

});

stepNote.controller('LoginWithPhone', function ($scope,$rootScope, $state, $ionicHistory){

  $scope.errorMsg = undefined;
  $scope.sendPhoneCode = function (countryCode, phone) {

    var validPhone = phone && phone.length == 10;
    if (!validPhone) {
      $scope.errorMsg = "Invalid Phone Number";
      return 0;
    }

    if (!countryCode) countryCode = "1";
    cordova.exec(undefined, undefined, "FirebasePlugin", "grantPermission", []);
    cordova.exec(function (verificationID) {
      $scope.errorMsg = undefined;
      $state.go('phonePinLogin', {verificationId: verificationID});
    }, function (error) {
      $scope.errorMsg = "Something went wrong, please try later!";
    }, "FirebasePlugin", "getVerificationID", ["+" + countryCode + phone]);
  };

  $scope.goBack = function(){
    $ionicHistory.goBack();
  };

});

stepNote.controller('LoginPhonePin', function ($scope,$rootScope, $state, $stateParams, $firebaseAuth, $ionicHistory, FirebaseUserCtrl){

  var auth = $firebaseAuth(firebase.auth());
  $scope.errorMsg = undefined;

  $scope.validateCode = function(code, displayName){

    var validName = displayName && displayName.length > 1;
    var validCode = code && code.length > 1;
    if(!validCode){
      $scope.errorMsg = "Invalid Code";
      return 0;
    }
    if(!validName){
      $scope.errorMsg = "Invalid Name";
      return 0;
    }
    $rootScope.displayName = displayName;
    var credential = firebase.auth.PhoneAuthProvider.credential($stateParams.verificationId, code);
    auth.$signInWithCredential(credential).then(function(){}).catch(errorLogin); //.then(successLogin).catch(errorLogin);
  };

  $scope.goBack = function(){
    $ionicHistory.goBack();
  };


  var errorLogin = function(error){
    $scope.errorMsg = "Authentication Failed: Try again!";
  };

});

stepNote.directive('phoneInput', function($filter, $browser) {
  return {
    require: 'ngModel',
    link: function($scope, $element, $attrs, ngModelCtrl) {
      var listener = function() {
        var value = $element.val().replace(/[^0-9]/g, '');
        $element.val($filter('tel')(value, false));
      };

      // This runs when we update the text field
      ngModelCtrl.$parsers.push(function(viewValue) {
        return viewValue.replace(/[^0-9]/g, '').slice(0,10);
      });

      // This runs when the model gets updated on the scope directly and keeps our view in sync
      ngModelCtrl.$render = function() {
        $element.val($filter('tel')(ngModelCtrl.$viewValue, false));
      };

      $element.bind('change', listener);
      $element.bind('keydown', function(event) {
        var key = event.keyCode;
        // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
        // This lets us support copy and paste too
        if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)){
          return;
        }
        $browser.defer(listener); // Have to do this or changes don't get picked up properly
      });

      $element.bind('paste cut', function() {
        $browser.defer(listener);
      });
    }

  };
});
stepNote.filter('tel', function () {
  return function (tel) {
    if (!tel) { return ''; }

    var value = tel.toString().trim().replace(/^\+/, '');

    if (value.match(/[^0-9]/)) {
      return tel;
    }

    var country, city, number;

    switch (value.length) {
      case 1:
      case 2:
      case 3:
        city = value;
        break;

      default:
        city = value.slice(0, 3);
        number = value.slice(3);
    }

    if(number){
      if(number.length>3){
        number = number.slice(0, 3) + '-' + number.slice(3,7);
      }
      else{
        number = number;
      }

      return ("(" + city + ") " + number).trim();
    }
    else{
      return "(" + city;
    }

  };
});

stepNote.filter('escape', function () {
  return window.encodeURIComponent;
});

stepNote.filter('age', function () {
  return function (birthday) {
    birthday = new Date(birthday);
    var today = new Date();
    var age = ((today - birthday) / (31557600000));
    age = Math.floor(age);
    return age;
  }
});

stepNote.constant('GOOGLE_CONFIG', [{
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
