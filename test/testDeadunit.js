"use strict";

var Unit = require('../deadunit')
var indent = require("../indent")
var Future = require('async-future')

var futuresToWaitOn = []

var testGroups = Unit.test("Testing the Unit Tester", function() {

	this.test("Test Some Stuff", function() {
		this.test("assertSomething", function() {
			this.ok(5 === 5)
		})
		this.test("shouldFail", function() {
			this.ok(5 === 3, 'actual', 'expected')
			this.equal(true, false)
            this.log("test log")
            this.count(3)
		})
		this.test("shouldThrowException", function() {
            this.ok(true)
            this.count(1)
			throw new Error("Ahhhhh!")
		})
		this.test("should throw an asynchronous exception", function() {
            var f = new Future
            futuresToWaitOn.push(f)
            setTimeout(function() {
                f.return()
                throw Error("Asynchronous Ahhhhh!")
            },0)
		})

        this.count(4)
	})
	this.test("SuccessfulTestGroup", function() {
		this.test("yay", function() {
			this.equal(true, true)
		})
	})

    this.test("long before/after", function() {
        var x = 0
        this.before(function() {
            for(var n=0; n<1000000; n++) {
                x += x+1
            }
        })

        this.test("one", function() {
            this.ok(x === Infinity, x)
        })
    })
})

function stringTestResults(test) {
	if(test.type == 'group') {
		var results = '[ '+test.results.map(function(x) {
            return indent("  ",stringTestResults(x))
        }).join(",\n").trim()+"\n"
        +"]"

        var exceptionMessages = "["+test.exceptions.join(",")+"]"

		return  "{ type: "+test.type+",\n"
		       +"  name: "+test.name+",\n"
		       +"  results: \n"+indent("  ",results)+",\n"
			   +"  exceptions: "+exceptionMessages+",\n"
			   +"}"
	} else {
		return  "{ type: "+test.type+",\n"
			   +"  success: "+test.success+",\n"
			   +"  sourceLines: "+test.sourceLines+",\n"
			   +"  test: "+test.test+",\n"
			   +"  file: "+test.file+",\n"
			   +"  line: "+test.line+",\n"
			   +"  column: "+test.column+",\n"
			   +"}"
	}
}

Future.all(futuresToWaitOn).then(function() {

    var simpleSuccess = Unit.test(function() {
        this.ok(true)
    })
    var simpleFailure = Unit.test(function() {
        this.ok(false)
    })
    var simpleException = Unit.test(function() {
        throw Error("sync")
    })
    var simpleExceptionNoTrace = Unit.test(function() {
        throw "I think I'm an exception"
    })

    var simpleAsyncExceptionFuture = new Future()
    var simpleAsyncException = Unit.test(function() {
        setTimeout(function() {
            simpleAsyncExceptionFuture.return()
            throw Error("Async")
        }, 0)
    })

    console.log("simple success")
    simpleSuccess.writeConsole()

    console.log("\nsimple failure")
    simpleFailure.writeConsole()

    console.log("\nsimple exception")
    simpleException.writeConsole()

    console.log("\nsimple exception without stack trace")
    simpleExceptionNoTrace.writeConsole()

    console.log(testGroups.toString())	// returns plain text
    testGroups.writeConsole() 		// writes color console output

    //console.log(testGroups.html())		// returns html
    //testGroups.write.html()			// appends html to the current (html) page the tests are running in




    simpleAsyncExceptionFuture.then(function() {
        console.log("\nsimple async exception")
        simpleAsyncException.writeConsole()


		var realTest = Unit.test("Testing basicFormatter (this should succeed)", function() {
            var formatBasic = require("../basicFormatter")

            this.test("simple exception", function(t) {
                this.count(10)
                formatBasic(simpleException, {
                    group: function(name, duration, totalDuration, testSuccesses, testFailures,
                                          assertSuccesses, assertFailures, exceptions,
                                          testResults, exceptionResults, nestingLevel) {

                        t.ok(name === undefined)
                        t.ok(testSuccesses === 0)
                        t.ok(testFailures === 0)
                        t.ok(assertSuccesses === 0)
                        t.ok(assertFailures === 0)
                        t.ok(exceptions === 1)
                        t.ok(testResults.length === 0)
                        t.ok(exceptionResults.length === 1)
                        t.ok(nestingLevel === 0)
                    },
                    assert: function(result, test) {
                        t.ok(false)
                    },
                    exception: function(e) {
                        t.ok(e.message === 'sync')
                    },
                    log: function(msg) {
                        t.ok(false)
                    }
                })
            })

            this.test("test groups", function(t) {
                this.count(4)
                formatBasic(testGroups, {
                    group: function(name, duration, totalDuration, testSuccesses, testFailures,
                                          assertSuccesses, assertFailures, exceptions,
                                          testResults, exceptionResults, nestingLevel) {

                        if(name === "Testing the Unit Tester") {
                            t.test("Testing the Unit Tester", function(t) {
                                this.count(9)
                                t.ok(testSuccesses === 2, testSuccesses)
                                t.ok(testFailures === 1, testFailures)
                                t.ok(testResults.length === 3, testResults.length)
                                t.ok(exceptionResults.length === 0, exceptionResults.length)

                                t.ok(assertSuccesses === 6)
                                t.ok(assertFailures === 3)
                                t.ok(exceptions === 2)

                                t.ok(duration !== undefined)
                                t.ok(totalDuration !== undefined)
                            })

                        } else if(name === "Test Some Stuff") {
                            t.test("Test Some Stuff", function(t) {
                                this.count(4)
                                t.ok(testSuccesses === 2, testSuccesses)
                                t.ok(testFailures === 3, testFailures)
                                t.ok(testResults.length === 5, testResults.length)
                                t.ok(exceptionResults.length === 0, exceptionResults.length)
                            })

                        } else if(name === "assertSomething") {
                            t.test("assertSomething", function(t) {
                                this.count(4)
                                t.ok(testSuccesses === 1, testSuccesses)
                                t.ok(testFailures === 0, testFailures)
                                t.ok(testResults.length === 1, testResults.length)
                                t.ok(exceptionResults.length === 0, exceptionResults.length)
                            })

                        } else if(name === "shouldFail") {
                            t.test("shouldFail", function(t) {
                                this.count(4)
                                t.ok(testSuccesses === 0, testSuccesses)
                                t.ok(testFailures === 3, testFailures)
                                t.ok(testResults.length === 4, testResults.length)
                                t.ok(exceptionResults.length === 0, exceptionResults.length)
                            })

                        } else if(name === "shouldThrowException") {

                        } else if(name === "should throw an asynchronous exception") {

                        } else if(name === "SuccessfulTestGroup") {

                        } else if(name === "long before/after") {

                        } else if(name === "one") {

                        } else if(name === "yay") {

                        } else {
                            t.ok(false, name)
                        }
                    },
                    assert: function(result, test) {
                        //t.ok(false)
                    },
                    exception: function(e) {
                        //t.ok(e.message === 'sync')
                    },
                    log: function(msg) {
                        //t.ok(false)
                    }
                })
            })
        })

        console.log("")
        realTest.writeConsole()

    }).done()
}).done()




