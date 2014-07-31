/*jslint browser:true devel:true */
/*global $ chrome */

/*
 * inputHandler --
 *
 *   Handles input for all page views.
 */

var inputHandler = (function() {
  'use strict';

  var m_mainWindow,
      m_taskbarPos,
      m_windowMgr,
      m_inputBgColor;

  /*
   * processAbout: opens up a new page for application info.
   */
  var processAbout = function(e) {
    if (m_windowMgr) {
      var windowObj = m_windowMgr.launchAboutPage();
      if (m_mainWindow.getAboutPageWindow() === undefined) {
        m_mainWindow.setAboutPageWindow(windowObj);
      }

    } else {
      console.log("Error: Cannot launch about page, windowMgr not defined");
    }
  };

  /*
   * processFeedbackLaunch: opens up a new page for feedback.
   */
  var processFeedbackLaunch = function(e) {
    if (m_windowMgr) {
      m_windowMgr.launchFeedbackPage();
    } else {
      console.log("Error: Cannot launch feedback page, windowMgr not defined");
    }
  };

  /*
   * processEnd: Close up all windows and state and submit anything that
   * hasn't been submitted.
   */
  var processEnd = function(e) {
    console.log("Submit all called.");

    if (m_windowMgr && m_mainWindow) {
      var feedbackData = {};
      feedbackData.issues = m_mainWindow.getIssues();
      feedbackData.sessionID = m_mainWindow.getSessionID();
      m_windowMgr.launchReviewIssuesPage(feedbackData);

    } else {
      console.log("Error: Cannot launch issues review page, " +
                  "windowMgr or mainWindow not defined");
    }

    // XXX This is a way to get all remaining issue data and close those
    // windows
    //
    // var allWindows = chrome.app.window.getAll();
    // var i;
    // for (i = 0; i < allWindows.length; i += 1) {
    //     if (allWindows[i].taskbarWindowName === "feedbackPage") {
    //         console.log("closing feedback page");
    //         console.log(allWindows[i]);
    //         allWindows[i].close();
    //     }
    // }
  };

  /*
   * processHelp: opens up a new page to provide help.
   */
  var processHelp = function(e) {
    if (m_windowMgr) {
      m_windowMgr.launchHelpPage();
    } else {
      console.log("Error: Cannot launch help page, windowMgr not defined");
    }
  };


  /*
   * minimizeAboutWindow: hokey animation for minimizing towards the taskbar.
   */
  var minimizeAboutWindow = function() {
    var aboutPageWindow = m_mainWindow.getAboutPageWindow();
    if (aboutPageWindow !== undefined) {
      aboutPageWindow.minimize(m_taskbarPos, window);
    } else {
      console.log("Error, aboutPageWindow handle not defined.");
    }
  };

  /*
   * changeSessionIDAck: Acknowledges the affirmation in the changing of the
   * session ID workflow.
   */
  var changeSessionIDAck = function() {
    var sessionID = $('#sessionID')[0].value;
    m_mainWindow.setSessionID(sessionID);
    minimizeAboutWindow();
  };

  /*
   * changeSessionIDReject: Reject the changing of the session ID.
   */
  var changeSessionIDReject = function() {
    $('#changeSessionID').hide();
    $('#sessionID').prop("readonly", false);
    $('#sessionID').css("background-color", m_inputBgColor);
  };

  /*
   * emailIsValid: returns true for valid email, false otherwise.
   */
  var emailIsValid = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  /*
   * processSubmitID: processes the ID submission sequence, which consists of
   * storing the value of the user/session ID and minimizing the window to the
   * taskbar for better taskbar discoverability.
   */
  var processSubmitID = function(e) {
    var sessionID = $('#sessionID')[0].value;

    if (!emailIsValid(sessionID)) {
      console.log("email has invalid format.");
      return;
    }

    if (m_mainWindow !== undefined) {
      var inputBgColor,
          currentSID = m_mainWindow.getSessionID();

      if (currentSID === undefined) {
        m_mainWindow.setSessionID(sessionID);
        minimizeAboutWindow();
      } else if (currentSID !== sessionID) {
        $('#changeSessionID').show();
        // input field transition
        $('#sessionID').prop("readonly", true);
        inputBgColor = $('#sessionID').css("background-color");
        $('#sessionID').css("background-color", "#CCCCCC");
      } else {
        // session ID hasn't changed.
        minimizeAboutWindow();
      }
    }
  };

  /*
   * processSubmitIssue: processes and submit issue.
   */
  var processSubmitIssue = function(e) {
    var issueDetail = $('#issueDetail')[0].value;

    if (m_mainWindow === undefined) {
      return;
    }

    if (issueDetail !== undefined &&
        issueDetail.length !== 0) {

      var now = Date.now(),
          issueCategory = $('#issueCategory').val();

      console.log("timestamp %s: issueCategory \'%s\' detail \'%s\'",
                  now.toString(), issueCategory, issueDetail);
      m_mainWindow.addIssue(
        {
          "issueCategory": issueCategory,
          "issueDetail": issueDetail,
          "timestamp": now
        }
      );

      window.close();
    }
  };

  /*
   * processSubmitSendAllIssues: signal end of lab session.
   */
  var processSubmitSendAllIssues = function(e) {
    m_mainWindow.sendGather();
    window.close();
  };

  /*
   * processCancelAck: Cancellation was acknowledged.
   */
  var processCancelAck = function(e) {
    window.close();
  };

  /*
   * processCancelReject: Cancellation was rejected.
   */
  var processCancelReject = function(e) {
    $('#cancel').show();
    $('#cancelText').hide();
    $('#cancelAck').hide();
    $('#cancelReject').hide();
  };


  /*
   * processCancel: Start the cancel workflow.
   */
  var processCancel = function(e) {
    var issueDetail = $('#issueDetail')[0];

    if ((issueDetail && issueDetail.value.length !== 0) ||
        $('#reviewWrap').is(":visible")) {
      // I tried doing this dynamically using
      // jquery-ui.append().button().click(), but the element was always
      // click()'ed or, if click() wasn't defined, then the button didn't
      // respond to the inserted jquery id.
      $('#cancel').hide();
      $('#cancelText').show();
      $('#cancelAck').show();
      $('#cancelReject').show();
    } else {
      window.close();
    }
  };

  $(document).ready(function () {
    /*
     * Get the position of the taskbar so that we can minimize towards that
     * window.
     */
    if (chrome && chrome.runtime && chrome.runtime.getBackgroundPage) {
      chrome.runtime.getBackgroundPage(function(window) {
        var sessionID;

        m_mainWindow = window.taskbarBackground;
        sessionID = m_mainWindow.getSessionID();
        m_taskbarPos = m_mainWindow.getTaskbarWindow().getPosition();
        m_windowMgr = m_mainWindow.getWindowMgr();

        if (sessionID !== undefined) {
          $('input#sessionID').val(sessionID);
        }
      });
    }

    // Here's the trick we use to set the badge value.  Basically we export a
    // function into the taskbar window, which we know is the taskbar because
    // we've defined the badge css class.  This could be used for any page that
    // has that class.  Then when the taskbar is launched from the mainBgWindow,
    // we stash the appWindow handle that has the taskbar contextWindow, which
    // is this window context.  The mainBgWindow can then call into this context
    // to set the value.
    //
    // XXX REFACTOR: We should try to refactor this to something more taskbar
    // independent, but this file is already riddled with shared and specific
    // tasks between all pages.
    if ($('.badge').length) {
      // Hide the entire badge until there is a value.
      $('.badge').hide();

      // This is used to set the value.
      window.setBadgeValue = function(value) {
        $('.badge').show();
        $('.badgeDetail').text(value);
      };
    }

    // --- Input hooking below ---
    /*
     * Add input hooks to the taskbar buttons.
     */
    $('#aboutButton').click(processAbout);
    $('#feedbackButton').click(processFeedbackLaunch);
    $('#endButtonBag').click(processEnd);
    $('#helpButton').click(processHelp);

    /*
     * About page hook
     */
    $('#idSubmit').click(processSubmitID);
    $('#changeSessionID').hide();
    $('#changeSessionIDAck').click(changeSessionIDAck);
    $('#changeSessionIDReject').click(changeSessionIDReject);

    /*
     * Feedback page hooks
     */
    $('#issueSubmit').click(processSubmitIssue);

    /*
     * Review issues page hooks.
     */
    $('#sendAllIssuesSubmit').click(processSubmitSendAllIssues);

    /*
     * Cancel workflow.
     */
    $('#cancel').click(processCancel);
    $('#cancelReject').click(processCancelReject);
    $('#cancelAck').click(processCancelAck);
    $('#cancelText').hide();
    if ($('#cancel').length !== 0) {
      $('#cancelAck').hide();
    }
    $('#cancelReject').hide();

    /*
     * Miscellaenous hooking for animation.
     */
    $('div.animate').hover(
      function(){
        $(this).addClass("hover");
      },
      function(){
        $(this).removeClass("hover");
      }
    );
  });
}());
