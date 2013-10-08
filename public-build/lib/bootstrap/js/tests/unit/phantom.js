/*
 * grunt-contrib-qunit
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

(function(){function e(){var e=[].slice.call(arguments);alert(JSON.stringify(e))}QUnit.config.reorder=!1,QUnit.config.autorun=!1,QUnit.log=function(t){if(t.message==="[object Object], undefined:undefined")return;var n=QUnit.jsDump.parse(t.actual),r=QUnit.jsDump.parse(t.expected);e("qunit.log",t.result,n,r,t.message,t.source)},QUnit.testStart=function(t){e("qunit.testStart",t.name)},QUnit.testDone=function(t){e("qunit.testDone",t.name,t.failed,t.passed,t.total)},QUnit.moduleStart=function(t){e("qunit.moduleStart",t.name)},QUnit.begin=function(){e("qunit.begin"),console.log("Starting test suite"),console.log("================================================\n")},QUnit.moduleDone=function(t){t.failed===0?console.log("\r✔ All tests passed in '"+t.name+"' module"):console.log("✖ "+t.failed+" tests failed in '"+t.name+"' module"),e("qunit.moduleDone",t.name,t.failed,t.passed,t.total)},QUnit.done=function(t){console.log("\n================================================"),console.log("Tests completed in "+t.runtime+" milliseconds"),console.log(t.passed+" tests of "+t.total+" passed, "+t.failed+" failed."),e("qunit.done",t.failed,t.passed,t.total,t.runtime)}})();