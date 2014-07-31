/*jslint browser:true devel:true sub:true */

/*
 * requests.js --
 *
 *    Generate Taskbar UI JSON requests to be sent.
 */

var taskbarUIRequest = function() {
  'use strict';

  // XXX figure out how to load and validate the generated and incoming requests
  // to the schema.
  //
  // console.log("calling getJSON");
  //
  // var foo = $.getJSON("foo.json", null, function(data) {
  //   console.log("got data");
  //   console.log(data);
  //   $.each(data, function(key, val) {
  //     console.log(key + ": " + val);
  //   });
  // });

  /*
   * addHeader: Add the message header to the request.
   */
  function addHeader(req) {
    req["$schema"] = "http://json-schema.org/draft-04/schema#";
    req["version"] = "0.0.1";
    req["type"] = "object";
    req["title"] = "Taskbar UI API";
    req["description"] = "Taskbar API shared between the UI and server process.";
  }

  /*
   * addGetIssuesRequest: add the components for the getIssues request.
   */
  function addGetIssuesRequest(sessionID, req) {
    req["command"] = "GET_ISSUE";
    req["sessionID"] = sessionID;
  }

  /*
   * addIssueRequest: add the components for the new issue request.
   */
  function addIssueRequest(issue, isNew, req) {
    req["command"] = "PUT_ISSUE";
    req["sessionID"] = issue["sessionID"];
    if (isNew) {
      req["issueUpdateType"] = "NEW";
    } else {
      req["issueUpdateType"] = "UPDATE";
    }
    req["issueCategory"] = issue["issueCategory"];
    req["issueDetail"] = issue["issueDetail"];
    req["timestamp"] = issue["timestamp"];

    // I don't think we need to scrub the text on the client side since we don't
    // eval/interpret the text at all and it's well encapsulated in the string
    // object.  The serve shouldn't need to scrub either unless it intends to
    // interpret the string in some way.  Leaving this as an example if we need
    // it later.
    //
    // req["issueDetail"] = scrubText(issue["issueDetail"]);
  }

  /*
   * addGatherRequest: add the components for the gather request.
   */
  function addGatherRequest(sessionID, req) {
    req["command"] = "GATHER_DATA";
    req["sessionID"] = sessionID;
  }

  function scrubText(text) {
    if (text) {
      return text.replace(/"/gm, '\"');
    } else {
      return text;
    }
  }

  return {
    /*
     * getIssuesRequest: called when new session ID is submitted.
     */
    getIssuesRequest: function(sessionID) {
      var req = {};
      addHeader(req);
      addGetIssuesRequest(sessionID, req);
      console.log("getIssuesRequest");
      console.log(req);

      return JSON.stringify(req);
    },

    /*
     * submitIssueRequest: called when new feedback has been submitted.
     */
    submitIssueRequest: function(issue, isNew) {
      var req = {};
      addHeader(req);
      addIssueRequest(issue, isNew, req);
      console.log("submitIssueRequest");
      console.log(req);

      return JSON.stringify(req);
    },

    /*
     * sendGatherRequest: called when user is done with the lab.
     */
    sendGatherRequest: function(sessionID) {
      var req = {};
      addHeader(req);
      addGatherRequest(sessionID, req);
      console.log("sendGatherRequest");
      console.log(req);

      return JSON.stringify(req);
    }
  };
};
