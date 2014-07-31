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
    expect(m_appWindowHandles).toBeDefined();
  }

  function onError(errorMessage) {
    console.log("No application window handle found: " + errorMessage);
    expect(true).toBe(false);
  }

  function selectOption(selector, item){
    var selectList, desiredOption;

    selectList = this.findElement(selector);
    selectList.click();
    selectList.findElements(protractor.By.tagName('option'))
      .then(function findMatchingOption(options){
        options.some(function(option){
          option.getText().then(function doesOptionMatch(text){
            if (item === text){
              desiredOption = option;
              return true;
            }
          });
        });
      })
      .then(function clickOption(){
        if (desiredOption){
          desiredOption.click();
        }
      });
  }

  function submitIssue(ptor, appWindowHandles, issueCategory, issueDetail) {
    ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);
    ptor.findElement(protractor.By.css('#feedbackButton')).click();
    ptor.controlFlow().await(
      common.appSelector.findPageAndDo(m_ptor, "Feedback", function(handle) {
        var inputCategory = ptor.findElement(protractor.By.css('#issueCategory'));
        var inputField = ptor.findElement(protractor.By.css('#issueDetail'));

        ptor.selectOption(protractor.By.id('issueCategory'), issueCategory);
        inputField.sendKeys(issueDetail);
        ptor.findElement(protractor.By.css('#issueSubmit')).click();
      }, onError)
    );
  }

  /*
   * Test the feedback submission workflow.
   */
  describe('Feedback workflow test', function() {
    beforeEach(function () {
      m_ptor = protractor.getInstance();
      m_ptor.selectOption = selectOption.bind(m_ptor);

      // First we set the global app window handle
      common.appSelector.getAppWindowHandle(m_ptor, setGlobalWindowHandle, onError);
    });

    /*
     * Check that the session ID is still what we expect.
     */
    it('should have the session ID set in the about page.', function () {
      var sessionIDInputField;

      // Open the about page.
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
                sessionIDInputField.sendKeys(protractor.Key.ENTER);
              });
            });
          }, onError);
        });
    }, 10000);

    /*
     * Check that we can cancel without interruption if no input in feedback field.
     */
    it('should be able to cancel blank feedback page.', function () {
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);

      // Click the button
      m_ptor.findElement(protractor.By.css('#feedbackButton')).click();

      // Find the feedback window and cancel the feedback.
      m_ptor.controlFlow().await(
        common.appSelector.findPageAndDo(m_ptor, "Feedback", function(handle) {
          m_ptor.findElement(protractor.By.css('#cancel')).click();

          // We can't put 'expect'(s) into the queue since they'll just wait there
          // trying to check for things on this closed page.  We have to check for
          // the number of open windows.
          // expect(m_ptor.findElement(protractor.By.css('#cancelAck')).
          //        isDisplayed()).toBe(false);
          // expect(m_ptor.findElement(protractor.By.css('#cancelReject')).
          //        isDisplayed()).toBe(false);
        }, onError)
      );

      common.appSelector.getAppWindowHandle(m_ptor, function(handles) {
        expect(handles.length).toBe(2);
      }, onError);
    }, 10000);

    /*
     * Check the cancel workflow when input is present.
     */
    it('should be warned when cancelling partial feedback page.', function () {
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);

      // Click the button
      m_ptor.findElement(protractor.By.css('#feedbackButton')).click();

      // Find the feedback window and cancel the feedback.
      common.appSelector.findPageAndDo(m_ptor, "Feedback", function(handle) {
        var inputField = m_ptor.findElement(protractor.By.css('#issueDetail'));
        inputField.sendKeys("This interface, so amaze!");
        m_ptor.findElement(protractor.By.css('#cancel')).click();
        expect(m_ptor.findElement(protractor.By.css('#cancelAck')).
               isDisplayed()).toBe(true);
        expect(m_ptor.findElement(protractor.By.css('#cancelReject')).
               isDisplayed()).toBe(true);
        m_ptor.findElement(protractor.By.css('#cancelAck')).click();
      }, onError);
    }, 10000);

    /*
     * Check that the taskbar initially doesn't have the issues badge.
     */
    it('should not show any number/badge in taskbar.', function () {
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);
      expect(m_ptor.findElement(protractor.By.css('.badge')).
             isDisplayed()).toBe(false);
    }, 5000);

    /*
     * Check that the issues we submitted are there upon review.
     */
    it('should show the number of issues in taskbar.', function () {
      // Submit some feedback
      submitIssue(m_ptor, m_appWindowHandles, "UI Bug", "Could not find toaster button.");

      // now we check that the badge is displayed and shows one.
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);
      expect(m_ptor.findElement(protractor.By.css('.badge')).
             isDisplayed()).toBe(true);
      expect(element(by.css('.badgeDetail')).getText()).toEqual('1');

      submitIssue(m_ptor, "That's awesome", "Colors are so pretty.");
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);
      expect(element(by.css('.badgeDetail')).getText()).toEqual('2');
    }, 10000);

    /*
     * Check that the issues we submitted are there upon review.
     */
    it('should have the same number of issues reviewed as submitted.', function () {
      // Submit some feedback
      submitIssue(m_ptor, m_appWindowHandles, "That's awesome", "This interface, so amaze!");
      // XXX: There is a bug in protractor that opens up the developer window alongside
      // the feedback window that is preventing input getting sent to my window, which
      // hangs the test.  This is preventing additional issues from getting submitted.
      submitIssue(m_ptor, m_appWindowHandles, "UI Bug", "Where to click to fire DeathStar?");
      submitIssue(m_ptor, m_appWindowHandles,
                  "Tech Bug",
                  "My TIE Advanced x1 started spinning out of control, making me dizzy.");

      // Now check to see if the issue is in the set of review items
      m_ptor.driver.switchTo().window(m_appWindowHandles[TASKBAR]);
      m_ptor.findElement(protractor.By.css('#endButtonBag')).click();
      common.appSelector.findPageAndDo(m_ptor, "Feedback Review", function(handle) {
        expect(element.all(by.repeater('issue in issues')).count()).not.toEqual(10);
        expect(element.all(by.repeater('issue in issues')).count()).toEqual(5);
      }, onError);
    }, 10000);
  });
});
