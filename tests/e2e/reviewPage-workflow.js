describe('Taskbar App', function() {

  // The following is needed to work around this error:
  //   Error: Error while waiting for Protractor to sync with the page: {}
  browser.ignoreSynchronization = true;

  // XXX m_appWindowHandles is used for most of the tests but it assumes that
  // protractor can get the window handles back in time for the other tests.  It
  // seems to be working, but if we start getting errors where we can't switch
  // to a certain window handle, then start doing the work in the onHandle
  // callback.

  var common = require('./common'),
      m_ptor,
      m_appWindowHandles,
      TASKBAR           = 1,
      ABOUT_PAGE        = 2;

  function setGlobalWindowHandle(handles) {
    m_appWindowHandles = handles;
  }

  function onError(errorMessage) {
    console.log("No application window handle found: " + errorMessage);
    expect(true).toBe(false);
  }

  /*
   * Test the reviewIssues submission workflow.
   */
  describe('review issues workflow test', function() {
    beforeEach(function () {
      m_ptor = protractor.getInstance();

      // First we set the global app window handlea
      common.appSelector.getAppWindowHandle(m_ptor, setGlobalWindowHandle, onError);
    });

    /*
     * Make sure the warning comes up in the workflow.
     */
    it('should warn us if we want to cancel review submission.', function () {
      // open up the review page
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);
      m_ptor.findElement(protractor.By.css('#endButton')).click()
        .then(function() {
          // Find the window handle again and check the ID:
          common.appSelector.findPageAndDo(m_ptor, "Feedback Review", function(handle) {
            expect(m_ptor.findElement(protractor.By.css('#cancelAck')).
                   isDisplayed()).toBe(false);
            expect(m_ptor.findElement(protractor.By.css('#cancelReject')).
                   isDisplayed()).toBe(false);

            m_ptor.findElement(protractor.By.css('#cancel')).click();

            expect(m_ptor.findElement(protractor.By.css('#cancelAck')).
                   isDisplayed()).toBe(true);
            expect(m_ptor.findElement(protractor.By.css('#cancelReject')).
                   isDisplayed()).toBe(true);

            // Cancel it!
            m_ptor.findElement(protractor.By.css('#cancelAck')).click();
          }, onError);
        });
    }, 10000);
  });
});
