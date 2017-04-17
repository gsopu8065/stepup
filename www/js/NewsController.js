stepNote.controller('NewsCtrl', function ($scope, $state, NewsService) {


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
  NewsService.getNews('','','').then(function (newsQueryRes) {
    $scope.newsFeed = newsQueryRes;
  });

})
