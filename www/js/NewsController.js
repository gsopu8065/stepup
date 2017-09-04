stepNote.run(function ($rootScope) {

  $rootScope.location = [];
  $rootScope.reply = [];
  $rootScope.reply.parentId = '';
  $rootScope.reply.statusGroupId = '';
});

stepNote.controller('NewsCtrl', function ($scope, $rootScope, $ionicLoading, $cordovaGeolocation, $state, $ionicModal, $ionicPopup, $ionicActionSheet, $cordovaSocialSharing, LocalStorage, NewsService) {

  //get User
  var user = LocalStorage.getUser();
  $scope.user = user;

  //get location
  $ionicLoading.show();
  var options = {timeout: 30000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
    $rootScope.location.latitude = position.coords.latitude;
    $rootScope.location.longitude = position.coords.longitude;
    NewsService.getNews({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, 30, user.userID).then(function (newsQueryRes) {
      $ionicLoading.hide();
      $scope.newsFeed = newsQueryRes;
    });
  });

  $scope.getLocation = function (status) {
    if (status.city && status.state) {
      return " " + status.city + ", " + status.state;
    }
  };

  $scope.message = {};
  $scope.saveStatus = function (message) {
    NewsService.saveStatus(message, user.userID, user.displayName, "", [$rootScope.location.longitude, $rootScope.location.latitude], 30, "text", null, null).then(function (updateQueryRes) {
      $scope.newsFeed.push(updateQueryRes.ops[0]);
      $scope.closeModal();
    });
  };

  $scope.checkMessage = function (message) {
    return message != undefined && message.trim().length > 0
  }

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
    NewsService.updateEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      var currentIndex = _.findIndex($scope.newsFeed, {'_id': status._id});
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  $scope.deleteEmotion = function (status, emotion) {
    NewsService.deleteEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
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

  $ionicModal.fromTemplateUrl('templates/reportSpam.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.reportModal = modal;
  });

  $scope.closeReportSpam = function (reportStatus) {
    console.log("reportStatus ", reportStatus);
    if (reportStatus == 1 || reportStatus == 2 || reportStatus == 3) {
      //send report
      NewsService.reportIssue($scope.reportArticle._id, user.userID, reportStatus).then(function (reportIssue) {
      })
    }
    if (reportStatus == 4) {
      //block user
      blockUser($scope.reportArticle.userId)
    }
    $scope.reportModal.hide();
  };

  $scope.openOptionsMenu = function (article) {

    var sameUserEvent = function (index) {
      switch (index) {
        case 0 :
          console.log("share")
          $scope.shareStatus(article);
          return true;
        case 1 :
          console.log("Edit Status")
          openEditStatus(article);
          return true;
        case 2 :
          console.log("Delete Status")
          deleteStatus(article._id);
          return true;
      }
    };

    var differentUserEvent = function (index) {
      switch (index) {
        case 0 :
          console.log("share")
          $scope.shareStatus(article);
          return true;
        case 1 :
          console.log("Block this user");
          blockUser(article.userId)
          return true;
        case 2 :
          console.log("Report Status");
          $scope.reportArticle = article;
          $scope.reportModal.show();
          return true;
      }
    };

    var actionSheet = {
      cancelText: 'Cancel'
    };

    if (article.userId == $scope.user.userID) {
      actionSheet.buttons = [{text: 'Share Status via...'},
        {text: 'Edit Status'},
        {text: 'Delete Status'}
      ];
      actionSheet.buttonClicked = sameUserEvent
    }
    else {
      actionSheet.buttons = [
        {text: 'Share Status via...'},
        {text: 'Block User'},
        {text: 'Report Status'}
      ];
      actionSheet.buttonClicked = differentUserEvent
    }
    $ionicActionSheet.show(actionSheet);
  };

  /* Edit Status*/

  $scope.editWindow = false;
  var openEditStatus = function (article) {
    $scope.editWindow = true;
    $scope.optionsStatusId = article._id;
    $scope.message.text = article.status;
    $scope.modal.show();
  }

  $scope.updateStatus = function (message) {
    NewsService.editStatus(message, $scope.optionsStatusId, user.userID).then(function (updateQueryRes) {
      var currentIndex = _.findIndex($scope.newsFeed, {'_id': $scope.optionsStatusId});
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;
      $scope.newsFeed[currentIndex].status = updateQueryRes.status;
      $scope.closeModal();
    });
  }

  var deleteStatus = function (optionsStatusId) {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Delete Status',
      template: 'Are you sure you want to delete the status?'
    });

    confirmPopup.then(function (res) {
      if (res) {
        NewsService.deleteStatus(optionsStatusId, user.userID).then(function (updateQueryRes) {
          var statusIndex = _.findIndex($scope.newsFeed, {_id: optionsStatusId});
          $scope.newsFeed.splice(statusIndex, 1);
        });
      }
    });
  };

  var blockUser = function (optionsUserId) {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Block User',
      template: 'Are you sure you want to block this user?'
    });

    confirmPopup.then(function (res) {
      if (res) {
        NewsService.blockUser(user.userID, optionsUserId).then(function (updateQueryRes) {
          _.remove($scope.newsFeed, function (eachStatus) {
            return eachStatus.userId == optionsUserId;
          });
        });
      }
    });

  };

  $scope.shareStatus = function (article) {
    $cordovaSocialSharing
      .share(article.status, "From: Myna", null, null) // Share via native share sheet
      .then(function (result) {
        // Success!
      }, function (err) {
        // An error occured. Show a message to the user
      });
  };

  $scope.sort = 1;
  $scope.sortHot = function () {
    $scope.sort = 1;
  };

  $scope.sortRecent = function () {
    $scope.sort = 2;
  };

  $scope.dynamicOrderFunction = function (status) {
    var order = 0;
    switch ($scope.sort) {
      case 1:
        order = status['likeCount'] + status['dislikeCount'] + status['replyCount'];
        break;
      case 2:
        order = status['timeStamp'];
        break;
      default:
        order = status['likeCount'] + status['dislikeCount'] + status['replyCount'];
    }
    return order;
  };

  //on every tab level
  $scope.$on('$ionicView.enter', function (e) {
    if ($rootScope.location.latitude) {
      $ionicLoading.show();
      //$scope.newsFeed = [];
      NewsService.getNews({
        latitude: $rootScope.location.latitude,
        longitude: $rootScope.location.longitude
      }, 30, user.userID).then(function (newsQueryRes) {
        $ionicLoading.hide();
        $scope.newsFeed = newsQueryRes;
      });
    }
  });

});

