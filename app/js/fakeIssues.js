/*
 * fakeIssues --
 *
 *   Static fake issues for testing.
 */

(function fakeIssues(context) {
  'use strict';
  context.dphungIssues = [
    {
      "sessionID": "dphung@leftbyte.com",
      "issueID": 1,
      "issueCategory": "Tech Bug",
      "issueDetail": "Toaster button did not work.",
      "timestamp": 1402079661028
    },
    {
      "sessionID": "dphung@leftbyte.com",
      "issueID": 2,
      "issueCategory": "UI Bug",
      "issueDetail": "No toaster button.",
      "timestamp": 1402079961028
    },
    {
      "sessionID": "dphung@leftbyte.com",
      "issueID": 3,
      "issueCategory": "Tech Bug",
      "issueDetail": "Toaster popped toast down instead of up.",
      "timestamp": 1402078961028
    }
  ];

  context.vadarIssues = [
    {
      "sessionID": "dvadar@leftbyte.com",
      "issueID": 1,
      "issueCategory": "Tech Bug",
      "issueDetail": "The force did not get my spoon this morning.",
      "timestamp": 1402079662028
    },
    {
      "sessionID": "dvadar@leftbyte.com",
      "issueID": 2,
      "issueCategory": "UI Bug",
      "issueDetail": "Where to click to fire DeathStar?",
      "timestamp": 1402079663028
    },
    {
      "sessionID": "dvadar@leftbyte.com",
      "issueID": 3,
      "issueCategory": "Tech Bug",
      "issueDetail": "My TIE Advanced x1 started spinning out of control, making me dizzy.  I got all sick and vomitted some force barf all over my seat, so that needs to be cleaned up as well.",
      "timestamp": 1402089663028
    },

    {
      "sessionID": "dvadar@leftbyte.com",
      "issueID": 4,
      "issueCategory": "General",
      "issueDetail": "I messed up.  I had these kids, but I didn't tell them, and some Old Boy stuff almost happened so I had to cut my son's hand off.  He doesn't even know.  They'll both need counseling.",
      "timestamp": 1402089663028
    },

    {
      "sessionID": "dvadar@leftbyte.com",
      "issueID": 5,
      "issueCategory": "Fist bump",
      "issueDetail": "This interface. Such amaze.",
      "timestamp": 1402089663028
    }

    // {
    //   "sessionID": "dvadar@leftbyte.com",
    //   "issueID": 6,
    //   "issueCategory": "UI Bug",
    //   "issueDetail": "Where to click to fire DeathStar?",
    //   "timestamp": 1402079663028
    // },

    // {
    //   "sessionID": "dvadar@leftbyte.com",
    //   "issueID": 7,
    //   "issueCategory": "Tech Bug",
    //   "issueDetail": "My TIE Advanced x1 started spinning out of control, making me dizzy.  I got all sick and vomitted some force barf all over my seat, so that needs to be cleaned up as well.",
    //   "timestamp": 1402089663028
    // }
  ];
}(window));
