angular.module('starter.newsservices', [])

  .factory('NewsService', function ($http, $q, SERVER_API) {
    var NewsService = {};
    NewsService.getNews = function(location, radius, userId){
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+'/newsFeed',
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
        console.log(error);
        info.reject(error);
      });
      return info.promise;
    };

    NewsService.updateEmotion = function(statusId, userId, emotion, location, radius){
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+'/updateStatusEmotion',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId" : statusId+"",
          "userId": userId+"",
          "emotion":emotion+"",
          "location":location,
          "radius":radius
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

    NewsService.deleteEmotion = function(statusId, userId, emotion, location, radius){
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+'/deleteStatusEmotion',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "statusId" : statusId+"",
          "userId": userId+"",
          "emotion":emotion+"",
          "location":location,
          "radius": radius
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

    NewsService.blockUser = function( userId, blockUserId, location, radius){
      var info = $q.defer();

      var req = {
        method: 'POST',
        url: SERVER_API+'/blockUser',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "userId" : userId+"",
          "blockUserId": blockUserId+"",
          "location":location,
          "radius": radius
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

      var req = {
        method: 'POST',
        url: SERVER_API+'/saveStatus',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "status": status,
          "userId": userId,
          "userName": userName,
          "isAnnonymous": true,
          "location":location,
          "radius": radius,
          "type": type,
          "parentId" : parentId,
          "statusGroupId" : statusGroupId
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

    NewsService.getStatus = function(statusId){
      var info = $q.defer();

      var req = {
        method: 'GET',
        url: SERVER_API+'/getStatus?statusId='+statusId
      };

      $http(req).then(function(success){
        info.resolve(success.data);
      }, function(error){
        console.log(error);
        info.reject(error);
      });
      return info.promise;
    };

    return NewsService;
  })

  .constant('SERVER_API',"https://opennotewebservice.herokuapp.com");
