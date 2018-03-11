// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.newsservices', 'ngCordova', 'firebase', 'ngCordovaOauth', 'ionicLazyLoad'])

  .run(function ($ionicPlatform, $cordovaGeolocation, $state, $rootScope, $firebaseAuth, FirebaseUserCtrl) {
    $ionicPlatform.ready(function () {

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      $rootScope.uid = undefined;
      $rootScope.displayName = undefined;
      $rootScope.photoURL = null;
      $rootScope.isGlobal = false;
      $rootScope.location = {};
      $rootScope.reply = {};
      $rootScope.articleDetails = {};
      $rootScope.providerAccessToken = undefined;

      autoLoginToApp();

    });

    var autoLoginToApp = function(){
      $firebaseAuth(firebase.auth()).$onAuthStateChanged(function (firebaseUser) {
        if (firebaseUser) {
          if (firebaseUser.providerData[0].providerId == "phone") {
            if($rootScope.displayName){
              firebaseUser.myDisplayName = $rootScope.displayName;
              firebaseUser.updateProfile({
                displayName: $rootScope.displayName
              }).then(function () {
              });
              cordova.exec(function(token) {
                if(token){
                  firebaseUser.providerAccessToken = $rootScope.providerAccessToken;
                  firebaseUser.token = token;
                  FirebaseUserCtrl.updateFirebaseUser(firebaseUser)
                    .then(goToApp(firebaseUser), goToApp(firebaseUser));
                }
              }, function(error) {}, "FirebasePlugin", "getToken", []);

            }
            else{
              goToApp(firebaseUser);
            }
          } else if ((firebaseUser.providerData[0].providerId == "facebook.com") || (firebaseUser.providerData[0].providerId == "google.com")) {
            if ($rootScope.providerAccessToken) {
              cordova.exec(undefined, undefined, "FirebasePlugin", "grantPermission", []);
              cordova.exec(function(token) {
                if(token){
                  firebaseUser.providerAccessToken = $rootScope.providerAccessToken;
                  firebaseUser.token = token;
                  FirebaseUserCtrl.updateFirebaseUser(firebaseUser)
                    .then(goToApp(firebaseUser), goToApp(firebaseUser));
                }
              }, function(error) {}, "FirebasePlugin", "getToken", []);

            }
            else {
              goToApp(firebaseUser);
            }
          }
          else {
            goToApp(firebaseUser);
          }
        } else {
          $state.go('login');
        }
      });
    }

    var goToApp = function(firebaseUser){
      var userFireDBRef = firebase.database().ref('/users/' + firebaseUser.uid);
      userFireDBRef.update({   lastLogin: new Date().getTime() });
      userFireDBRef.once('value').then(function(res){
        $rootScope.isGlobal = res.val().isGlobal || false;
      });

      var onSuccess = function(position) {
        $rootScope.location.latitude = position.coords.latitude;
        $rootScope.location.longitude = position.coords.longitude;
        $rootScope.uid = firebaseUser.uid;
        $rootScope.displayName = firebaseUser.displayName;
        $rootScope.photoURL = firebaseUser.photoURL == null? './img/userPhoto.jpg':firebaseUser.photoURL;
        $state.go('tab.news');
      };

      var onError = function(error) {
        $rootScope.location.latitude = null;
        $rootScope.location.longitude = null;
        $rootScope.uid = firebaseUser.uid;
        $rootScope.displayName = firebaseUser.displayName;
        $rootScope.photoURL = firebaseUser.photoURL == null ? './img/userPhoto.jpg' : firebaseUser.photoURL;
        $state.go('tab.news');
      };
      var options = {timeout: 30000, enableHighAccuracy: true};
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
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
      .state('phoneLogin', {
        url: '/phoneLogin',
        abstract: false,
        templateUrl: 'templates/loginWithPhone.html',
        controller: 'LoginWithPhone'
      })
      .state('phonePinLogin', {
        url: '/phonePinLogin:verificationId',
        abstract: false,
        templateUrl: 'templates/loginPhonePin.html',
        controller: 'LoginPhonePin'
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
        url: '/chats/:chatId',
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
    $urlRouterProvider.otherwise('/login');

  })
  .config(['$ionicConfigProvider', function ($ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom'); // other values: top

  }]);
