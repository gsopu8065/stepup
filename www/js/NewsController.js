stepNote.run(function($rootScope) {

  $rootScope.location = [];
  $rootScope.reply = [];
  $rootScope.reply.parentId = '';
  $rootScope.reply.statusGroupId = '';
});

stepNote.controller('NewsCtrl', function ($scope,$rootScope, $cordovaGeolocation, $state, $ionicModal, LocalStorage, NewsService) {

  //get User
  var user = LocalStorage.getUser();
  $scope.user = user;

  //get location
  $scope.loading = true;
  var options = {timeout: 30000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
    $rootScope.location.latitude =  position.coords.latitude;
    $rootScope.location.longitude =  position.coords.longitude;

    NewsService.getNews([position.coords.latitude, position.coords.longitude], 3, user.userID).then(function (newsQueryRes) {
      $scope.newsFeed = newsQueryRes;
      $scope.loading = false
    });


  });

  $scope.getRepliesCount = function(replies){
    if(replies){
      return replies.length;
    }
    return 0;
  };

  $scope.getLocation = function (status) {
    if(status.city && status.state){
      return " "+status.city+", "+status.state;
    }
  };

  $scope.message = { };
  $scope.saveStatus = function (message) {
    NewsService.saveStatus(message, user.userID, user.displayName, "", [$rootScope.location.latitude, $rootScope.location.longitude], 3, "text", null, null).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
      $scope.modal.hide();
      $scope.message = { }
    });
  };

  $scope.blockUser = function () {
    console.log($scope.optionsUserId);
    $scope.optionsModal.hide();
    NewsService.blockUser(user.userID, $scope.optionsUserId, [$rootScope.location.latitude, $rootScope.location.longitude], 3).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
    });
  }

  $scope.checkStatus = function (status, emotion) {
    return status.userstatusEmotion && status.userstatusEmotion == emotion
  }

  $scope.getEmotionCount = function (status, emotion) {
    if(emotion == 'like'){
      return status.likeCount
    }
    else if(emotion == 'dislike'){
      return status.dislikeCount
    }
    return 0;
  }

  $scope.updateEmotion = function (status, emotion) {
    NewsService.updateEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 3, false).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
    });
  };

  $scope.deleteEmotion = function (status, emotion) {
    NewsService.deleteEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 3, false).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
    });
  };

  $scope.openStatus = function () {
    $scope.modal.show();
  };

  $scope.closeModal = function () {
    $scope.modal.hide();
  };

  $ionicModal.fromTemplateUrl('templates/newStatus.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal = modal;
  });

  //option menu
  $scope.isOptionsSameUser = function(){
    return $scope.optionsUserId == $scope.user.userID;
  }

  $scope.openOptionsMenu = function (statusUserId, event) {
    $scope.optionsModalTop = event.pageY;
    $scope.optionsUserId = statusUserId;
    $scope.optionsModal.show();
  };

  $scope.closeOptionsMenu = function () {
    $scope.optionsModal.hide();
  };

  $ionicModal.fromTemplateUrl('templates/statusOptions.html', function(optionsModal) {
    $scope.optionsModal = optionsModal;
  }, {
    scope: $scope,
    animation: 'none',
    focusFirstInput: true
  });

});

stepNote.controller('NewsDetailCtrl', function ($scope, $state, $stateParams, $rootScope,$timeout, $cordovaGeolocation, LocalStorage, NewsService) {

  if($rootScope.location.latitude == null || $rootScope.location.latitude == undefined) {
    var options = {timeout: 30000, enableHighAccuracy: true};
    $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
      $rootScope.location.latitude = position.coords.latitude;
      $rootScope.location.longitude = position.coords.longitude;
    });
  }

  var user = LocalStorage.getUser();
  $scope.inputValue = {
    message:""
  };


  $scope.loading = true;
  NewsService.getStatus($stateParams.statusId, user.userID).then(function (statusQueryRes) {
    $scope.article = statusQueryRes;
    $rootScope.reply.statusGroupId = $scope.article._id;
    $scope.loading = false;
  });

  $rootScope.reply.parentId = $stateParams.statusId;
  $scope.startReply = function(replyId){
    $rootScope.reply.parentId = replyId;
    var element = document.getElementById('replyText')
    if (element) {
      $timeout(function() {element.focus();});
    }
  };

  $scope.getLocation = function () {
    var status = $scope.article;
    if(status && status.city && status.state){
      return " "+status.city+", "+status.state;
    }
  };

  $scope.checkStatus = function (emotion) {
    var status = $scope.article;
    return status && status.userstatusEmotion && status.userstatusEmotion == emotion
  };

  $scope.getEmotionCount = function (emotion) {
    var status = $scope.article;
    if(status && emotion == 'like'){
      return status.likeCount
    }
    else if(status && emotion == 'dislike'){
      return status.dislikeCount
    }
    return 0;
  };

  $scope.updateEmotion = function (emotion) {
    NewsService.updateEmotion($scope.article._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 3, true).then(function (updateQueryRes) {
      $scope.article = updateQueryRes;
    });
  };

  $scope.deleteEmotion = function (emotion) {
    NewsService.deleteEmotion($scope.article._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 3, true).then(function (updateQueryRes) {
      $scope.article = updateQueryRes;
    });
  };

  $scope.saveComment = function () {
    NewsService.saveStatus($scope.inputValue.message, user.userID, user.displayName, "", [$rootScope.location.latitude, $rootScope.location.longitude],3, "commentText", $rootScope.reply.parentId, $rootScope.reply.statusGroupId).then(function (updateQueryRes) {
      $scope.article = updateQueryRes;
      $scope.inputValue.message = ""
    });
  };

});

