stepNote.run(function ($rootScope) {

  $rootScope.location = [];
  $rootScope.reply = [];
  $rootScope.reply.parentId = '';
  $rootScope.reply.statusGroupId = '';
});

stepNote.controller('NewsCtrl', function ($scope, $rootScope, $cordovaGeolocation, $state, $ionicModal, $ionicPopup, LocalStorage, NewsService) {

  //get User
  var user = LocalStorage.getUser();
  $scope.user = user;

  //get location
  $scope.loading = true;
  var options = {timeout: 30000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
    $rootScope.location.latitude = position.coords.latitude;
    $rootScope.location.longitude = position.coords.longitude;

    NewsService.getNews([position.coords.latitude, position.coords.longitude], 30, user.userID).then(function (newsQueryRes) {
      $scope.loading = false;
      $scope.newsFeed = newsQueryRes
    });

  });

  $scope.getLocation = function (status) {
    if (status.city && status.state) {
      return " " + status.city + ", " + status.state;
    }
  };

  $scope.message = {};
  $scope.saveStatus = function (message) {
    NewsService.saveStatus(message, user.userID, user.displayName, "", [$rootScope.location.latitude, $rootScope.location.longitude], 30, "text", null, null).then(function (updateQueryRes) {
      $scope.newsFeed.push(updateQueryRes.ops[0]);
      $scope.closeModal();
    });
  };

  $scope.checkStatus = function (status, emotion) {
    return status.userstatusEmotion && status.userstatusEmotion == emotion
  }

  $scope.getEmotionCount = function (status, emotion) {
    if (emotion == 'like') {
      return status.likeCount
    }
    else if (emotion == 'dislike') {
      return status.dislikeCount
    }
    return 0;
  };

  $scope.updateOrDeleteEmotion = function (status, emotion) {
      if($scope.checkStatus(status, emotion)){
        //delete emotion
        $scope.deleteEmotion(status, emotion)
      }
    else {
        //update emotion
        $scope.updateEmotion(status, emotion)
      }
  };

  $scope.updateEmotion = function (status, emotion) {
    NewsService.updateEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 30, false).then(function (updateQueryRes) {
      var currentIndex = _.findIndex($scope.newsFeed, {'_id': status._id});
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  $scope.deleteEmotion = function (status, emotion) {
    NewsService.deleteEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 30, false).then(function (updateQueryRes) {
      var currentIndex = _.findIndex($scope.newsFeed, {'_id': status._id});
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;

    });
  };

  $scope.openStatus = function () {
    $scope.modal.show();
  };

  $scope.closeModal = function () {
    $scope.message = {};
    $scope.editWindow = false;
    $scope.modal.hide();
  };

  $ionicModal.fromTemplateUrl('templates/newStatus.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal = modal;
  });

  //option menu
  $scope.isOptionsSameUser = function () {
    return $scope.optionsUserId == $scope.user.userID;
  }

  $scope.openOptionsMenu = function (statusUserId, statusId, status, event) {
    $scope.optionsModalTop = event.pageY;
    $scope.optionsUserId = statusUserId;
    $scope.optionsStatusId = statusId;
    $scope.optionsStatus = status;
    $scope.optionsModal.show();
  };

  $scope.closeOptionsMenu = function () {
    $scope.optionsModal.hide();
  };

  $ionicModal.fromTemplateUrl('templates/statusOptions.html', function (optionsModal) {
    $scope.optionsModal = optionsModal;
  }, {
    scope: $scope,
    animation: 'none',
    focusFirstInput: true
  });

  /* Edit Status*/

  $scope.editWindow = false;
  $scope.openEditStatus = function () {
    $scope.editWindow = true;
    $scope.optionsModal.hide();
    $scope.message.text = $scope.optionsStatus;
    $scope.modal.show();
  }

  $scope.updateStatus = function (message) {
    NewsService.editStatus(message, $scope.optionsStatusId, user.userID, [$rootScope.location.latitude, $rootScope.location.longitude], 30).then(function (updateQueryRes) {
      var currentIndex = _.findIndex($scope.newsFeed, {'_id': $scope.optionsStatusId});
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;
      $scope.newsFeed[currentIndex].status = updateQueryRes.status;
      $scope.closeModal();
    });
  }

  $scope.deleteStatus = function () {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Delete Status',
      template: 'Are you sure you want to delete the status?'
    });

    confirmPopup.then(function (res) {
      $scope.optionsModal.hide();
      if (res) {
        NewsService.deleteStatus($scope.optionsStatusId, user.userID, [$rootScope.location.latitude, $rootScope.location.longitude], 30).then(function (updateQueryRes) {
          var statusIndex = _.findIndex($scope.newsFeed, {_id: $scope.optionsStatusId});
          $scope.newsFeed.splice(statusIndex, 1);
        });
      }
    });
  };

  $scope.blockUser = function () {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Block User',
      template: 'Are you sure you want to block this user?'
    });

    confirmPopup.then(function (res) {
      $scope.optionsModal.hide();
      if (res) {
        NewsService.blockUser(user.userID, $scope.optionsUserId, [$rootScope.location.latitude, $rootScope.location.longitude], 30).then(function (updateQueryRes) {
          _.remove($scope.newsFeed, function (eachStatus) {
            return eachStatus.userId == $scope.optionsUserId;
          });
        });
      }
    });

  };

  $scope.shareStatus = function () {
    $scope.optionsModal.hide();
  };

  $scope.sort = 1;
  $scope.sortHot = function () {
    $scope.sort = 1;
  };

  $scope.sortRecent = function () {
    $scope.sort = 2;
  }


});

