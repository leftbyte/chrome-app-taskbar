/*
 * mainBgWindow.js --
 *
 *   Taskbar main background entry point.
 */

// requires window.js
var taskbarBackground = (function() {
  // 'use strict'; XXX I don't understand why this.getSessionID is not correct.

  var _windowMgr,
      _sessionID,
      _issueID = 0,
      _taskbarWindowObj,
      _aboutPageWindowObj,
      _issues = [];

  (function main() {

    // Check if we're running as a chrome app, for the karma testing framework.
    if (chrome && chrome.app && chrome.app.runtime) {
      chrome.app.runtime.onLaunched.addListener(function() {
        var host = '192.168.110.10',
            port = 10225;
        // var host = '127.0.0.1',
        //    port = 8888;

        var numRetries = 720, // 2 hours of retries
        retryIntervalMS = 10000;

        console.log("Taskbar UI connecting to %s:%d.", host, port);
        _uiComm = taskbarUIComm(this, host, port, numRetries, retryIntervalMS);

        _windowMgr = taskbarWindows();
        _aboutPageWindowObj = _windowMgr.launchAboutPage();
        _taskbarWindowObj = _windowMgr.launchTaskbar();
      });

      chrome.runtime.onInstalled.addListener(function() {
        console.log('installed');
      });

      chrome.runtime.onSuspend.addListener(function() {
        // Do some simple clean-up tasks.
      });
    }
  }());

  /*
   * setTaskbarBadgeValue: set the value of submitted issues in the taskbar.
   */
  function setTaskbarBadgeValue(issues) {
    var appWindow = _taskbarWindowObj.getAppWindow();
    if (appWindow.contentWindow.setBadgeValue) {
      if (issues.length === 0) {
        return;
      } else if (issues.length > 9) {
        appWindow.contentWindow.setBadgeValue("!");
      } else {
        appWindow.contentWindow.setBadgeValue(issues.length);
      }
    }
  }

  /*
   * getSessionID is needed by "this" when we provide it to the uiComm and by
   * other components that get the taskbarBackground.
   */
  this.getSessionID = function() {
    return _sessionID;
  };

  /*
   * getNextIssueID: Get the next issue ID.  Note that there is a small race
   * window where one client may submit an issue and another client submitting a
   * different issue where the issueIDs may be the same.  The next issue ID
   * should be updated in response to the setIssues command (REPORT_ISSUES
   * message).
   *
   * XXX The taskbar server should be the component to resolve this conflict.
   */
  function getNextIssueID() {
      _issueID += 1;
      return _issueID;
  }

  /*
   * setIssues: Replace our set of issues with a new set.
   *
   * XXX REFACTOR: The reason why we have this defined in 'this' rather than
   * exported below in our return object is because the uiComm is that we create
   * the uiComm in this object and hand it a reference to ourselves.  In the
   * other parts of the code that use the return object, it can get a reference
   * to the main window by calling chrome.runtime.getBackgroundPage().  We
   * should probably just pull the exported return object below into 'this'
   * style declarations for consistency.
   */
  this.setIssues = function(newIssues) {
    console.log("setting the new issues");
    console.log(newIssues);
    _issues = newIssues;

    setTaskbarBadgeValue(_issues);
    /*
     * We need to update our issue ID given this list.
     */
    var i, max = 0;
    for (i = 0; i < _issues.length; i += 1) {
      if (max < _issues.issueID) {
        max = _issues.issueID;
      }
    }
    _issueID = max + 1;
  };

  return {
    /*
     * setAboutPageWindow: Set the about page window handle.  Usually we don't
     * need this function since the about page is launched at start, but if we
     * disable that in main(), then the taskbar will need this function to set
     * the handle.
     */
    setAboutPageWindow: function(windowObj) {
      _aboutPageWindowObj = windowObj;
    },

    /*
     * getAboutPageWindow: Get the about page window, usually to call the
     * minimize function.
     */
    getAboutPageWindow: function() {
      return _aboutPageWindowObj;
    },
    /*
     * getWindowMgr: Get the handle to the windows page to launch other pages.
     */
    getWindowMgr: function() {
      return _windowMgr;
    },
    /*
     * getTaskbarWindow: get the taskbar window, mainly for supporting the
     * minimization animation towards the taskbar for discoverability.
     */
    getTaskbarWindow: function() {
      return _taskbarWindowObj;
    },
    /*
     * get/setSessionID: yes.
     */
    getSessionID: this.getSessionID,
    setSessionID: function(sid) {
      if (_sessionID === sid) {
        console.log("Warning, session ID submitted but not changed.");
      } else {
        _sessionID = sid;
        console.log("Calling out to server to get issues.");
        _uiComm.getExistingIssues(_sessionID);
      }
    },
    /*
     * getIssues: Return the current set of recorded issues.
     */
    getIssues: function() {
      return _issues;
    },
    /*
     * addIssue: Add an issue/feedback.
     */
    addIssue: function(newIssue) {
      newIssue.sessionID = _sessionID;
      newIssue.issueID = getNextIssueID();
      console.log(newIssue);
      _issues.push(newIssue);
      setTaskbarBadgeValue(_issues);
      _uiComm.submitNewIssue(newIssue, true);
    },
    /*
     * disconnect: disconnect the network socket from the server.
     */
    disconnect: function() {
      _uiComm.disconnect();
    },
    /*
     * sendGather: send the gather command to the server.
     */
    sendGather: function() {
      _uiComm.sendGather(_sessionID);
    }
  };
}());