stepNote.controller('NewsDetailCtrl', function ($scope, $state, $ionicLoading, $stateParams, $ionicPopup, $rootScope, $timeout, $cordovaGeolocation, LocalStorage, NewsService) {

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


  $ionicLoading.show();
  NewsService.getStatus($stateParams.statusId, user.userID).then(function (statusQueryRes) {
    $scope.article = statusQueryRes;
    $rootScope.reply.statusGroupId = $scope.article._id;
    $ionicLoading.hide();
  });

  $rootScope.reply.parentId = $stateParams.statusId;
  $scope.startReply = function (replyId) {

    $rootScope.reply.parentId = replyId;
    var element = document.getElementById('replyText');
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

  $scope.blockUser = function () {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Block User',
      template: 'Are you sure you want to block this user?'
    });

    var status = $scope.article;
    confirmPopup.then(function (res) {
      if (res) {
        NewsService.blockUser(user.userID, status.userId).then(function (updateQueryRes) {
          _.remove($scope.newsFeed, function (eachStatus) {
            return eachStatus.userId == optionsUserId;
          });
        });
      }
    });

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
    NewsService.updateEmotion($scope.article._id, user.userID, emotion).then(function (updateQueryRes) {
      $scope.article.dislikeCount = updateQueryRes.dislikeCount;
      $scope.article.likeCount = updateQueryRes.likeCount;
      $scope.article.userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  var deleteEmotion = function (emotion) {
    NewsService.deleteEmotion($scope.article._id, user.userID, emotion).then(function (updateQueryRes) {
      $scope.article.dislikeCount = updateQueryRes.dislikeCount;
      $scope.article.likeCount = updateQueryRes.likeCount;
      $scope.article.userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  $scope.saveComment = function () {
    $ionicLoading.show();
    $scope.article.replies = [];
    NewsService.saveStatus($scope.inputValue.message, user.userID, user.displayName, "", [$rootScope.location.longitude, $rootScope.location.latitude], 30, "commentText", $rootScope.reply.parentId, $rootScope.reply.statusGroupId).then(function (updateQueryRes) {
      $scope.article.replies = updateQueryRes.replies;
      $scope.inputValue.message = "";
      $ionicLoading.hide();
    });
  };

  $scope.goBack = function () {
    $state.go('tab.news')
  }

});

stepNote.directive('commenttree', function ($compile, NewsService, LocalStorage) {
  return {
    restrict: 'E',
    scope: {commenttree: '@'},
    template: '<div class="commentDiv">' +
    '<div class="replyComment" ng-click="divClicked(status)">{{ status.status  }}</div>' +
    '<div class="commentbottom">' +
    '<span class="articlebottomitem" ng-click="startReply(status._id)"> Reply </span>' +
    ' <span class="articlebottomitem" ng-click="divClicked(status)"> {{status.replies.length}} comments</span>' +

    '<span class="eachLikeIcon" ng-click="updateOrDeleteEmotion(status, \'like\')">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'like\')}}</span>' +
  '<span class="icon ion-arrow-up-c fontOfLikeIcon" ng-class="{true:\'makeLikeIconBold\',false:\'\'}[checkStatus(status, \'like\')]"></span>' +
    '<Span class="fontOfLike" ng-class="{true:\'makeLikeIconBold\',false:\'\'}[checkStatus(status, \'like\')]"> Like</Span>' +
    '</span>'+

    '<span class="eachLikeIcon" ng-click="updateOrDeleteEmotion(status, \'dislike\')">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'dislike\')}}</span>' +
  '<span class="icon ion-arrow-down-c fontOfLikeIcon" ng-class="{true:\'makeLikeIconBold\',false:\'\'}[checkStatus(status, \'dislike\')]"></span>' +
    '<Span class="fontOfLike" ng-class="{true:\'makeLikeIconBold\',false:\'\'}[checkStatus(status, \'dislike\')]"> Dislike</Span>' +
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

      $scope.updateOrDeleteEmotion = function(status, emotion){
        if($scope.checkStatus(status, emotion)){
          $scope.deleteEmotion(status, emotion)
        }
        else{
          $scope.updateEmotion(status, emotion)
        }
      }

      $scope.updateEmotion = function (status, emotion) {
        NewsService.updateEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
          $scope.status.dislikeCount = updateQueryRes.dislikeCount;
          $scope.status.likeCount = updateQueryRes.likeCount;
          $scope.status.userstatusEmotion = updateQueryRes.userstatusEmotion;
        });
      };

      $scope.deleteEmotion = function (status, emotion) {
        NewsService.deleteEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
          $scope.status.dislikeCount = updateQueryRes.dislikeCount;
          $scope.status.likeCount = updateQueryRes.likeCount;
          $scope.status.userstatusEmotion = updateQueryRes.userstatusEmotion;
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
