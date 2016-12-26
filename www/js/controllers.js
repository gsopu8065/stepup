angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope, $state, $filter, $ionicPopup, $ionicLoading, $cordovaGeolocation, $stateParams, $ionicModal, $ionicSlideBoxDelegate, GOOGLE_CONFIG, UserGeoService, FacebookCtrl, UserService, LocalStorage) {

    //this is temporary,later remove it
    //LocalStorage.setUser({userID: $stateParams.profileInfoId, displayName: 'raj'});

    if (!$stateParams.profileInfoId) {
      $state.go("login")
    }

    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner> <br/> Current Location'
    });

    var markersList = []

    var options = {timeout: 30000, enableHighAccuracy: true};
    $cordovaGeolocation.getCurrentPosition(options).then(function (position) {

      $ionicLoading.hide();
      $scope.latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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

      //add id to map for css
      var myoverlay = new google.maps.OverlayView();
      myoverlay.draw = function () {
        this.getPanes().markerLayer.id = 'markerLayer';
      };
      myoverlay.setMap($scope.map);

      //update location start
      UserGeoService.saveUserLocation($stateParams.profileInfoId, position.coords.latitude, position.coords.longitude).then(function () {
        console.log("User Location saved to Geo database");
      }, function (error) {
        console.log("User Location can't saved to Geo database: " + error);
      });

      //read map service 
      var firebaseRef = firebase.database().ref();
      var geoFire = new GeoFire(firebaseRef);
      var geoQuery = geoFire.query({center: [position.coords.latitude, position.coords.longitude], radius: 0.15})
      var onKeyEnteredRegistration = geoQuery.on("key_entered", function (key, location) {
        var result_find = $filter('filter')(markersList, {id: key});
        if (result_find.length == 0) {
          markersList.push({id: key})
          firebase.database().ref('/users/' + key).once('value').then(function (user) {
            var userDetails = user.val();
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(location[0], location[1]),
              map: $scope.map,
              icon: {
                url: 'https://graph.facebook.com/' + key + '/picture?type=small',
                scaledSize: new google.maps.Size(28, 28),
                scale: 10
              },
              optimized: false,
              draggable: true
            });
            marker.addListener('click', function () {
              $scope.openModal(key);
            });
          });
        }
      })
      var onReadyRegistration = geoQuery.on("ready", function () {
        geoQuery.cancel();
      })
      //read map service 

    }, function (error) {
      $ionicLoading.hide();
      console.log("Could not get location");
      var alertPopup = $ionicPopup.alert({
        title: 'Network Error',
        template: 'Error in reading current location!'
      });

      console.log(error)
      alertPopup.then(function (res) {
        console.log(error)
        //$state.transitionTo($state.current, $state.$current.params, { reload: true, inherit: true, notify: true });//reload
      });

    });

    //update position when moving
    var watchOptions = {
      timeout: 30000,
      enableHighAccuracy: false // may cause errors if true
    };
    var watch = $cordovaGeolocation.watchPosition(watchOptions);
    watch.then(
      null,
      function (err) {
        // error
        console.log('error in watch');
        console.log('code: ' + err.code + '\n' +
          'message: ' + err.message + '\n');
      },
      function (position) {
        console.log(position)
        $scope.latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $scope.map.setCenter($scope.latLng)
        $scope.circle.setCenter($scope.latLng)

        //update location start
        UserGeoService.saveUserLocation($stateParams.profileInfoId, position.coords.latitude, position.coords.longitude).then(function () {
          console.log("User Location saved to Geo database");
        }, function (error) {
          console.log("User Location can't saved to Geo database: " + error);
        });

        //update markers
        var firebaseRef = firebase.database().ref();
        var geoFire = new GeoFire(firebaseRef);
        var geoQuery = geoFire.query({center: [position.coords.latitude, position.coords.longitude], radius: 0.15})
        var onKeyEnteredRegistration = geoQuery.on("key_entered", function (key, location) {

          console.log(key)
          var result_find = $filter('filter')(markersList, {id: key});
          if (result_find.length == 0) {
            markersList.push({id: key})
            firebase.database().ref('/users/' + key).once('value').then(function (user) {
              var userDetails = user.val();
              var marker = new google.maps.Marker({
                position: new google.maps.LatLng(location[0], location[1]),
                map: $scope.map,
                icon: {
                  url: 'https://graph.facebook.com/' + key + '/picture?type=small',
                  scaledSize: new google.maps.Size(28, 28),
                  scale: 10
                },
                optimized: false,
                draggable: true
              });
              marker.addListener('click', function () {
                $scope.openModal(key);
              });
            });
          }
        })
        var onReadyRegistration = geoQuery.on("ready", function () {
          geoQuery.cancel();
        })


      }
    );
    //$cordovaGeolocation.clearWatch(watch)

    //on every tab level
    $scope.$on('$ionicView.enter', function (e) {
      if ($scope.map) {
        $scope.map.setZoom(17);
        $scope.map.setCenter($scope.latLng)
        $scope.circle.setCenter($scope.latLng)
      }
    });

    //modal open
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function (userId) {
      $scope.chatUserId = userId;

      UserService.getUserProfile(userId).then(function (userQueryRes) {
        $scope.userInfoDisplay = userQueryRes.val();
        if (userId != $stateParams.profileInfoId) {
          $scope.chatButton = true;
        }
        else {
          $scope.chatButton = false;
        }

        $scope.modal.show();
        $ionicSlideBoxDelegate.slide(0);
      })
    };
    $scope.closeModal = function () {
      $scope.modal.hide();
    };
    $scope.startConversation = function () {
      $state.go('tab.chat-detail', {chatId: $scope.chatUserId, chatName: $scope.userInfoDisplay.displayName})
      $scope.modal.hide();
    };


  })

  .controller('ChatsCtrl', function ($scope,$state, $ionicLoading, $ionicPopup, LocalStorage, UserService) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //get contacts list start
    /*$scope.$on('$ionicView.enter', function(e) {
     console.log($scope.chats)
     });*/

    $ionicLoading.show();
    var user = LocalStorage.getUser();
    if (user.userID) {
      firebase.database().ref('/users/' + user.userID).once('value').then(function (user) {

        var userDetails = user.val();
        if (userDetails.contacts) {

          var chatContacts = []
          _.forEach(userDetails.contacts, function(eachContact){
            var eachContactUser = eachContact;
            UserService.getUserLastLogin(eachContact.contactid).then(function(lastLogin){
              eachContactUser.lastLogin = lastLogin;
              chatContacts.push(eachContactUser);
            });
          })
          $ionicLoading.hide();
          $scope.chats = chatContacts;

        }
        else {
          $ionicLoading.hide();
          $scope.chats = [];
        }
      });

    }

    $scope.remove = function (chatId) {
      if (user) {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Remove Contact',
          template: 'Are you sure you want to remove this contact?'
        });

        confirmPopup.then(function(res) {
          if(res) {
            UserService.removeContact(user.userID, chatId)
            $state.transitionTo($state.current, $state.$current.params, { reload: true, inherit: true, notify: true });//reload
          }
        });
      }
      //Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, $state, $ionicModal, $ionicSlideBoxDelegate, $http, UserService, LocalStorage, PushNotificationCtrl) {

    //dom start
    var messageList = document.getElementById('messageList');
    var messageText = document.getElementById('messageText');
    //dom end

    $scope.titleUserDisplayName = $stateParams.chatName
    $scope.titleUserDisplayUrl = 'https://graph.facebook.com/' + $stateParams.chatId + '/picture?type=large'

    $scope.user = LocalStorage.getUser();
    var dbName = ""
    if ($stateParams.chatId < $scope.user.userID) {
      dbName = $stateParams.chatId + $scope.user.userID
    }
    else {
      dbName = $scope.user.userID + $stateParams.chatId
    }


    var messagesRef = firebase.database().ref(dbName);
    // Make sure we remove all previous listeners.
    messagesRef.off();


    $scope.gotoChats = function () {
      $state.go('tab.chats')
    }

    // Saves a new message on the Firebase DB.
    $scope.saveMessage = function (message) {
      // Add a new message entry to the Firebase Database.
      if (message) {

        //save in sender and receiver contacts start
        messagesRef.once("value", function (snapshot) {
          if (!snapshot.exists()) {

            firebase.database().ref('users/' + $stateParams.chatId).once('value').then(function (userQueryRes) {

              var currentUserContactDetails = {
                messageDb: dbName,
                contactid: $stateParams.chatId,
                displayName: userQueryRes.val().displayName,
                deviceId: userQueryRes.val().deviceId,
                status: userQueryRes.val().status
              }

              firebase.database().ref('users/' + $scope.user.userID).once('value').then(function (currentUserQueryRes) {
                var currentUserContacts = currentUserQueryRes.val().contacts || [];
                currentUserContacts.push(currentUserContactDetails)
                firebase.database().ref('users/' + $scope.user.userID).update({
                  contacts: currentUserContacts
                })

                var chatUserContacts = userQueryRes.val().contacts || [];
                var chatUserContactDetails = {
                  messageDb: dbName,
                  contactid: $scope.user.userID,
                  displayName: currentUserQueryRes.val().displayName,
                  deviceId: currentUserQueryRes.val().deviceId,
                  status: currentUserQueryRes.val().status
                }
                chatUserContacts.push(chatUserContactDetails)
                firebase.database().ref('users/' + $stateParams.chatId).update({
                  contacts: chatUserContacts
                })

              })
            });
          }

          messagesRef.push({
            text: message.text,
            timestamp: new Date().getTime(),
            sender: $scope.user.userID
          }).then(function () {
            // Clear message text field and SEND button state.
            messageText.value = '';
          }.bind(this)).catch(function (error) {
            console.error('Error writing new message to Firebase Database', error);
          });

          //send push notification
          firebase.database().ref('users/' + $stateParams.chatId).once('value').then(function (userQueryRes) {
            PushNotificationCtrl.sendPushNotification(userQueryRes.val().deviceId, $scope.user.displayName, message.text).then(function(sucess){
              console.log(sucess)
            })

          })

        })
        //save in sender and receiver contacts end
      }

    };

    var loadMessages = function () {

      // Loads the last 12 messages and listen for new ones.
      var setMessage = function (data) {
        var val = data.val();
        displayMessage(val.text, val.timestamp, val.sender, val.imageUrl);
      }.bind(this);
      messagesRef.limitToLast(12).on('child_added', setMessage);
      messagesRef.limitToLast(12).on('child_changed', setMessage);
    };

    var MESSAGE_TEMPLATE =
      '<div class="msg">' +
      '<p></p>' +
      '</div>';

    var displayMessage = function (text, timestamp, sender, imageUri) {

      var container = document.createElement('li');
      container.innerHTML = MESSAGE_TEMPLATE;
      var pDiv = container.firstChild.firstChild;
      if ($scope.user.userID == sender) {
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

      timeElement.textContent = hour + ':' + date.getMinutes() + ' ' + period
      pDiv.appendChild(timeElement)
      // Show the card fading-in.
      setTimeout(function () {
        container.classList.add('visible')
      }, 1);
      container.scrollTop = container.scrollHeight;
    };

    //show profile
    $scope.showProfile = function () {
      $scope.openModal($stateParams.chatId);
    }

    //modal open
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function (userId) {
      $scope.chatUserId = userId;
      firebase.database().ref('users/' + $scope.chatUserId).once('value').then(function (userQueryRes) {
        UserService.getUserProfile(userId).then(function (userQueryRes) {
          $scope.userInfoDisplay = userQueryRes.val();
          $scope.chatButton = false;
          $scope.modal.show();
          $ionicSlideBoxDelegate.slide(0);
        })
      })

    };
    $scope.closeModal = function () {
      $scope.modal.hide();
    };
    loadMessages()

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

  .controller('LoginCtrl', function ($scope, $state, FacebookCtrl, UserService, LocalStorage) {

    //This is the success callback from the login method
    var fbLoginSuccess = function (response) {
      var authResponse = response.authResponse;
      console.log(authResponse);
      //get facebook profile
      FacebookCtrl.getFacebookProfileInfo(response.authResponse.authToken).then(function (profileInfo) {

        //push notification
        push.register(function(token) {
          console.log("My Device token:",token.token);
          push.saveToken(token);  // persist the token in the Ionic Platform

          //save device id
          //update user info
          UserService.updateUserProfile(profileInfo, token.token);
          LocalStorage.setUser({userID: profileInfo.id, displayName: profileInfo.name });
          $state.go('tab.dash', {profileInfoId: profileInfo.id});

        });
      })
    };


    //This is the fail callback from the login method
    var fbLoginError = function (error) {
      console.log('fbLoginError', error);
    };

    var push = new Ionic.Push({
      "debug": false,
      "pluginConfig": {
        "ios": {
          badge: "true",
          sound: "true",
          "alert": "true",
          "clearBadge": "true"
        }
      }
    });

    //This method is executed when the user press the "Login with facebook" button
    $scope.login = function () {

      console.log("login called")
      facebookConnectPlugin.getLoginStatus(function (success) {
        console.log(success)
        if (success.status === 'connected') {
          console.log('getLoginStatus', success.status);

          //get facebook profile
          FacebookCtrl.getFacebookProfileInfo(success.authToken).then(function (profileInfo) {
            //push notification
            push.register(function(token) {
              console.log("My Device token:",token.token);
              push.saveToken(token);  // persist the token in the Ionic Platform

              //save device id
              //update user info
              UserService.updateUserProfile(profileInfo, token.token);
              LocalStorage.setUser({userID: profileInfo.id, displayName: profileInfo.name});
              $state.go('tab.dash', {profileInfoId: profileInfo.id});

            });
          })

        } else {
          console.log('getLoginStatus', success.status);
          facebookConnectPlugin.login([], fbLoginSuccess, fbLoginError);
        }
      });
    };

  })
  .filter('escape', function () {
    return window.encodeURIComponent;
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
