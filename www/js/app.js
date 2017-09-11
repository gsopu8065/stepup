// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services','starter.newsservices', 'ngCordova'])

  .run(function ($ionicPlatform, $cordovaGeolocation, $state, FacebookCtrl, UserService, LocalStorage) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
      document.addEventListener("deviceready", onDeviceReady(FacebookCtrl, UserService, LocalStorage, $state), false);

      if (window.cordova && window.cordova.plugins) {
        //background running
        window.cordova.plugins.backgroundMode.configure({
          silent: true
        })

        // Enable background mode
        window.cordova.plugins.backgroundMode.enable();

        // Called when background mode has been activated
        window.cordova.plugins.backgroundMode.onactivate = function () {

          var firebaseRef = firebase.database().ref();
          var geoFire = new GeoFire(firebaseRef);
          var options = {timeout: 30000, enableHighAccuracy: true};

          var userId = JSON.parse(window.localStorage.starter_facebook_user || '{}')
          if (userId.userID) {
            // Set an interval of 3 seconds (3000 milliseconds)
            setInterval(function () {
              //update last login
              firebase.database().ref('users/' + userId.userID).update({
                lastLogin: new Date().getTime()
              });

              //update location
              $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
                geoFire.set(userId.userID, [position.coords.latitude, position.coords.longitude]);
              });

            }, 3000);
          }

        }
      }

    });

    function onDeviceReady(FacebookCtrl, UserService, LocalStorage, $state) {

      facebookConnectPlugin.getLoginStatus(function (success) {
        if (success.status === 'connected') {
          //get facebook profile
          FacebookCtrl.getFacebookProfileInfo(success.authResponse.accessToken).then(function (profileInfo) {
            UserService.updateUserProfile(profileInfo.data, undefined);
            LocalStorage.setUser({
              userID: profileInfo.data.id,
              displayName: profileInfo.data.name,
              location: (profileInfo.data.location) ? profileInfo.data.location.name : ""
            });
            $state.go('tab.news');
          }, function (error) {
            $state.go('login');
          })
        }
        else {
          $state.go('login');
        }
      }, function (error) {
        $state.go('login');
      });

    }


  })

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('login', {
        url: '/login',
        abstract: false,
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      })

      // setup an abstract state for the tabs directive
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html'
      })

      // Each tab has its own nav history stack:

      .state('tab.dash', {
        url: '/dash',
        views: {
          'tab-dash': {
            templateUrl: 'templates/tab-dash.html',
            controller: 'DashCtrl'
          }
        }
      })

      .state('tab.chats', {
        url: '/chats',
        cache: false,
        views: {
          'tab-chats': {
            templateUrl: 'templates/tab-chats.html',
            controller: 'ChatsCtrl'
          }
        }
      })
      .state('tab.chat-detail', {
        url: '/chats/:chatId?chatName',
        views: {
          'tab-chats': {
            templateUrl: 'templates/chat-detail.html',
            controller: 'ChatDetailCtrl'
          }
        }
      })

      .state('tab.account', {
        url: '/account',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account.html',
            controller: 'AccountCtrl'
          }
        }
      })

      .state('tab.news', {
        url: '/news',
        views: {
          'tab-news': {
            templateUrl: 'templates/tab-news.html',
            controller: 'NewsCtrl'
          }
        }
      })
      .state('tab.news-detail', {
        url: '/news/:statusId',
        views: {
          'tab-news': {
            templateUrl: 'templates/news-detail.html',
            controller: 'NewsDetailCtrl'
          }
        }
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/news');

  })
  .config(['$ionicConfigProvider', function ($ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom'); // other values: top

  }]);
