var path = require('path');

exports.config = {
  allScriptsTimeout: 11000,

  // The address of a running selenium server.
  seleniumAddress: 'http://127.0.0.1:4444/wd/hub',

  capabilities: {
    'browserName': 'chrome',
    'chromeOptions':{
      'args': [
        '--load-and-launch-app=' + path.resolve('app'),
        '--test-type=ui'
      ]
    }
  },

  specs: [
    'e2e/about-workflow.js',
    'e2e/feedback-workflow.js',
    'e2e/reviewPage-workflow.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  chromeOnly: true,
  framework: 'jasmine',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000,
    showColors: true
  }
};
