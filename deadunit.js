"use strict";
/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

var fs = require('fs')
var path = require('path')

require('colors')
var stackTrace = require('stack-trace')

var defaultFormats = require('./defaultFormats')
var formatBasic = exports.formatBasic = require('./basicFormatter')


/*  todo:
    * a way to specify how many asserts a test should expect to get
    * default html reporter
    * report the amount of time a test took
    * do something about the dependence on node.js domains
    * allow individual tests be cherry picked (for rerunning tests or testing specific things in development)
    * some kind of helper handling for asynchronous crap - QUnit has a function that's called once asynchronous functions are done
        * you'd either have to know beforehand the number of 'start's you're
        * Mocha allows you to pass a callback to a test group, in which case it will wait for the "done" call
            * this might need to be extended a bit if you have multiple callbacks that must happen before its really "done"
            * Tho maybe a test case can be aware of all the callbacks that have been setup and wait for a done on each of them
    * Note that a test group can have setup right in the test group construction
        * add something to allow teardown after a test group is completed
        * better yet, check out jasmine's beforeEach and afterEach
    * stream semantics for faster running tests (maybe?)
 */


// default
var unhandledErrorHandler = function(e) {
    setTimeout(function() { //  nextTick
        console.log(e.toString().red)
    },0)
}

// setup unhandled error handler
// unhandled errors happen when done is called, and  then an exception is thrown from the future
exports.error = function(handler) {
    unhandledErrorHandler = handler
}


exports.test = function(/*mainName=undefined, groups*/) {
    // unnamed test
    if(arguments.length === 1) {
        var mainTest = arguments[0]

    // named test
    } else {
        var mainName = arguments[0]
        var mainTest = arguments[1]
    }

	var testResults = testGroup(new UnitTester(mainName), mainTest)
	return new UnitTest(testResults)
}

function testGroup(tester, test) {
    var d = domain()
    d.on('error', function(err) {
        tester.exceptions.push(e)
        if(tester.mainTester.resultsAccessed) {
            unhandledErrorHandler(Error("Test results were accessed before asynchronous parts of tests were fully complete."
                                         +" Got error: "+ e.message+" "+ e.stack))
        }
    })

    d.run(function() {
        try {
            test.call(tester, tester) // tester is both 'this' and the first parameter (for flexibility)
        } catch(e) {
            tester.exceptions.push(e)
        }
    })

	return {
		type: 'group',

		name: tester.name,
		results: tester.results,
		exceptions: tester.exceptions,
        tester: tester
	}
}


var UnitTester = function(name, mainTester) {
	if(!mainTester) mainTester = this

	this.mainTester = mainTester // the mainTester is used to easily figure out if the test results have been accessed (so early accesses can be detected)
	this.name = name
    this.results = []
    this.exceptions = []
}

    UnitTester.prototype = {
    	test: function(name, test) {
			var tester = new UnitTester(name, this.mainTester)
			this.results.push(testGroup(tester, test))
		},

        ok: function(success, actualValue, expectedValue, functionName, stackIncrease/*=0*/) {
            if(!stackIncrease) stackIncrease = 0
            if(!functionName) functionName = "ok"

            var backTrace = stackTrace.get();
            var stackPosition = backTrace[1+stackIncrease]

            var filename = stackPosition.getFileName()
            var lineNumber = stackPosition.getLineNumber()
            var column = stackPosition.getColumnNumber()

            var sourceLines = getFunctionCallLines(filename, functionName, lineNumber)

            var result = {
            	type: 'assert',
                success:success,

                sourceLines: sourceLines,
                file: path.basename(filename),
                line: lineNumber,
                column: column
            }

            if(actualValue)     result.actual = actualValue
            if(expectedValue)   result.expected = expectedValue

            this.results.push(result)

            if(this.mainTester.resultsAccessed) {
                 unhandledErrorHandler(Error("Test results were accessed before asynchronous parts of tests were fully complete."+
                                 " Got assert result: "+ JSON.stringify(result)))
            }
        },
        equal: function(expectedValue, testValue) {
            this.ok(expectedValue === testValue, expectedValue, testValue, "equal", 1)
        },

        log: function(msg) {
            this.results.push({
                type: 'log',
                msg: msg
            })
        }
    }

var UnitTest = function(test) {
    this.results = function() {
        // resultsAccessed allows the unit test to do special alerting if asynchronous tests aren't completed before the test is completed
		test.tester.resultsAccessed = true
        return test
    }
}
    UnitTest.prototype.string = // alias
    UnitTest.prototype.toString = function() {
        return defaultFormats.text(this, false)
    }

    UnitTest.prototype.writeConsole = function() {
        console.log(defaultFormats.text(this, true))
    }



    UnitTest.prototype.html = defaultFormats.html



// gets the actual lines of the call
// todo: make this work when call is over multiple lines (you would need to count parens and check for quotations)
function getFunctionCallLines(fileName, functionName, lineNumber) {
    var file = fs.readFileSync(fileName).toString().split("\n")

    var lines = []
    for(var n=0; true; n++) {
    	lines.push(file[lineNumber - 1 - n].trim())
        var containsFunction = file[lineNumber - 1 - n].indexOf(functionName) !== -1
        if(containsFunction) {
        	return lines.reverse()
        }
        if(lineNumber - n < 0) {
        	throw Error("Didn't get any lines")//return ""	// something went wrong if this is being returned (the functionName wasn't found above - means you didn't get the function name right)
        }
    }
}

