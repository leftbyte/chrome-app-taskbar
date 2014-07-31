/*jslint browser:true devel:true */
/*globals chrome FileReader Blob ArrayBuffer Uint16Array */
/*
 * tcpClient --
 *
 * chrome.sockets.tcp API and state controller.
 */

// XXX rewrite this to have private variables rather than "this" that can be
// accessed externally.  E.g. tcpClient.connected is accessible:
// var foo = new TcpClient(...);
// console.log(foo.isConnected);

(function(context) {
  'use strict';

  /*
   * log --
   *
   * Wrapper function for information logging.
   */
  function log(msg) {
    console.log(msg);
  }

  /*
   * error --
   *
   * Wrapper function for error logging.
   */
  function error(msg) {
    console.error(msg);
  }

  /*
   * TcpClient --
   *
   * Creates an instance of the tcpClient.
   *
   * @param {String} host: Connect to this remote host.
   * @param {Number} port: Port number to be used.
   */
  function TcpClient(host, port) {

    this.tcpSocket = undefined;
    if (chrome) {
      this.tcpSocket = chrome.sockets.tcp;
    }
    this.host = host;
    this.port = port;

    this.callbacks = {
      connect: null,
      disconnect: null,
      sent: null,
      recv: null,
      recvError: null
    };

    // Socket.
    this.socketId = null;
    this.isConnected = false;

    log('Initialized TCP client: ' + host + ':' + port);
  }

  /**
   * Connects to the TCP socket, and creates an open socket.
   *
   * @see http://developer.chrome.com/apps/socket.html#method-create
   * @param {Function} callback The function to call on connection
   */
  TcpClient.prototype.connect = function(callback) {
    this.callbacks.connect = callback;
    var socketProperties = {persistent: false,
                            name: "feedbackClientUISocket",
                            bufferSize: 4096};

    this.tcpSocket.create(socketProperties, this.m_onCreate.bind(this));
    return true;
  };

  /**
   * Sends a message down the wire to the remote side
   *
   * @see http://developer.chrome.com/apps/socket.html#method-write
   * @param {String} msg The message to send
   * @param {Function} callback The function to call when the message has sent
   */
  TcpClient.prototype.send = function(msg, callback) {
    // Register sent callback.
    console.log("sending message: " + msg);
    this.callbacks.sent = callback;

    this.m_stringToArrayBuffer(msg + '\n', function(arrayBuffer) {
      this.tcpSocket.send(this.socketId, arrayBuffer, this.m_onSentComplete.bind(this));
    }.bind(this));
  };

  /**
   * Sets the callback for when a message is received.
   *
   * @param {Function} callback The function to call when a message has arrived
   */
  TcpClient.prototype.addDataReceivedListener = function(callback) {
    this.callbacks.recv = callback;
  };

  /**
   * Sets the callback for when an error is received
   *
   * @param {Function} callback The function to call when an error has arrived.
   */
  TcpClient.prototype.addErrorReceivedListener = function(callback) {
    // Register received callback.
    this.callbacks.recvError = callback;
  };

  /**
   * Disconnects from the remote side
   *
   * @see http://developer.chrome.com/apps/socket.html#method-disconnect
   */
  TcpClient.prototype.disconnect = function() {
    this.tcpSocket.disconnect(this.socketId);
    this.isConnected = false;
  };

  /**
   * The callback function used for when we attempt to have Chrome
   * create a socket. If the socket is successfully created
   * we go ahead and connect to the remote side.
   *
   * @private
   * @see http://developer.chrome.com/apps/socket.html#method-connect
   * @param {Object} createInfo The socket details
   */
  TcpClient.prototype.m_onCreate = function(createInfo) {
    this.socketId = createInfo.socketId;
    log("m_onCreate socketId: " + this.socketId);
    if (this.socketId > 0) {
      this.tcpSocket.connect(this.socketId, this.host, this.port, this.m_onConnectComplete.bind(this));
    } else {
      error('Unable to create socket');
    }
  };

  /**
   * The callback function used for when we attempt to have Chrome
   * connect to the remote side. If a successful connection is
   * made then polling starts to check for data to read
    *
    * @private
    * @param {Number} resultCode Indicates whether the connection was successful
    */
   TcpClient.prototype.m_onConnectComplete = function(resultCode) {
     log('onConnectComplete: ' + resultCode);

     if (this.callbacks.connect) {
       this.callbacks.connect(resultCode);
     }

     if (resultCode === 0) {
       console.log("Successful connection!");
       this.isConnected = true;
       if (this.tcpSocket) {
         if (!this.tcpSocket.onReceive.hasListener()) {
           console.log("OnReceive does not have listener");
           console.log(this.tcpSocket.onReceive);
           this.tcpSocket.onReceive.addListener(this.m_onReceive.bind(this));
         }
         if (!this.tcpSocket.onReceiveError.hasListener()) {
           console.log("OnReceiveError does not have listener");
           console.log(this.tcpSocket.onReceiveError);
           this.tcpSocket.onReceiveError.addListener(this.m_onReceiveError.bind(this));
         }
       }
     }


   };

   /**
    * Callback function for when data has been received from the socket.
    * Converts the array buffer that is read in to a string and sends it on for
    * further processing by passing it to the previously assigned callback
    * function.
    *
    * @private
    * @see TcpClient.prototype.addResponseListener
    * @param {Object} readInfo The incoming message
    */
   TcpClient.prototype.m_onReceive = function(readInfo) {
     // Call received callback if there's data in the response.
     log("onReceive socketId: " + readInfo.socketId);
     if (readInfo.socketId === this.socketId && this.callbacks.recv) {
       this.m_arrayBufferToString(readInfo.data, function(str) {
         this.callbacks.recv(str);
       }.bind(this));
     }
   };

   /**
    * Callback function for when there is an error received from the socket.
    *
    * @private
    * @see chrome.sockets.tcp.onReceiveError
    * @param {Object}
    */

   TcpClient.prototype.m_onReceiveError = function(info) {
     error("Error reported on socketID: " + info.socketId +
           " code " + info.resultCode);
     if (this.callbacks.recvError) {
       // see net_error_list.h
       // https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h&sq=package:chromium&l=111
       this.callbacks.recvError(info);
     }
   };

   /**
    * Callback for when data has been successfully
    * written to the socket.
    *
    * @private
    * @param {Object} writeInfo The outgoing message
    */
   TcpClient.prototype.m_onSentComplete = function(writeInfo) {
     log('onSentComplete');

     if (this.callbacks.sent) {
       this.callbacks.sent(writeInfo);
     }
   };

   /**
    * Converts an array buffer to a string
    *
    * @private
    * @param {ArrayBuffer} buf The buffer to convert
    * @param {Function} callback The function to call when conversion is complete
    */
   TcpClient.prototype.m_arrayBufferToString = function(buf, callback) {
     /*
      * This method is more robust for larger data, such as the list of issues.
      */
     var reader = new FileReader();
     reader.onload = function (e) {
       callback(e.target.result);
     };
     var blob = new Blob([buf], {type: 'application/octet-stream'});
     reader.readAsText(blob);

     // This method is is good for small data.
     // String.fromCharCode.apply(null, new Uint16Array(buf));
     // callback(buf);
  };

  /**
   * Converts a string to an array buffer
   *
   * @private
   * @param {String} str The string to convert
   * @param {Function} callback The function to call when conversion is complete
   */
  TcpClient.prototype.m_stringToArrayBuffer = function(str, callback) {
    /*
     * Use this method if we start transferring more data.
     *
     * var bb = new Blob([str]);
     * var f = new FileReader();
     * f.onload = function(e) {
     *   callback(e.target.result);
     *  };
     *  f.readAsArrayBuffer(bb);
     */
    var buf = new ArrayBuffer(str.length * 2), // 2 bytes for each char
        bufView = new Uint16Array(buf),
        i, strLen;

    for (i = 0, strLen = str.length; i < strLen; i += 1) {
      bufView[i] = str.charCodeAt(i);
    }
    callback(buf);
  };

  /*
   * Inject the TcpClient constructor into the outer context (window).
   */
  context.TcpClient = TcpClient;
}(window));
