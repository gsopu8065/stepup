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
  NewsService.getNews('','',user.userID).then(function (newsQueryRes) {

    $scope.newsFeed = newsQueryRes;
  });

  $scope.updateEmotion = function(status, emotion){
    NewsService.updateEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      console.log("success")
    });
  };

  $scope.deleteEmotion = function(status, emotion){
    NewsService.deleteEmotion(status._id, user.userID, emotion).then(function (updateQueryRes) {
      console.log("success")
    });
  };

  $scope.saveStatus = function(message){
    NewsService.saveStatus(message, user.userID, user.displayName, "", "", "text", null,  null).then(function (updateQueryRes) {
      console.log("success")
    });
  };

  $scope.blockUser = function(blockUser){
    NewsService.blockUser( user.userID, blockUser).then(function (updateQueryRes) {
      console.log("success")
    });
  }

  $scope.checkStatus = function(status, emotion){
    return status.userStatus && status.userStatus.emotion == emotion
  }

});
