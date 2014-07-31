/*jslint browser:true devel:true sub:true */
/*globals TcpClient taskbarUIRequest */

/*
 * uiComm.js --
 *
 *    Bridges communcation to the server for the taskbar UI.
 */

var feedbackUICommConnectionThread;

// requires tcpClient.js, requests.js
var taskbarUIComm = function(mainWindow, host, port, numRetries, retryIntervalMS) {
  'use strict';

  var m_tcpClient = new TcpClient(host, port),
      m_jsonRequests,
      m_mainWindow = mainWindow,
      m_host = host,
      m_port = port,
      m_numRetries = numRetries,
      m_currentRetries,
      m_retryIntervalMS = retryIntervalMS,
      m_queuedEvents = [],
      // forward declarations
      runConnectFeedbackServerThread;

  /*
   * connectFeedbackServer: Connect to the feedback server.  Requires
   * tcpClient.js.
   *
   */
  function connectFeedbackServer() {
    m_tcpClient.connect(function(resultCode) {

      // CONNECTION_TIMED_OUT === -118
      // CONNECTION_REFUSED === -102
      if (resultCode < 0) {
        console.log("Warning: connection error %d number of retries left %d",
                    resultCode, m_currentRetries);
        m_currentRetries -= 1;
        if (m_currentRetries < 1) {
          console.log("no more retries left");
          window.clearInterval(feedbackUICommConnectionThread);
        }

      } else {
        window.clearInterval(feedbackUICommConnectionThread);
        console.log('Connected to ' + host + ':' + port);
        m_tcpClient.addDataReceivedListener(processRecv);
        m_tcpClient.addErrorReceivedListener(processRecvError);
        sendQueuedEvents();
      }
    });
  }

  runConnectFeedbackServerThread = function() {
    m_currentRetries = m_numRetries;
    feedbackUICommConnectionThread = setInterval(connectFeedbackServer,
                                                 m_retryIntervalMS);
  };

  (function main() {
    runConnectFeedbackServerThread();
    m_jsonRequests = taskbarUIRequest();
  }());

  /*
   * processRecv: Process data received from the tcpClient.
   */
  function processRecv(str) {
    console.log("received data on socket: " + str);

    var req = JSON.parse(str);
    // XXX Need to verify the request to the schema.
    switch (req["command"]) {
      case "REPORT_ISSUES":
        if (req["sessionID"] === m_mainWindow.getSessionID()) {
          m_mainWindow.setIssues(req["issues"]);
        } else {
          console.log("Warning, incoming session ID for issues <" +
                      req["sessionID"] +
                      "> doesn't match current session ID <" +
                      m_mainWindow.getSessionID() + ">");
        }
        break;
      default:
        console.error("Error, unknown request received");
        console.error(req);
    }
  }

  /*
   * processRecvError: Process errors received from the tcpClient.
   */
  function processRecvError(info) {
    // A connection was closed (corresponding to a TCP FIN)
    if (info.resultCode === -100) {
      console.log("TCP connection was closed remotely.");
      runConnectFeedbackServerThread();
    } else {
      console.error("received error on socket: " + info);
    }
  }

  /*
   * sendQueuedEvents: Check and send any events that were queued while we were
   * disconnected.
   *
   */
  function sendQueuedEvents() {
    var event = m_queuedEvents.shift(),
        sendCb;

    sendCb = function(writeInfo) {
      console.log("getExistingIssues request sent successfully!");
      console.log(writeInfo);
    };

    while (event) {
      console.log("Sending queued event: " + event["requestStr"]);
      m_tcpClient.send(event["requestStr"], sendCb);
      event = m_queuedEvents.shift();
    }
  }

  /*
   * getExistingIssues: Request the set of issues from the server.
   */
  function getExistingIssues(sessionID) {
    var getIssuesRequestStr = m_jsonRequests.getIssuesRequest(sessionID);

    console.log("connected? " + m_tcpClient.isConnected);
    if (m_tcpClient === undefined || !m_tcpClient.isConnected) {
      console.error("Error, client not connected; can't get issues.");
      m_queuedEvents.push({
        "function": getExistingIssues,
        "requestStr": getIssuesRequestStr
      });
      return;
    }

    m_tcpClient.send(getIssuesRequestStr, function(writeInfo) {
      console.log("getExistingIssues request sent successfully!");
      console.log(writeInfo);
    });
  }

  /*
   * submitNewIssue: Submit a new issue to the server.
   */
  function submitNewIssue(issue, isNew) {
    var submitIssueRequestStr = m_jsonRequests.submitIssueRequest(issue, isNew);

    console.log("connected? " + m_tcpClient.isConnected);
    if (m_tcpClient === undefined || !m_tcpClient.isConnected) {
      console.error("Error, client not connected; can't get issues.");
      m_queuedEvents.push({
        "function": submitNewIssue,
        "requestStr": submitIssueRequestStr
      });
      return;
    }

    m_tcpClient.send(submitIssueRequestStr, function(writeInfo) {
      console.log("submitNewIssue request sent successfully!");
      console.log(writeInfo);
    });
  }

  /*
   * sendGather: Send the command to gather logs.
   */
  function sendGather(sessionID) {
    var sendGatherRequestStr = m_jsonRequests.sendGatherRequest(sessionID);

    if (m_tcpClient === undefined || !m_tcpClient.isConnected) {
      console.error("Error, client not connected; can't get issues.");
      m_queuedEvents.push({
        "function": sendGather,
        "requestStr": sendGatherRequestStr
      });
      return;
    }

    m_tcpClient.send(sendGatherRequestStr, function(writeInfo) {
      console.log("sendGather request sent successfully!");
      console.log(writeInfo);

      // XXX: Don't really know if we should disconnect here.
      m_tcpClient.disconnect();
      // stop any connect threads if they exist
      window.clearInterval(feedbackUICommConnectionThread);
    });
  }

  return {
    disconnect: function() {
      console.log("tcpClient.disconnect()");
      if (m_tcpClient !== undefined && m_tcpClient.isConnected) {
        m_tcpClient.disconnect();
      }
    },
    getExistingIssues: getExistingIssues,
    submitNewIssue: submitNewIssue,
    sendGather: sendGather
  };

};

