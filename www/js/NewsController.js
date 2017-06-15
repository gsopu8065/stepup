stepNote.run(function($rootScope) {
  $rootScope.reply = [];
  $rootScope.reply.parentId = '';
  $rootScope.reply.statusGroupId = '';
});

stepNote.controller('NewsCtrl', function ($scope, $state, $ionicModal, LocalStorage, NewsService) {

  $scope.message = { }
  var user = LocalStorage.getUser();
  $scope.user = user;
  NewsService.getNews('', '', user.userID).then(function (newsQueryRes) {
    $scope.newsFeed = newsQueryRes;
  });

  $scope.getRepliesCount = function(replies){
    if(replies){
      return replies.length;
    }
    return 0;
  };

  $scope.updateEmotion = function (status, emotion) {
    NewsService.updateEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
    });
  };

  $scope.deleteEmotion = function (status, emotion) {
    NewsService.deleteEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
    });
  };

  $scope.saveStatus = function (message) {
    NewsService.saveStatus(message, user.userID, user.displayName, "", "", "text", null, null).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
      $scope.modal.hide();
      $scope.message = { }
    });
  };

  $scope.blockUser = function () {
    console.log($scope.optionsUserId);
    $scope.optionsModal.hide();
    NewsService.blockUser(user.userID, $scope.optionsUserId).then(function (updateQueryRes) {
      $scope.newsFeed = updateQueryRes;
    });
  }

  $scope.checkStatus = function (status, emotion) {
    return status.userStatus && status.userStatus.emotion == emotion
  }

  $scope.getEmotionCount = function (status, emotion) {
    if(status.emotions && status.emotions.hasOwnProperty(emotion)){
      return status.emotions[emotion];
    }
    return 0;
  }

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

stepNote.controller('NewsDetailCtrl', function ($scope, $state, $stateParams, $rootScope,$timeout, LocalStorage, NewsService) {

  var user = LocalStorage.getUser();
  NewsService.getStatus($stateParams.statusId).then(function (statusQueryRes) {
    $scope.article = statusQueryRes;
    $rootScope.reply.statusGroupId = $scope.article._id
  });

  $rootScope.reply.parentId = $stateParams.statusId;
  $scope.startReply = function(replyId){
    $rootScope.reply.parentId = replyId;
    console.log(document.getElementById('replyText'), replyId)
    var element = document.getElementById('replyText')
    if (element) {
      $timeout(function() {element.focus();});
    }
  };

  $scope.saveComment = function (message) {
    NewsService.saveStatus(message, user.userID, user.displayName, "", "", "commentText", $rootScope.reply.parentId, $rootScope.reply.statusGroupId).then(function (updateQueryRes) {
      console.log("success")
    });
  };

});

stepNote.directive('commenttree', function ($compile, NewsService) {
  return {
    restrict: 'E',
    scope: {commenttree: '@'},
    template: '<div class="commentDiv">' +
    '<span ng-click="divClicked(status)">{{ status.status  }}</span>' +
    '<div class="commentbottom">' +
    '<span class="articleTime"> {{status.timeStamp | date:"shortTime"}} </span>' +
    '<span class="articlebottomitem" ng-click="startReply(status._id)"> Reply </span>'+
    ' <span class="articlebottomitem" ng-click="divClicked(status)"> {{status.replies.length}} comments</span>' +
    '<span class="articlebottomitem" ng-click="blockUser(status.userId)"> Block</span>' +
    ' <span class="articlebottomitem" ng-if="checkStatus(status, 250)" ng-click="deleteEmotion(status, 250)">dislike</span>' +
    '<span class="articlebottomitem" ng-if="!checkStatus(status, 250)" ng-click="updateEmotion(status, 250)">like</span>' +
    ' </div>' +
    '</div>',

    link: function (scope, elem, attr) {
      NewsService.getStatus(attr.statusid).then(function (statusQueryRes) {
        scope.status = statusQueryRes;
      }.bind(scope));
    },

    controller: function ($scope, $element,$rootScope,$timeout, $attrs) {

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

      }

      $scope.startReply = function(replyId){
        $rootScope.reply.parentId = replyId;
        var element = document.getElementById('replyText')
        if (element) {
          $timeout(function() {element.focus();});
        }
      }
    }

  };
});
