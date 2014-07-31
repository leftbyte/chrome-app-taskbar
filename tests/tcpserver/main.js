
var tcpServer;
var commandWindow;

/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  if (commandWindow && !commandWindow.contentWindow.closed) {
    commandWindow.focus();
  } else {
    chrome.app.window.create('index.html',
			     {id: "mainwin",
                              'alwaysOnTop': true,
                              bounds: {width: 500, height: 309, left: 0}},
			     function(w) {
			       commandWindow = w;
			     });
  }
});


// event logger
var log = (function(){
  var logLines = [];
  var logListener = null;

  var output=function(str) {
    if (str.length>0 && str.charAt(str.length-1)!='\n') {
      str+='\n'
    }
    logLines.push(str);
    if (logListener) {
      logListener(str);
    }
  };

  var addListener=function(listener) {
    logListener=listener;
    // let's call the new listener with all the old log lines
    for (var i=0; i<logLines.length; i++) {
      logListener(logLines[i]);
    }
  };

  return {output: output, addListener: addListener};
})();



function onAcceptCallback(tcpConnection, socketInfo) {
  var info="["+socketInfo.peerAddress+":"+socketInfo.peerPort+"] Connection accepted!";
  log.output(info);
  console.log("XXX logging socketInfo");
  console.log(socketInfo);
  tcpConnection.addDataReceivedListener(function(data) {
    var lines = data.split(/[\n\r]+/);
    for (var i=0; i<lines.length; i++) {
      var line=lines[i];
      if (line.length>0) {
        var info="["+socketInfo.peerAddress+":"+socketInfo.peerPort+"] "+line;
        log.output(info);

        var cmd=line.split(/\s+/);
        try {
          tcpConnection.sendMessage(Commands.run(cmd[0], cmd.slice(1)));
        } catch (ex) {
          tcpConnection.sendMessage(ex);
        }
      }
    }
  });
};

function onAcceptCallback2(tcpConnection, socketInfo) {
  var info="["+socketInfo.peerAddress+":"+socketInfo.peerPort+"] Connection accepted!";
  log.output(info);
  console.log("XXX logging socketInfo");
  console.log(socketInfo);

  tcpConnection.addDataReceivedListener(function(data) {
    console.log("XXX received data!");
    console.log(data);
    log.output(data);

    // var lines = data.split(/[\n\r]+/);
    // for (var i=0; i<lines.length; i++) {
    //   var line=lines[i];
    //   if (line.length>0) {
    //     var info="["+socketInfo.peerAddress+":"+socketInfo.peerPort+"] "+line;
    //     log.output(info);

    //     var cmd=line.split(/\s+/);
    //     try {
    //       tcpConnection.sendMessage(Commands.run(cmd[0], cmd.slice(1)));
    //     } catch (ex) {
    //       tcpConnection.sendMessage(ex);
    //     }
    //   }
    // }
  });

  // console.log("XXX sending hello");
  // tcpConnection.sendMessage("XXX Hello");
  var m_fakeLabID = "fakeLabID";
  var req = {
    "sessionID": "dvadar@leftbyte.com",
    "labID": m_fakeLabID,
    "command": "REPORT_ISSUES",
    "issues":  [
      {
        "sessionID": "dvadar@leftbyte.com",
        "labID": m_fakeLabID,
        "issueID": 1,
        "issueCategory": "Tech Bug",
        "issueDetail": "Toaster button did not work.",
        "timestamp": 1402079661028
      },
      {
        "sessionID": "dvadar@leftbyte.com",
        "labID": m_fakeLabID,
        "issueID": 2,
        "issueCategory": "UI Bug",
        "issueDetail": "No toaster button.",
        "timestamp": 1402079961028
      },
      {
        "sessionID": "dvadar@leftbyte.com",
        "labID": m_fakeLabID,
        "issueID": 3,
        "issueCategory": "Tech Bug",
        "issueDetail": "Toaster popped toast down instead of up.",
        "timestamp": 1402078961028
      }
    ]
  };

  console.log("XXX sending request");
  console.log(req);

  tcpConnection.sendMessage(JSON.stringify(req));
}

function startServer(addr, port) {
  if (tcpServer) {
    tcpServer.disconnect();
  }
  tcpServer = new TcpServer(addr, port);
  tcpServer.listen(onAcceptCallback2);
}


function stopServer() {
  if (tcpServer) {
    tcpServer.disconnect();
    tcpServer=null;
  }
}

function getServerState() {
  if (tcpServer) {
    return {isConnected: tcpServer.isConnected(),
      addr: tcpServer.addr,
      port: tcpServer.port};
  } else {
    return {isConnected: false};
  }
}
