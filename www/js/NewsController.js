stepNote.run(function($rootScope) {
  $rootScope.reply = [];
  $rootScope.reply.parentId = '';
  $rootScope.reply.statusGroupId = '';
});

stepNote.controller('NewsCtrl', function ($scope, $state, LocalStorage, NewsService) {


  /*$scope.newsFeed = [{
   "userId": "101",
   "userName": "ABCD",
   "status": "Hello world ",
   "type": "text",
   "time": "26min",
   "location": "Nashville, TN",
   "isAnonymous": true,
   "emotions": 345,
   "blocks": 234
   }];*/
  var user = LocalStorage.getUser();
  NewsService.getNews('', '', user.userID).then(function (newsQueryRes) {
    $scope.newsFeed = newsQueryRes;
  });

  $scope.updateEmotion = function (status, emotion) {
    NewsService.updateEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      console.log("success")
      $scope.newsFeed = updateQueryRes;
    });
  };

  $scope.deleteEmotion = function (status, emotion) {
    NewsService.deleteEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      console.log("success")
      $scope.newsFeed = updateQueryRes;
    });
  };

  $scope.saveStatus = function (message) {
    NewsService.saveStatus(message, user.userID, user.displayName, "", "", "text", null, null).then(function (updateQueryRes) {
      console.log("success")
    });
  };

  $scope.blockUser = function (blockUser) {
    NewsService.blockUser(user.userID, blockUser).then(function (updateQueryRes) {
      console.log("success")
      $scope.newsFeed = updateQueryRes;
    });
  }

  $scope.checkStatus = function (status, emotion) {
    return status.userStatus && status.userStatus.emotion == emotion
  }

});

stepNote.controller('NewsDetailCtrl', function ($scope, $state, $stateParams, $rootScope,$timeout, LocalStorage, NewsService) {

  var user = LocalStorage.getUser();
  NewsService.getStatus($stateParams.statusId).then(function (statusQueryRes) {
    $scope.article = statusQueryRes;
    $rootScope.reply.statusGroupId = $scope.article._id
  });

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
        console.log(document.getElementById('replyText'), replyId)
        var element = document.getElementById('replyText')
        if (element) {
          $timeout(function() {element.focus();});
        }
      }
    }

  };
});
