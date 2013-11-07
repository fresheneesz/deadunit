"use strict";

var fs = require("fs")

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

    this.test("logs", function() {

        var array = [1,'a',{a:'b', b:[1,2]}]
        var object = {some: 'object'}
        var error = Error('test')

        this.log("string")
        this.log(object)
        this.log(array)
        this.log(error)
        this.log('')
        this.log("string", object, array, error)

        this.ok(false, "string")
        this.ok(false, object)
        this.ok(false, array)
        this.ok(false, error)

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


    simpleAsyncExceptionFuture.then(function() {

        console.log("simple success")
        simpleSuccess.writeConsole()
        fs.writeFileSync("simpleSuccess.html", simpleSuccess.html())

        console.log("\nsimple failure")
        simpleFailure.writeConsole()
        fs.writeFileSync("simpleFailure.html", simpleFailure.html())

        console.log("\nsimple exception")
        simpleException.writeConsole()
        fs.writeFileSync("simpleException.html", simpleException.html())

        console.log("\nsimple exception without stack trace")
        simpleExceptionNoTrace.writeConsole()
        fs.writeFileSync("simpleExceptionNoTrace.html", simpleExceptionNoTrace.html())


        console.log("\nsimple async exception")
        simpleAsyncException.writeConsole()
        fs.writeFileSync("simpleAsyncException.html", simpleAsyncException.html())


        console.log(testGroups.toString())	// returns plain text
        testGroups.writeConsole() 		// writes color console output
        fs.writeFileSync("testGroups.html", testGroups.html())

        //testGroups.write.html()			// appends html to the current (html) page the tests are running in


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
                                t.ok(testFailures === 2, testFailures)
                                t.ok(testResults.length === 4, testResults.length)
                                t.ok(exceptionResults.length === 0, exceptionResults.length)

                                t.ok(assertSuccesses === 6)
                                t.ok(assertFailures === 7, assertFailures)
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

                        } else if(name === "logs") {

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

    }).catch(function(e) {
        console.log(e.stack)
    }).done()
}).catch(function(e) {
    console.log(e.stack)
}).done()