stepNote.controller('NewsDetailCtrl', function ($scope, $state, $stateParams, $rootScope, $timeout, $cordovaGeolocation, LocalStorage, NewsService) {

  if ($rootScope.location.latitude == null || $rootScope.location.latitude == undefined) {
    var options = {timeout: 30000, enableHighAccuracy: true};
    $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
      $rootScope.location.latitude = position.coords.latitude;
      $rootScope.location.longitude = position.coords.longitude;
    });
  }

  var user = LocalStorage.getUser();
  $scope.inputValue = {
    message: ""
  };


  $scope.loading = true;
  NewsService.getStatus($stateParams.statusId, user.userID).then(function (statusQueryRes) {
    $scope.article = statusQueryRes;
    $rootScope.reply.statusGroupId = $scope.article._id;
    $scope.loading = false;
  });

  $rootScope.reply.parentId = $stateParams.statusId;
  $scope.startReply = function (replyId) {
    $rootScope.reply.parentId = replyId;
    var element = document.getElementById('replyText')
    if (element) {
      $timeout(function () {
        element.focus();
      });
    }
  };

  $scope.getLocation = function () {
    var status = $scope.article;
    if (status && status.city && status.state) {
      return " " + status.city + ", " + status.state;
    }
  };

  $scope.checkStatus = function (emotion) {
    var status = $scope.article;
    return status && status.userstatusEmotion && status.userstatusEmotion == emotion
  };

  $scope.getEmotionCount = function (emotion) {
    var status = $scope.article;
    if (status && emotion == 'like') {
      return status.likeCount
    }
    else if (status && emotion == 'dislike') {
      return status.dislikeCount
    }
    return 0;
  };

  $scope.updateOrDeleteEmotion = function (emotion) {
    if($scope.checkStatus(emotion)){
      //delete emotion
      deleteEmotion(emotion)
    }
    else {
      //update emotion
      updateEmotion(emotion)
    }
  };

  var updateEmotion = function (emotion) {
    NewsService.updateEmotion($scope.article._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 30, true).then(function (updateQueryRes) {
      $scope.article.dislikeCount = updateQueryRes.dislikeCount;
      $scope.article.likeCount = updateQueryRes.likeCount;
      $scope.article.userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  var deleteEmotion = function (emotion) {
    NewsService.deleteEmotion($scope.article._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 30, true).then(function (updateQueryRes) {
      $scope.article.dislikeCount = updateQueryRes.dislikeCount;
      $scope.article.likeCount = updateQueryRes.likeCount;
      $scope.article.userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  $scope.saveComment = function () {
    NewsService.saveStatus($scope.inputValue.message, user.userID, user.displayName, "", [$rootScope.location.latitude, $rootScope.location.longitude], 30, "commentText", $rootScope.reply.parentId, $rootScope.reply.statusGroupId).then(function (updateQueryRes) {
      $scope.article.replies.push(updateQueryRes.ops[0]);
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
    '<span class="articlebottomitem" ng-click="startReply(status._id)"> Reply </span>' +
    ' <span class="articlebottomitem" ng-click="divClicked(status)"> {{status.replies.length}} comments</span>' +

    '<span class="eachLikeIcon">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'like\')}}</span>' +
    '<span class="icon ion-arrow-up-c fontOfLikeIcon" ng-if="!checkStatus(status, \'like\')" ng-click="updateEmotion(status, \'like\')"></span>' +
    '<Span class="fontOfLike " ng-if="!checkStatus(status, \'like\')"> Like</Span>' +
    '<span class="icon ion-arrow-up-c fontOfLikeIcon makeLikeIconBold" ng-if="checkStatus(status, \'like\')" ng-click="deleteEmotion(status, \'like\')"></span>' +
    '<Span class="fontOfLike makeLikeIconBold" ng-if="checkStatus(status, \'like\')"> Like</Span>' +
    '</span>' +

    '<span class="eachLikeIcon">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'dislike\')}}</span>' +
    '<span class="icon ion-arrow-down-c fontOfLikeIcon" ng-if="!checkStatus(status, \'dislike\')" ng-click="updateEmotion(status, \'dislike\')"></span>' +
    '<Span class="fontOfLike " ng-if="!checkStatus(status, \'dislike\')"> Dislike</Span>' +
    '<span class="icon ion-arrow-down-c fontOfLikeIcon makeLikeIconBold" ng-if="checkStatus(status, \'dislike\')" ng-click="deleteEmotion(status, \'dislike\')"></span>' +
    '<Span class="fontOfLike makeLikeIconBold" ng-if="checkStatus(status, \'dislike\')"> Dislike</Span>' +
    '</span>' +


    ' </div>' +
    '</div>',

    link: function (scope, elem, attr) {
      var user = LocalStorage.getUser();
      NewsService.getStatus(attr.statusid, user.userID).then(function (statusQueryRes) {
        scope.status = statusQueryRes;
      }.bind(scope));
    },

    controller: function ($scope, $element, $rootScope, $timeout, $attrs, NewsService, LocalStorage) {

      var user = LocalStorage.getUser();
      $scope.divClicked = function (status) {

        if (status.active == undefined || !status.active) {

          _.forEach(status.replies, function (eachReply) {
            var el = $compile("<div style='margin-left: 4px '><commenttree statusid=" + eachReply._id + "></commenttree> </div>")($scope);
            $element.append(el);
          });
          status.active = true
        }
        else {
          $element.find("commenttree").remove();
          status.active = false
        }

      };

      $scope.startReply = function (replyId) {
        $rootScope.reply.parentId = replyId;
        //console.log(document.getElementById('replyText'), replyId)
        var element = document.getElementById('replyText')
        if (element) {
          $timeout(function () {
            element.focus();
          });
        }
      }

      $scope.checkStatus = function (status, emotion) {
        return status && status.userstatusEmotion && status.userstatusEmotion == emotion
      }

      $scope.getEmotionCount = function (status, emotion) {
        if (status && emotion == 'like') {
          return status.likeCount
        }
        else if (status && emotion == 'dislike') {
          return status.dislikeCount
        }
        return 0;
      }

      $scope.updateEmotion = function (status, emotion) {
        NewsService.updateEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 30, true).then(function (updateQueryRes) {
          $scope.status = updateQueryRes;
        });
      };

      $scope.deleteEmotion = function (status, emotion) {
        NewsService.deleteEmotion(status._id, user.userID, emotion, [$rootScope.location.latitude, $rootScope.location.longitude], 30, true).then(function (updateQueryRes) {
          $scope.status = updateQueryRes;
        });
      };

    }

  };
});


stepNote.filter('formatdate', function ($filter) {
  return function (timestamp) {
    var currentDate = new Date()
    var toFormat = new Date(timestamp)
    if (toFormat.getDate() == currentDate.getDate() && toFormat.getMonth() == currentDate.getMonth() && toFormat.getFullYear() == currentDate.getFullYear()) {
      return 'Today ' + $filter('date')(toFormat.getTime(), 'shortTime')
    }
    if (toFormat.getDate() == (currentDate.getDate() - 1) && toFormat.getMonth() == currentDate.getMonth() && toFormat.getFullYear() == currentDate.getFullYear()) {
      return 'Yesterday ' + $filter('date')(toFormat.getTime(), 'shortTime')
    }

    return $filter('date')(toFormat.getTime(), 'M/d/yy h:mm a')
  }
});

stepNote.filter('orderByHot', function() {
  return function(item) {
    return item.dislikeCount + item.likeCount + item.replyCount;
  };
});
