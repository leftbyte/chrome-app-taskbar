module.exports = function (grunt) {
   grunt.initConfig({
      protractor: {
         options: {
            configFile: "tests/protractor-conf.js", // Default config file
            keepAlive: false, // If false, the grunt process stops when the test fails.
            noColor: false // If true, protractor will not use colors in its output.
         },
         chrome: {
            options: {
               args: {
                  browser: "chrome"
               }
            }
         }
      },

      protractor_webdriver: {
         local: {
            options: {
               keepAlive: true,
               // XXX: need to include node for windows
               command: 'node node_modules/protractor/bin/webdriver-manager start'
            }
         }
      }
   });

   grunt.loadNpmTasks('grunt-bower-task');
   grunt.loadNpmTasks('grunt-protractor-runner');
   grunt.loadNpmTasks('grunt-protractor-webdriver');

   grunt.registerTask("test", ["protractor_webdriver", "protractor:chrome"]);
   grunt.registerTask("default", ["test"]);
};
