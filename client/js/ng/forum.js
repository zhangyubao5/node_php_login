'use strict';
var thisView = angular.module('ngqs.app', ['ngRoute', 'ngCookies'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/app', {
    templateUrl: '/templates/forum.html',
    controller: 'Ctrl'
  });
}])

.controller('Ctrl', ['$scope', '$http', '$cookies', '$cookieStore', function($scope, $http, $cookies, $cookieStore) {
  console.log($cookies);
  $scope.username = $cookies.username;
  $scope.roleid = $cookies.roleid;
  //////////////////////////////Users//////////////////////////////
  $scope.users = [];
  $http.get("/users").success(function(users){
    $scope.users = users;
    if (users.permissionerror=='1') {$scope.user_nopermission=true;};
  });

  $scope.revokeUser = function(user) {
    $http.put("/users/"+user.username).success(function(user){
      console.log("user revoked: ", user);
    });
  };
  
  //////////////////////////////Topics//////////////////////////////
  //console.log($cookieStore.get('username'));
  $scope.topics = [];
    $http.get("/topics").success(function(topics){
      $scope.topics = topics;
      if (topics.permissionerror=='1') {$scope.topic_nopermission=true;};
    });
    $scope.saveTopic = function(topic){
      if (topic.hasOwnProperty('_id') && ($scope.roleid=='1' || $scope.roleid=='2')){
        $http.put("/topics/"+topic._id, topic).success(function(topic){
          console.log("topic saved: ",topic);
        });
      } else {
        alert("No permission!");
      }
    };
    
    $scope.toggleEditMode = function(repeatScope){
      if (!!repeatScope.editMode){
        repeatScope.editMode = false;
      } else {
        repeatScope.editMode = true;
      }
    };
    
    $scope.destroyTopic = function(topic){
      if (topic.hasOwnProperty('_id') && ($scope.roleid=='1' || $scope.roleid=='2')){
        $http.delete("/topics/"+topic._id).success(function(){
          var index = $scope.topics.indexOf(topic);
          if (index > -1){
            $scope.topics.splice(index, 1);
          }
        });
      } else {
        alert("No permission!");
      }
    };
    
    $scope.addTopic = function(){
      var newTopic = {topicname: $scope.topicname || "defaulttopic", username: $scope.username};
      if ($scope.roleid == '1' || $scope.roleid == '2') {
        $http.post("/topics", newTopic).success(function(topic){
          $scope.topics.push(topic);
          $scope.topicname = '';
        });
      }  else {
        alert("No permission!");
      }
    };

    //////////////////////////////Articles//////////////////////////////

    $scope.articles = [];
    $http.get("/articles").success(function(articles){
      $scope.articles = articles;
      if (articles.permissionerror=='1') {$scope.article_nopermission=true;};
    });
    $scope.saveArticle = function(article){
      if (article.hasOwnProperty('_id') && (article.username == $scope.username || $scope.roleid=='2'|| $scope.roleid=='1')){
        $http.put("/articles/"+article._id, article).success(function(article){
          console.log("article saved: ",article);
        });
      } else {
        alert("No permission!");
      }
    };
    
    $scope.toggleEditMode = function(repeatScope){
      if (!!repeatScope.editMode){
        repeatScope.editMode = false;
      } else {
        repeatScope.editMode = true;
      }
    };
    
    $scope.destroyArticle = function(article){
      if (article.hasOwnProperty('_id') && (article.username == $scope.username || $scope.roleid=='2'|| $scope.roleid=='1')){
        $http.delete("/articles/"+article._id).success(function(){
          var index = $scope.articles.indexOf(article);
          if (index > -1){
            $scope.articles.splice(index, 1);
          }
        });
      } else {
        alert("No permission!");
      }
    };
    
    $scope.addArticle = function(){
      var newArticle = {articlename: $scope.articlename || "yaclone", username: $scope.username};
      if ($scope.roleid == '1' || $scope.roleid == '2' || $scope.roleid =='3') {
        $http.post("/articles", newArticle).success(function(article){
          $scope.articles.push(article);
          $scope.articlename = '';
        });
      }  else {
        alert("No permission!");
      }
    };

    //////////////////////////////Comments//////////////////////////////
    $scope.comments = [];
    $http.get("/comments").success(function(comments){
      $scope.comments = comments;
      if (comments.permissionerror=='1') {$scope.comment_nopermission=true;};
    });
    $scope.saveComment = function(comment){
      if (comment.hasOwnProperty('_id') && comment.username == $scope.username){
        $http.put("/comments/"+comment._id, comment).success(function(comment){
          console.log("comment saved: ",comment);
        });
      } else {
        alert("No permission!");
      }
    };
    
    $scope.toggleEditMode = function(repeatScope){
      if (!!repeatScope.editMode){
        repeatScope.editMode = false;
      } else {
        repeatScope.editMode = true;
      }
    };
    
    $scope.destroyComment = function(comment){
      if (comment.hasOwnProperty('_id') && (comment.username == $scope.username || $scope.roleid=='1')){
        $http.delete("/comments/"+comment._id).success(function(){
          var index = $scope.comments.indexOf(comment);
          if (index > -1){
            $scope.comments.splice(index, 1);
          }
        });
      }
       else {
        alert("No permission!");
      }
    };
    
    $scope.addComment = function(){
      var newComment = {commentname: $scope.commentname || "yaclone", username: $scope.username};
      if ($scope.roleid == '1' || $scope.roleid=='4') {
        $http.post("/comments", newComment).success(function(comment){
          $scope.comments.push(comment);
          $scope.commentname = '';
        });
      }  else {
        alert("No permission!");
      }
    };
}]);
