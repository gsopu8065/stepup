angular.module('starter.newsservices', [])

  .factory('NewsService', function ($http, $q) {
    var NewsService = {};
    NewsService.getNews = function(location, radius, userId){
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: 'http://localhost:5000/newsFeed',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "location":[-77.18621789486043,
            38.82741811639861],
          "radius":3,
          "userId":"1234"
        }
      };

      $http(req).then(function(success){
        console.log(success);
        info.resolve(success.data);
      }, function(error){
        console.log(error);
        info.reject(error);
      });
      return info.promise;
    }

    return NewsService;
  });
