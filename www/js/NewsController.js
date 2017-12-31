stepNote.controller('NewsCtrl', function ($scope, $rootScope, $timeout, $cordovaGeolocation, $state, $ionicBackdrop, $ionicModal, $ionicPopup, $ionicActionSheet, $cordovaSocialSharing, $cordovaImagePicker, $cordovaCamera, $ionicSlideBoxDelegate, $ionicScrollDelegate, NewsService) {


  /*$rootScope.uid = "6qDGwYfzFjQQ16kZMCM2i9TJhfn2";
   $rootScope.displayName = "jack phone";
   $rootScope.location = {
   "longitude": -86.929105 ,
   "latitude": 36.073874};*/


  $scope.showDetails = function (article) {
    $rootScope.articleDetails = article;
    $state.go('tab.news-detail', {statusId: article._id});
  };

  $scope.showImages = function (zoomedArticle, index) {
    $scope.zoomedArticle = zoomedArticle;
    $scope.activeSlide = index;
    $scope.showZoomModal('templates/gallery-zoomview.html');
  };

  $scope.showZoomModal = function (templateUrl) {
    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: $scope
    }).then(function (modal) {
      $scope.zoomModal = modal;
      $scope.zoomModal.show();
    });
  }

  $scope.closeZoomModal = function () {
    $scope.zoomModal.hide();
    $scope.zoomModal.remove()
  };

  $scope.updateSlideStatus = function (slide) {
    var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;
    if (zoomFactor == 1) {
      $ionicSlideBoxDelegate.enableSlide(true);
    } else {
      $ionicSlideBoxDelegate.enableSlide(false);
    }
  };

  //get location
  $scope.loading = true;

  NewsService.getNews({
    latitude: $rootScope.location.latitude,
    longitude: $rootScope.location.longitude
  }, 50, $rootScope.uid).then(function (newsQueryRes) {
    $scope.loading = false;
    $scope.newsFeed = newsQueryRes;
  });

  $scope.doRefresh = function (status) {
    $ionicScrollDelegate.resize();
    $scope.$broadcast('scroll.refreshComplete');
    /*NewsService.getNews({
     latitude: $rootScope.location.latitude,
     longitude: $rootScope.location.longitude
     }, 30, $rootScope.uid).then(function (newsQueryRes) {
     $scope.newsFeed = newsQueryRes;
     $scope.$broadcast('scroll.refreshComplete');
     }, function(error){
     $scope.$broadcast('scroll.refreshComplete');
     });*/

  };

  $scope.getLocation = function (status) {
    if (status.city && status.state) {
      return " " + status.city + ", " + status.state;
    }
  };

  $scope.imageClick = function () {
    var options = {
      maximumImagesCount: 5, // Max number of selected images, I'm using only one for this example
     width: 800,
     height: 800,
      quality: 80,            // Higher is better,
      outputType: 1
     };

    $cordovaImagePicker.getPictures(options).then(function (imagePaths) {
     // Loop through acquired images
      _.forEach(imagePaths, function (imagePath) {
        var value = {
          url: "data:image/jpeg;base64," + imagePath,
          _file: b64toBlob(imagePath, "data:image/jpeg;base64")
        };
        $scope.message.files.push(value);
      });

      focusMessageBox();

     }, function(error) {
      focusMessageBox();
    });

  };


  $scope.takePhoto = function () {

    var options = {
      quality: 100,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: false,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: 0,
      targetWidth: 1024,
      targetHeight: 768,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };

    $cordovaCamera.getPicture(options).then(function (dataURL) {

      var value = {
        url: "data:image/jpeg;base64," + dataURL,
        _file: b64toBlob(dataURL, "data:image/jpeg;base64")
      };
      $scope.message.files.push(value);
      focusMessageBox();
    }, function (err) {
      focusMessageBox();
    });
  };

  function focusMessageBox() {
    var element = document.getElementById('statusText');
    if (element) {
      $timeout(function () {
        element.focus();
      });
    }
  }

  function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
  }

  $scope.message = {
    files: []
  };
  $scope.saveStatus = function (message) {
    $scope.closeModal();
    NewsService.saveStatus(message, $rootScope.uid, [$rootScope.location.longitude, $rootScope.location.latitude], "text", null, null).then(function (updateQueryRes) {
      $scope.newsFeed.push(updateQueryRes.ops[0]);
    });
  };

  $scope.deleteFile = function (index) {
    $scope.message.files.splice(index, 1);
  };

  $scope.checkMessage = function (message) {
    return (message.text != undefined && message.text.trim().length > 0) || message.files.length > 0
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
    var currentIndex = _.findIndex($scope.newsFeed, {'_id': status._id});
    $scope.newsFeed[currentIndex].userstatusEmotion = emotion;
    NewsService.updateEmotion(status._id, $rootScope.uid, emotion).then(function (updateQueryRes) {
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  $scope.deleteEmotion = function (status, emotion) {
    var currentIndex = _.findIndex($scope.newsFeed, {'_id': status._id});
    $scope.newsFeed[currentIndex].userstatusEmotion = undefined;
    NewsService.deleteEmotion(status._id, $rootScope.uid, emotion).then(function (updateQueryRes) {
      $scope.newsFeed[currentIndex].dislikeCount = updateQueryRes.dislikeCount;
      $scope.newsFeed[currentIndex].likeCount = updateQueryRes.likeCount;
      $scope.newsFeed[currentIndex].replyCount = updateQueryRes.replyCount;
      $scope.newsFeed[currentIndex].userstatusEmotion = updateQueryRes.userstatusEmotion;

    });
  };

  $scope.openStatus = function () {
    $ionicModal.fromTemplateUrl('templates/newStatus.html', {
      scope: $scope,
      focusFirstInput: true,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
      $scope.modal.show();
    });
  };

  $scope.closeModal = function () {
    $scope.message = {
      files: []
    };
    //$scope.editWindow = false;
    $scope.modal.remove();
  };

  $scope.closeReportSpam = function (reportStatus) {
    if (reportStatus == 1 || reportStatus == 2 || reportStatus == 3) {
      //send report
      NewsService.reportIssue($scope.reportArticle._id, $rootScope.uid, reportStatus).then(function (reportIssue) {
      })
    }
    if (reportStatus == 4) {
      //block user
      blockUser($scope.reportArticle.userId)
    }
    $scope.reportModal.remove();
  };

  $scope.openOptionsMenu = function (article) {

    var sameUserEvent = function (index) {
      switch (index) {
        case 0 :
          $scope.shareStatus(article);
          return true;
        case 1 :
          deleteStatus(article._id);
          return true;
      }
    };

    var differentUserEvent = function (index) {
      switch (index) {
        case 0 :
          $scope.shareStatus(article);
          return true;
        case 1 :
          blockUser(article.userId);
          return true;
        case 2 :
          $scope.reportArticle = article;
          $ionicModal.fromTemplateUrl('templates/reportSpam.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function (modal) {
            $scope.reportModal = modal;
            $scope.reportModal.show();
          });
          return true;
      }
    };

    var globalUserEvent = function (index) {
      switch (index) {
        case 0 :
          $scope.shareStatus(article);
          return true;
      }
    };

    var actionSheet = {
      cancelText: 'Cancel'
    };

    if (article.userId == $rootScope.uid) {

      actionSheet.buttons = [{text: 'Share Status via...'},
        {text: 'Delete Status'}
      ];
      actionSheet.buttonClicked = sameUserEvent
    }
    else if (article.isGlobal && article.isGlobal == true) {
      actionSheet.buttons = [{text: 'Share Status via...'}];
      actionSheet.buttonClicked = globalUserEvent
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

  /* $scope.editWindow = false;
  var openEditStatus = function (article) {
    $scope.editWindow = true;
    $scope.optionsStatusId = article._id;
    $scope.message.text = article.status;
    $scope.modal.show();
   }*/

  $scope.updateStatus = function (message) {
    NewsService.editStatus(message, $scope.optionsStatusId, $rootScope.uid).then(function (updateQueryRes) {
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
        NewsService.deleteStatus(optionsStatusId, $rootScope.uid).then(function (updateQueryRes) {
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
        NewsService.blockUser($rootScope.uid, optionsUserId).then(function (updateQueryRes) {
          /*_.remove($scope.newsFeed, function (eachStatus) {
            return eachStatus.userId == optionsUserId;
           });*/
        });
      }
    });

  };

  $scope.shareStatus = function (article) {
    $cordovaSocialSharing
      .share(article.status, "From: Myna", article.media, null) // Share via native share sheet
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
        order = status['sort'];
        break;
      case 2:
        order = status['timeStamp'];
        break;
      default:
        order = status['sort'];
    }
    return order;
  };

  //on every tab level
  $scope.$on('$ionicView.enter', function (e) {
    if ($rootScope.location.latitude) {
      //$scope.loading = true;
      NewsService.getNews({
        latitude: $rootScope.location.latitude,
        longitude: $rootScope.location.longitude
      }, 30, $rootScope.uid).then(function (newsQueryRes) {
        _.forEach(newsQueryRes, function (eachObject) {
          var index = _.findIndex($scope.newsFeed, function (o) {
            return o._id == eachObject._id;
          })
          if (index == -1) {
            $scope.newsFeed.push(eachObject);
          }
        });
      });
    }
  });
  console.log($rootScope.location.longitude, $rootScope.location.latitude)
});

stepNote.controller('NewsDetailCtrl', function ($scope, $rootScope, $state, $stateParams, $ionicPopup, $timeout, NewsService) {

  //var user = LocalStorage.getUser();
  $scope.inputValue = {
    message: ""
  };

  $scope.article = $rootScope.articleDetails;
  $rootScope.reply.statusGroupId = $scope.article._id;

  $scope.showBlockUser = function (articleUserId, isGlobal) {
    return isGlobal || ($rootScope.uid == articleUserId);
  };

  $scope.loading = true;
  NewsService.getStatus($stateParams.statusId, $rootScope.uid).then(function (statusQueryRes) {
    $scope.article.replies = statusQueryRes.replies;
    $scope.loading = false;
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
        NewsService.blockUser($rootScope.uid, status.userId).then(function (updateQueryRes) {
          /* _.remove($scope.newsFeed, function (eachStatus) {
            return eachStatus.userId == optionsUserId;
           });*/
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
    $scope.article.userstatusEmotion = emotion;
    NewsService.updateEmotion($scope.article._id, $rootScope.uid, emotion).then(function (updateQueryRes) {
      $scope.article.dislikeCount = updateQueryRes.dislikeCount;
      $scope.article.likeCount = updateQueryRes.likeCount;
      $scope.article.userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  var deleteEmotion = function (emotion) {
    $scope.article.userstatusEmotion = undefined;
    NewsService.deleteEmotion($scope.article._id, $rootScope.uid, emotion).then(function (updateQueryRes) {
      $scope.article.dislikeCount = updateQueryRes.dislikeCount;
      $scope.article.likeCount = updateQueryRes.likeCount;
      $scope.article.userstatusEmotion = updateQueryRes.userstatusEmotion;
    });
  };

  $scope.saveComment = function () {
    $scope.loading = true;
    $scope.article.replies = [];
    NewsService.saveStatus({text: $scope.inputValue.message}, $rootScope.uid, [$rootScope.location.longitude, $rootScope.location.latitude], "commentText", $rootScope.reply.parentId, $rootScope.reply.statusGroupId).then(function (updateQueryRes) {
      $scope.article.replies = updateQueryRes.replies;
      $scope.inputValue.message = "";
      $scope.loading = false;
    });
  };

  $scope.goBack = function () {
    $state.go('tab.news')
  }

});

stepNote.directive('commenttree', function ($compile, NewsService, $rootScope, LocalStorage) {
  return {
    restrict: 'E',
    scope: {commenttree: '@'},
    template: '<div class="commentDiv">' +
    '<div class="replyComment" ng-click="divClicked(status)">{{ status.status  }}</div>' +
    '<div class="commentbottom">' +
    '<span class="articlebottomitem" ng-click="startReply(status._id)"> Reply </span>' +
    ' <span class="articlebottomitem" ng-click="divClicked(status)"> {{status.replies.length}} <i class="fa fa-comments-o" style="font-size: 21px;color: darkgray;"></i></span>' +

    '<span class="eachLikeIcon" ng-click="updateOrDeleteEmotion(status, \'like\')">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'like\')}}</span>' +
    '<i class="fa  fontOfLikeIcon" aria-hidden="true" ng-class="{true:\'fa-thumbs-up makeLikeIconBold\',false:\'fa-thumbs-o-up\', undefined:\'fa-thumbs-o-up\'}[checkStatus(status, \'like\')]"></i>' +
    '</span>'+

    '<span class="eachLikeIcon" ng-click="updateOrDeleteEmotion(status, \'dislike\')">' +
    '<span class="fontOfLike likeCount blackColor">{{getEmotionCount(status, \'dislike\')}}</span>' +
    '<i class="fa fontOfLikeIcon" aria-hidden="true" ng-class="{true:\'fa-thumbs-down makeLikeIconBold\',false:\'fa-thumbs-o-down\', undefined:\'fa-thumbs-o-down\'}[checkStatus(status, \'dislike\')]"></i>' +
    '</span>' +

    ' </div>' +
    '</div>',

    link: function (scope, elem, attr) {
      NewsService.getStatus(attr.statusid, $rootScope.uid).then(function (statusQueryRes) {
        scope.status = statusQueryRes;
      }.bind(scope));
    },

    controller: function ($scope, $element, $rootScope, $timeout, $attrs, NewsService) {
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
      };

      $scope.updateEmotion = function (status, emotion) {
        $scope.status.userstatusEmotion = emotion;
        NewsService.updateEmotion(status._id, $rootScope.uid, emotion).then(function (updateQueryRes) {
          $scope.status.dislikeCount = updateQueryRes.dislikeCount;
          $scope.status.likeCount = updateQueryRes.likeCount;
          $scope.status.userstatusEmotion = updateQueryRes.userstatusEmotion;
        });
      };

      $scope.deleteEmotion = function (status, emotion) {
        $scope.status.userstatusEmotion = undefined;
        NewsService.deleteEmotion(status._id, $rootScope.uid, emotion).then(function (updateQueryRes) {
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
    return item.sort;
  };
});

stepNote.directive('spinner', function () {
    return {
      restrict: 'E',
      template: '<i class="fa fa-spinner fa-2x fa-spin"></i>',
      scope: {
        show: '='
      }
    };
  }
);

stepNote.directive('ngFileModel', ['$parse', function ($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var model = $parse(attrs.ngFileModel);
      var isMultiple = attrs.multiple;
      var modelSetter = model.assign;
      element.bind('change', function () {
        var values = [];
        angular.forEach(element[0].files, function (item) {
          var value = {
            // File Name
            name: item.name,
            //File Size
            size: item.size,
            //File URL to view
            url: URL.createObjectURL(item),
            // File Input Value
            _file: item
          };
          values.push(value);
        });
        scope.$apply(function () {
          if (isMultiple) {
            modelSetter(scope, values);
          } else {
            modelSetter(scope, values[0]);
          }
        });
      });
    }
  };
}]);
