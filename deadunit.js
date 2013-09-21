"use strict";
/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

var fs = require('fs')
var path = require('path')
var domain = require('domain').create

var stackTrace = require('stack-trace')

var defaultFormats = require('./defaultFormats')
var formatBasic = exports.formatBasic = require('./basicFormatter')


/*  todo:
	* on process exit, instead of (or in addition to) writing to the console, throw all the exceptions that were caught by the test
    * write documentation (include a note/recommendation on how to handle asynchronous tests - use asyncFuture)
    * default html reporter
    * split deadunit into a core project and a full project (basically separate the data output from the visual output)
    * Allow actual and expected to be set as undefined (without causing them to not show up)
    * do something about the dependence on node.js domains
    * allow individual tests be cherry picked (for rerunning tests or testing specific things in development)
    * stream semantics for faster running tests (maybe?)
 */


// default
var unhandledErrorHandler = function(e) {
    setTimeout(function() { //  nextTick
        console.log(e.toString())
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

    var testStart = new Date()
	var testResults = testGroup(new UnitTester(mainName), mainTest)
    testResults.testDuration = testResults.totalDuration = (new Date()).getTime() - testStart.getTime()

	var test = new UnitTest(testResults)
	
	process.on('exit', function() {
		if(!testResults.tester.resultsAccessed) {
			test.writeConsole()
			throw Error("Deadunit test results never accessed - something is amiss...")
		}		
	})
	
	return test
}

function testGroup(tester, test) {
    var d = domain()
    d.on('error', function(err) {
        tester.exceptions.push(err)
        if(tester.mainTester.resultsAccessed) {
            unhandledErrorHandler(Error("Test results were accessed before asynchronous parts of tests were fully complete."
                                         +" Got error: "+ err.message+" "+ err.stack))
        }
    })

    d.run(function() {
        try {
            test.call(tester, tester) // tester is both 'this' and the first parameter (for flexibility)
        } catch(e) {
            tester.exceptions.push(e)
        }

        if(tester.countInfo !== undefined) {
            var info = tester.countInfo
            assert(tester, tester.numberOfAsserts === info.expectedAsserts, tester.numberOfAsserts, info.expectedAsserts, 'count', info.lineInfo)
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

// the prototype of objects used to write tests and contain the results of tests
var UnitTester = function(name, mainTester) {
	if(!mainTester) mainTester = this

	this.mainTester = mainTester // the mainTester is used to easily figure out if the test results have been accessed (so early accesses can be detected)
	this.name = name
    this.results = []
    this.exceptions = []
    this.numberOfAsserts = 0
}

    UnitTester.prototype = {
    	test: function(name, test) {
            var beforeStart = new Date()

            if(this.beforeFn)
                this.beforeFn.call(this, this)

            var testStart = new Date()
			var tester = new UnitTester(name, this.mainTester)
            var result = testGroup(tester, test)
            result.testDuration = (new Date()).getTime() - testStart.getTime()

            this.numberOfAsserts += tester.numberOfAsserts

            if(this.afterFn)
                this.afterFn.call(this, this)

            result.totalDuration = (new Date()).getTime() - beforeStart.getTime()

            this.results.push(result)
		},

        ok: function(success, actualValue, expectedValue) {
            assert(this, success, actualValue, expectedValue, "ok")
            this.numberOfAsserts += 1
        },
        equal: function(expectedValue, testValue) {
            assert(this, expectedValue === testValue, expectedValue, testValue, "equal")
            this.numberOfAsserts += 1
        },
        count: function(number) {
            if(this.expectedAsserts !== undefined)
                throw Error("count called multiple times for this test")
            this.countInfo = {
                expectedAsserts: number,
                lineInfo: getLineInformation('count', 0)
            }
        },

        before: function(fn) {
            if(this.beforeFn !== undefined)
                throw Error("before called multiple times for this test")

            this.beforeFn = fn
        },
        after: function(fn) {
            if(this.afterFn !== undefined)
                throw Error("after called multiple times for this test")

            this.afterFn = fn
        },

        log: function(msg) {
            this.results.push({
                type: 'log',
                msg: msg
            })
        }
    }

function assert(that, success, actualValue, expectedValue, functionName/*="ok"*/, lineInfo/*=dynamic*/, stackIncrease/*=0*/) {
    if(!stackIncrease) stackIncrease = 1
    if(!functionName) functionName = "ok"
    if(!lineInfo) lineInfo = getLineInformation(functionName, stackIncrease)

    var result = lineInfo
    result.type = 'assert'
    result.success = success

    if(actualValue !== undefined)     result.actual = actualValue
    if(expectedValue !== undefined)   result.expected = expectedValue

    that.results.push(result)

    if(that.mainTester.resultsAccessed) {
         unhandledErrorHandler(Error("Test results were accessed before asynchronous parts of tests were fully complete."+
                         " Got assert result: "+ JSON.stringify(result)))
    }
}

// the prototype of objects used to manage accessing and displaying results of a unit test
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



function getLineInformation(functionName, stackIncrease) {
    var backTrace = stackTrace.get();
    var stackPosition = backTrace[2+stackIncrease]

    var filename = stackPosition.getFileName()
    var lineNumber = stackPosition.getLineNumber()
    var column = stackPosition.getColumnNumber()

    var sourceLines = getFunctionCallLines(filename, functionName, lineNumber)

    return {
        sourceLines: sourceLines,
        file: path.basename(filename),
        line: lineNumber,
        column: column
    }
}

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

