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
   * Test out all the about page workflows..
   */
  describe('About page workflow test', function() {
    beforeEach(function () {
      m_ptor = protractor.getInstance();

      // First we set the global app window handlea
      common.appSelector.getAppWindowHandle(m_ptor, setGlobalWindowHandle, onError);
    });

    /*
     * Do what he says.
     */
    it('puts the lotion in the basket...', function(){
      var lotion = "lubriderm";
      var basket = [lotion];
      expect(basket).toContain(lotion);
    }, 20000);

    /*
     * Set the session ID.
     */
    it('should set the session ID in the about page.', function () {
      var sessionIDInputField;

      // global window handles are defined before each test.
      expect(m_appWindowHandles).toBeDefined();

      m_ptor.driver.switchTo().window(m_appWindowHandles[ABOUT_PAGE]);

      sessionIDInputField = m_ptor.findElement(protractor.By.css('#sessionID'));

      // First we make sure that the ID starts out blank
      sessionIDInputField.then(function (element) {
        element.getAttribute('value').then(function(text) {
          expect(text.length).toBe(0);
        });
      });

      // Input an example ID.
      sessionIDInputField.sendKeys("dvadar@leftbyte.com").then(function() {
        sessionIDInputField.then(function (element) {
          element.getAttribute('value').then(function(text) {
            expect(text.length).toBe(19);

            // this should close the about page and send the input
            sessionIDInputField.sendKeys(protractor.Key.ENTER);

            // Example of clicking the button instead of
            // m_ptor.findElement(protractor.By.css('#idSubmit')).then(
            //   function(element) {
            //     console.log("trying to click #idSubmit");
            //     element.click();
            //   });
          });
        });
      });
    }, 10000);

    /*
     * Check that the session ID is still what we expect.
     */
    it('should have the session ID set in the about page.', function () {
      var sessionIDInputField;

      // Now let's reopen the about page.
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);

      // Click the button
      m_ptor.findElement(protractor.By.css('#aboutButton')).click()
        .then(function() {

          // Find the window handle again and check the ID:
          common.appSelector.findPageAndDo(m_ptor, "About", function(handle) {
            sessionIDInputField = m_ptor.findElement(protractor.By.css('#sessionID'));
            sessionIDInputField.then(function (element) {
              element.getAttribute('value').then(function(text) {
                expect(text).toBe("dvadar@leftbyte.com");
              });
            });
          }, onError);
        });
    }, 10000);

    /*
     * Check the change ID workflow.
     */
    it('should prompt the user if the ID changes.', function () {
      var sessionIDInputField;

      // Find the window handle again and check the ID:
      common.appSelector.findPageAndDo(m_ptor, "About", function(handle) {
        // This button should be hidden.
        expect(m_ptor.findElement(protractor.By.css('#changeSessionIDReject')).
               isDisplayed()).toBe(false);

        sessionIDInputField = m_ptor.findElement(protractor.By.css('#sessionID'));
        sessionIDInputField.sendKeys("y").then(function() {
          sessionIDInputField.sendKeys(protractor.Key.ENTER);

          // This button should be displayed in this workflow..
          expect(m_ptor.findElement(protractor.By.css('#changeSessionIDReject')).
                 isDisplayed()).toBe(true);

          m_ptor.findElement(protractor.By.css('#changeSessionIDReject')).
            sendKeys(protractor.Key.ENTER);

          // Cool, now delete that and move on.
          sessionIDInputField.sendKeys(protractor.Key.BACK_SPACE);
          sessionIDInputField.sendKeys(protractor.Key.ENTER);
        });
      }, onError);
    }, 10000);
  });
});