stepNote.directive('commenttree', function ($compile, NewsService, LocalStorage) {
  return {
    restrict: 'E',
    scope: {commenttree: '@'},
    template: '<div class="commentDiv">' +
    '<div class="replyComment" ng-click="divClicked(status)">{{ status.status  }}</div>' +
    '<div class="commentbottom">' +
    /*'<span class="articleTime"> {{status.timeStamp | formatdate}} </span>' +*/
    '<span class="articlebottomitem" ng-click="startReply(status._id)"> Reply </span>'+
    ' <span class="articlebottomitem" ng-click="divClicked(status)"> {{status.replies.length}} comments</span>' +

    '<span class="eachLikeIcon">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'like\')}}</span>' +
  '<span class="icon ion-thumbsup fontOfLikeIcon" ng-if="!checkStatus(status, \'like\')" ng-click="updateEmotion(status, \'like\')"></span>' +
    '<Span class="fontOfLike " ng-if="!checkStatus(status, \'like\')"> Like</Span>' +
    '<span class="icon ion-thumbsup fontOfLikeIcon makeLikeIconBold" ng-if="checkStatus(status, \'like\')" ng-click="deleteEmotion(status, \'like\')"></span>' +
    '<Span class="fontOfLike makeLikeIconBold" ng-if="checkStatus(status, \'like\')"> Like</Span>' +
    '</span>'+

    '<span class="eachLikeIcon">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'dislike\')}}</span>' +
  '<span class="icon ion-thumbsdown fontOfLikeIcon" ng-if="!checkStatus(status, \'dislike\')" ng-click="updateEmotion(status, \'dislike\')"></span>' +
    '<Span class="fontOfLike " ng-if="!checkStatus(status, \'dislike\')"> Dislike</Span>' +
    '<span class="icon ion-thumbsdown fontOfLikeIcon makeLikeIconBold" ng-if="checkStatus(status, \'dislike\')" ng-click="deleteEmotion(status, \'dislike\')"></span>' +
    '<Span class="fontOfLike makeLikeIconBold" ng-if="checkStatus(status, \'dislike\')"> Dislike</Span>' +
    '</span>'+


    ' </div>' +
    '</div>',

    link: function (scope, elem, attr) {
      var user = LocalStorage.getUser();
      NewsService.getStatus(attr.statusid, user.userID).then(function (statusQueryRes) {
        scope.status = statusQueryRes;
      }.bind(scope));
    },

    controller: function ($scope, $element,$rootScope,$timeout, $attrs, NewsService, LocalStorage) {

      var user = LocalStorage.getUser();
      $scope.divClicked = function (status) {

        if (status.active == undefined || !status.active) {

          _.forEach(status.replies, function (eachReply) {
            var el = $compile("<commenttree statusid=" + eachReply._id + "></commenttree>")($scope);
            $element.append(el);
          });
          status.active = true
        }
        else {
          $element.find("commenttree").remove();
          status.active = false
        }

      };

      $scope.startReply = function(replyId){
        $rootScope.reply.parentId = replyId;
        //console.log(document.getElementById('replyText'), replyId)
        var element = document.getElementById('replyText')
        if (element) {
          $timeout(function() {element.focus();});
        }
      }

      $scope.checkStatus = function (status, emotion) {
        return status && status.userstatusEmotion && status.userstatusEmotion == emotion
      }

      $scope.getEmotionCount = function (status, emotion) {
        if(status && emotion == 'like'){
          return status.likeCount
        }
        else if(status && emotion == 'dislike'){
          return status.dislikeCount
        }
        return 0;
      }

      $scope.updateEmotion = function (status, emotion) {
        NewsService.updateEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 3, true).then(function (updateQueryRes) {
          $scope.status = updateQueryRes;
        });
      };

      $scope.deleteEmotion = function (status, emotion) {
        NewsService.deleteEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 3, true).then(function (updateQueryRes) {
          $scope.status = updateQueryRes;
        });
      };

    }

  };
});


stepNote.filter('formatdate', function($filter) {
  return function(timestamp) {
    var currentDate = new Date()
    var toFormat = new Date(timestamp)
    if(toFormat.getDate() == currentDate.getDate() && toFormat.getMonth() == currentDate.getMonth() && toFormat.getFullYear() == currentDate.getFullYear() ) {
      return 'Today ' + $filter('date')(toFormat.getTime(), 'shortTime')
    }
    if(toFormat.getDate() == (currentDate.getDate() - 1) && toFormat.getMonth() == currentDate.getMonth() && toFormat.getFullYear() == currentDate.getFullYear()) {
      return 'Yesterday ' + $filter('date')(toFormat.getTime(), 'shortTime')
    }

    return $filter('date')(toFormat.getTime(), 'M/d/yy h:mm a')
  }
});
