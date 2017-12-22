angular.module('starter.newsservices', [])

  .factory('NewsService', function ($http, $q, SERVER_API) {

    var userPort = "8001/myna";
    var statusPort = "8002/myna";
    var newsPort = "8003/myna";
    var emotionsPort = "8004/myna";

    var NewsService = {};
    NewsService.getNews = function(location, radius, userId){
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+newsPort+'/news/newsFeed',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "location":location,
          "radius":radius,
          "userId":userId+""
        }
      };

      $http(req).then(function(success){
        info.resolve(success.data);
      }, function(error){
        console.log("Http Error");
        console.log(error);
        info.reject(error);
      });
      return info.promise;
    };

    NewsService.updateEmotion = function (statusId, userId, emotion) {
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+emotionsPort+'/emotions/updateStatusEmotion',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId" : statusId+"",
          "userId": userId+"",
          "emotion": emotion + ""
        }
      };

      $http(req).then(function(success){
        info.resolve(success.data);
      }, function(error){
        console.log(error);
        info.reject(error);
      });
      return info.promise;

    };

    NewsService.deleteEmotion = function (statusId, userId, emotion) {
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+emotionsPort+'/emotions/deleteStatusEmotion',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId" : statusId+"",
          "userId": userId+"",
          "emotion": emotion + ""
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

    };

    NewsService.blockUser = function (userId, blockUserId) {
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+userPort+'/user/blockUser',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "userId" : userId+"",
          "blockUserId": blockUserId + ""
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

    };

    NewsService.saveStatus = function(status, userId, userName, isAnnonymous, location, radius, type, parentId,  statusGroupId){
      var info = $q.defer();

      var inputData = {
        "status": status.text || "",
        "userId": userId,
        "userName": userName,
        "isAnnonymous": true,
        "location":location,
        "radius": radius,
        "type": type,
        "parentId" : parentId,
        "statusGroupId" : statusGroupId,
        "count": status.files.length
      };
      var reqData = {
        data: JSON.stringify(inputData)
      }

      _.each(status.files, function (eachFile, index) {
        reqData[index] = eachFile._file;
      });

      console.log(reqData);
      $http({
        method: 'POST',
        url: SERVER_API+statusPort+'/status/saveStatus',
        headers: {
          'Content-Type': undefined
        },
        data: reqData,
        transformRequest: function (data, headersGetter) {
          var formData = new FormData();
          angular.forEach(data, function (value, key) {
            formData.append(key, value);
          });

          var headers = headersGetter();
          delete headers['Content-Type'];

          return formData;
        }
      }).then(function(success){
        info.resolve(success.data);
      }, function(error){
        info.reject(error);
      });
      return info.promise;

    };


    NewsService.editStatus = function (status, statusId, userId) {
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+statusPort+'/status/editStatus',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId": statusId,
          "status": status,
          "userId": userId
        }
      };

      $http(req).then(function(success){
        info.resolve(success.data);
      }, function(error){
        info.reject(error);
      });
      return info.promise;

    };

    NewsService.deleteStatus = function (statusId, userId) {
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+statusPort+'/status/deleteStatus',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId": statusId,
          "userId": userId
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

    };

    NewsService.getStatus = function(statusId, userId){
      var info = $q.defer();

      var req = {
        method: 'GET',
        url: SERVER_API+statusPort+'/status/getStatus?statusId='+statusId+'&userId='+userId
      };

      $http(req).then(function(success){
        info.resolve(success.data);
      }, function(error){
        console.log(error);
        info.reject(error);
      });
      return info.promise;
    };

    NewsService.reportIssue = function (statusId, userId, reportType) {
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API + userPort+ '/user/reportIssue',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId": statusId + "",
          "userId": userId + "",
          "reportType": reportType + "",
          "condition": "1"
        }
      };

      $http(req).then(function (success) {
        info.resolve(success.data);
      }, function (error) {
        console.log(error);
        info.reject(error);
      });
      return info.promise;

    };

    return NewsService;
  })
  // .constant('SERVER_API', "https://opennotewebservice.herokuapp.com");
  .constant('SERVER_API', "http://54.76.147.242:");
