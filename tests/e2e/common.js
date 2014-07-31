(function() {
  var maxDepth = 52;

  function debugWindowHandles(pInst, recursionDepth, handles) {
    var i;
    console.log("recursionDepth %d handle.length %d",
                recursionDepth, handles.length);
    for (i = 0; i < handles.length; i++) {
      pInst.driver.switchTo().window(handles[i]);
      pInst.driver.getTitle().then(function(title) {
        console.log("title: " + title);
      });
    }
  };

  /*
   * m_getAppWindowHandle --
   *
   *   Recursively get the window handle of the Chrome application.
   */
  function m_getAppWindowHandle(pInst, onHandle, onError) {
    var windowTitleFound = false;

    function lookForAppWindow(recursionDepth) {
      pInst.driver.getAllWindowHandles().then(function (handles) {
        // XXX Uncomment for debugging
        // debugWindowHandles(pInst, recursionDepth, handles);

        // Using the debugWindowHandle function, we can see that our app
        // window starts with three handles, first the "data:," window, then
        // the taskbar and the about page.
        if (handles.length !== 1) {

          for (i = 0; i < handles.length; i++) {
            pInst.driver.switchTo().window(handles[i]);
            pInst.driver.getTitle().then(function(title) {
              if (title.indexOf("Taskbar") != -1) {
                windowTitleFound = true;
              }
            });

            if (windowTitleFound) {
              onHandle(handles);
              return;
            }
          }
          // else fall through
        }

        if (recursionDepth < 0) {
          return onError("no handle found");
        }

        lookForAppWindow(recursionDepth - 1);
      });
    }
    lookForAppWindow(maxDepth)
  };

  /*
   * m_findPageAndDo --
   *
   *   Search for the page handle with the title and execute the function in
   * that page context.
   */
  function m_findPageAndDo(ptor, pageTitle, onPageHandle, onError) {
    m_getAppWindowHandle(ptor, function(handles) {
      var i;
      for (i = 0; i < handles.length; i += 1) {
        ptor.driver.switchTo().window(handles[i]);
        ptor.driver.getTitle().then(function(title) {
          if (title.indexOf(pageTitle) != -1) {
            onPageHandle(handles[i]);
          }
        });
      }
    }, onError);
  };

  exports.appSelector = {
    getAppWindowHandle: m_getAppWindowHandle,
    findPageAndDo: m_findPageAndDo
  }
})();


