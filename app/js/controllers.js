/*jslint browser:true devel:true */
/*global $ chrome */
/*
 * controllers --
 *
 *   Angular controller for the reviewList page/app.
 */

var reviewIssuesApp = angular.module('reviewIssuesApp', []);

/*
 * reviewIssuesApp --
 *
 *   This app provides us with the ability to display a list of issues.
 */

reviewIssuesApp.controller('reviewIssuesController', function($scope) {
  'use strict';
  var appWindow;
  console.log("issuesController initialized");
  $scope.issues = {};

  // The data is set in the window launch callback.
  if (chrome && chrome.app) {
    appWindow = chrome.app.window.current();
    $scope.sessionID = appWindow.feedbackData.sessionID;
    $scope.issues = appWindow.feedbackData.issues;

    if ($scope.issues.length === 0) {
      $('#noIssues').show();
      $('#reviewWrap').hide();
    } else {
      console.log("showing issues");
      $('#noIssues').hide();
      $('#reviewWrap').show();
    }
  }
});
