/*jslint browser:true devel:true */
/*globals $ chrome */

/*
 * taskbarWindows --
 *
 * Taskbar Window launchers.
 */
var taskbarWindows = function() {
  'use strict';
  // Taskbar position has to be "global" so that I can do that animation.
  // These need to be shared with the about page so we can minimize to it.
  var m_taskbarWidth = 136, // with help button: 156
      m_taskbarHeight = 24,
      m_taskbarX = Math.floor((screen.availWidth - m_taskbarWidth) / 2),
      m_taskbarY = 0;

  return {
    /*
     * launchAboutPage: Launch the about page.
     */
    launchAboutPage: function() {
      var aboutWidth = 360,
          aboutHeight = 300;

      // Create the about page
      chrome.app.window.create(
        "../templates/about.html",
        {
          id: "taskbarAbout",
          frame: "none",
          'alwaysOnTop': true,
          resizable: false,
          // XXX: in Chrome 36, we should switch to outerBounds
          bounds: {
            width: aboutWidth,
            height: aboutHeight
          },
          // we're going to minimize towards the taskbar,
          minWidth: m_taskbarWidth,
          minHeight: m_taskbarHeight
        },
        function(createdWindow) {
          // This sucks.  I want it to launch the first time in the
          // right place, but it's launching into a stupid size and
          // position, so I have to set it correctly.  But then if you
          // hit 'about' after the window is launched, it will resize
          // and move.
          createdWindow.moveTo(Math.floor((screen.availWidth - aboutWidth) / 2),
                               m_taskbarY + 100);
          createdWindow.resizeTo(aboutWidth, aboutHeight);
          createdWindow.taskbarWindowName = "aboutPage";
        });

      // the return object provides functions for the window.
      return {
        /*
         * minimize: poor man's animation of window minimization towards the
         * taskbar.
         */
        minimize: function(taskbarPos, currentWindow) {
          var i = 0,
              slideAnimationSteps = 3,
              widthStep = currentWindow.outerWidth / slideAnimationSteps,
              heightStep = currentWindow.outerHeight / slideAnimationSteps,
              xStep = (currentWindow.screenX - taskbarPos[0]) / slideAnimationSteps,
              yStep = (currentWindow.screenY - taskbarPos[1]) / slideAnimationSteps,
              bgColor = $('body').css('background-color'),
              slideUpID;

          $('h2').css({'color': bgColor});
          $('.splash').css({'color': bgColor});
          slideUpID = setInterval(function() {
            i += 1;
            if (i >= slideAnimationSteps) {
              clearInterval(slideUpID);
              currentWindow.close();
            }
            currentWindow.moveTo(currentWindow.screenX - xStep, currentWindow.screenY - yStep);
            currentWindow.resizeTo(currentWindow.outerWidth - widthStep,
                                   currentWindow.outerHeight - heightStep);
          }, 15);
        }
      };
    },

    /*
     * launchTaskbar: Launch the taskbar.  Returns an object that has accessor
     * functions to the taskbar.
     */
    launchTaskbar: function() {
      // Create the taskbar and move it into position.
      var m_taskbarAppWindow;

      chrome.app.window.create(
        "../templates/taskbar.html",
        {
          id: "taskbarTaskbar",
          frame: "none",
          'alwaysOnTop': true,
          resizable: false,
          // XXX: in Chrome 36, we should switch to outerBounds
          bounds: {
            width: m_taskbarWidth,
            height: m_taskbarHeight,
            // XXX: This property doesn't snap to this location as documented.
            left: m_taskbarX,
            top: m_taskbarY
          },
          minWidth: m_taskbarWidth,
          minHeight: m_taskbarHeight,
          maxWidth: m_taskbarWidth,
          maxHeight: m_taskbarHeight
        },
        function(createdWindow) {
          createdWindow.moveTo(m_taskbarX, m_taskbarY);
          createdWindow.taskbarWindowName = "taskbar";
          m_taskbarAppWindow = createdWindow;
        });

      return {
        getPosition: function() {
          return [m_taskbarX, m_taskbarY];
        },
        getAppWindow: function() {
          return m_taskbarAppWindow;
        }
      };
    },

    /*
     * launchFeedbackPage: Launch the feedback page.
     */
    launchFeedbackPage: function() {
      var feedbackWidth = 400,
          feedbackHeight = 400;
      chrome.app.window.create(
        "../templates/feedback.html",
        {
          // id:
          frame: "none",
          'alwaysOnTop': false,
          resizable: false,
          // XXX: in Chrome 36, we should switch to outerBounds
          bounds: {
            width: feedbackWidth,
            height: feedbackHeight
          },
          minWidth: feedbackWidth,
          minHeight: feedbackHeight
        },
        function(createdWindow) {
          createdWindow.taskbarWindowName = "feedbackPage";
          createdWindow.onClosed.addListener(function() {
            // We tried to save the feedback, but the DOM elements
            // have already been reclaimed at this point and these
            // don't exist.
            //
            // var feedbackDetail = $('#feedbackDetail')[0].value;
            // var issueCategory = $('#feedbackCategory').val();
          });
        });
    },

    /*
     * launchHelpPage: Launch the help page.
     */
    launchHelpPage: function() {
      var helpWidth = 400,
          helpHeight = 240;
      chrome.app.window.create(
        "../templates/help.html",
        {
          id: 'taskbarHelp',
          frame: 'none',
          'alwaysOnTop': false,
          // XXX: in Chrome 36, we should switch to outerBounds
          bounds: {
            width: helpWidth,
            height: helpHeight
          },
          minWidth: helpWidth,
          minHeight: helpHeight
        },
        function(createdWindow) {
          createdWindow.taskbarWindowName = "helpPage";
        });
    },

    /*
     * launchReviewIssuesPage: launch the review issues page.
     */
    launchReviewIssuesPage: function(feedbackData) {
      var issuesWidth = 400,
      // Minimum height for header/title
          issuesHeight = 180,
          issuesMax = 660,
          i;

      for (i = 0; i < feedbackData.issues.length; i += 1) {
        // Each issue needs at least 80 px height.
        issuesHeight += 40;

        // For each line (width of ~30), we need another row.
        issuesHeight += Math.round((feedbackData.issues[i].issueDetail.length / 30) * 6,
                                   10);
        if (issuesHeight > issuesMax) {
          issuesHeight = issuesMax;
          break;
        }
      }

      chrome.app.window.create(
        "../templates/reviewIssues.html",
        {
          // id:
          frame: "none",
          'alwaysOnTop': false,
          resizable: false,
          // XXX: in Chrome 36, we should switch to outerBounds
          bounds: {
            width: issuesWidth,
            height: issuesHeight
          },
          minWidth: issuesWidth,
          minHeight: issuesHeight
        },
        function(createdWindow) {
          createdWindow.taskbarWindowName = "reviewIssuesPage";
          createdWindow.feedbackData = feedbackData;
        });

    } // end of return object list.
  };
};
