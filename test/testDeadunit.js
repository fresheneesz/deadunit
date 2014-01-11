"use strict";

var fs = require("fs")

var Unit = require('../deadunit')
var indent = require("../indent")
var Future = require('async-future')
var proto = require('proto')


var CustomError = proto(Error, function(superclass) {
    this.name = 'CustomError'

    this.init = function(msg, properties) {
        superclass.call(this, msg)
        for(var n in properties) {
            this[n] = properties[n]
        }
    }
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

var simpleSuccess, simpleFailure, simpleException, simpleExceptionNoTrace, simpleAsyncException, simpleTimeout, testGroups
var folder = __dirname+'/generated/'

console.log("simple success\n")
simpleSuccess = Unit.test(function() {
    this.ok(true)
})

simpleSuccess.writeConsole(0).then(function() {
    return simpleSuccess.html()
}).then(function(simpleSuccessHtml) {
    fs.writeFileSync(folder+"simpleSuccess.html", simpleSuccessHtml)

    console.log("\nsimple failure\n")
    simpleFailure = Unit.test(function() {
        this.ok(false)
    })
    return simpleFailure.writeConsole(0)
}).then(function() {
    return simpleFailure.html()
}).then(function(simpleFailureHtml) {
    fs.writeFileSync(folder+"simpleFailure.html", simpleFailureHtml)

    console.log("\nsimple exception\n")
    simpleException = Unit.test(function() {
        throw Error("sync")
    })
    return simpleException.writeConsole(0)
}).then(function() {
    return simpleException.html()
}).then(function(simpleExceptionHtml) {
    fs.writeFileSync(folder+"simpleException.html", simpleExceptionHtml)

    console.log("\nsimple exception without stack trace\n")
    simpleExceptionNoTrace = Unit.test(function() {
        throw "I think I'm an exception"
    })
    return simpleExceptionNoTrace.writeConsole(0)
}).then(function() {
    return simpleExceptionNoTrace.html()
}).then(function(simpleExceptionNoTraceHtml) {
    fs.writeFileSync(folder+"simpleExceptionNoTrace.html", simpleExceptionNoTraceHtml)

    console.log("\nsimple async exception\n")
    var simpleAsyncExceptionFuture = new Future()
    simpleAsyncException = Unit.test(function(t) {
        this.count(1)
        setTimeout(function() {
            t.ok(true) // so it doesn't time out
            simpleAsyncExceptionFuture.return()
            throw Error("Async")
        }, 0)
    })

    return simpleAsyncExceptionFuture
}).then(function() {
    return simpleAsyncException.writeConsole(0)
}).then(function() {
    return simpleAsyncException.html()
}).then(function(simpleAsyncExceptionHtml) {
    fs.writeFileSync(folder+"simpleAsyncException.html", simpleAsyncExceptionHtml)

    console.log("\nsimple timeout / failed count\n")
    simpleTimeout = Unit.test(function() {
        this.timeout(100)
        this.count(1)
    })
    return simpleTimeout.writeConsole()
}).then(function() {
    return simpleTimeout.html()
}).then(function(simpleTimeoutHtml) {
    fs.writeFileSync(folder+"simpleTimeout.html", simpleTimeoutHtml)

    console.log("\ntoString")

    var futuresToWaitOn = []
    testGroups = Unit.test("Testing the Unit Tester", function() {

        this.test("Test Some Stuff", function() {
            this.test("assertSomething", function() {
                this.ok(5 === 5)
            })
            this.test("shouldFail", function() {
                this.ok(5 === 3, 'actual', 'expected')
                this.equal(true, false)
                this.log("test log")
                this.count(2)
            })
            this.test("shouldThrowException", function() {
                this.ok(true)
                this.count(1)
                throw new Error("Ahhhhh!")
            })
            this.test("should throw an asynchronous exception", function(t) {
                this.count(1)
                var f = new Future
                futuresToWaitOn.push(f)
                setTimeout(function() {
                    f.return()
                    t.ok(true)
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
            var customError = CustomError('testCustom', {a:1, b:'two', c:[1,2,3], d:{four:4}})

            this.log("string")
            this.log(object)
            this.log(array)
            this.log(error)
            this.log(customError)
            this.log('')
            this.log("string", object, array, error, customError)

            this.ok(false, "string")
            this.ok(false, object)
            this.ok(false, array)
            this.ok(false, error)
            this.ok(false, customError)

        })
    })


    return Future.all(futuresToWaitOn)

}).then(function() {
    return testGroups.string()
}).then(function(string) {
    console.log(string)	// returns plain text
    return testGroups.writeConsole() 		// writes color console output

}).then(function() {
    return testGroups.html()
}).then(function(testGroupsHtml) {
    fs.writeFileSync(folder+"testGroups.html", testGroupsHtml)

    //testGroups.write.html()			// appends html to the current (html) page the tests are running in


    var realTest = Unit.test("Testing basicFormatter (this should succeed)", function() {
        var formatBasic = require("../basicFormatter")

        this.test("simple exception", function(t) {
            var simpleException2 = Unit.test(function() {
                throw Error("sync")
            })

            this.count(10)
            formatBasic(simpleException2, false, 0, {
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

        this.test("formatBasic", function(t) {
            this.count(4)
            formatBasic(testGroups, false, 0, {
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

                            t.ok(assertSuccesses === 9, assertSuccesses)
                            t.ok(assertFailures === 7, assertFailures)
                            t.ok(exceptions === 2)

                            t.ok(duration !== undefined)
                            t.ok(totalDuration !== undefined)
                        })

                    } else if(name === "Test Some Stuff") {
                        t.test("Test Some Stuff", function(t) {
                            t.ok(testSuccesses === 2, testSuccesses)
                            t.ok(testFailures === 3, testFailures)
                            t.ok(testResults.length === 5, testResults.length)
                            t.ok(exceptionResults.length === 0, exceptionResults.length)
                        })

                    } else if(name === "assertSomething") {
                        t.test("assertSomething", function(t) {
                            t.ok(testSuccesses === 1, testSuccesses)
                            t.ok(testFailures === 0, testFailures)
                            t.ok(testResults.length === 1, testResults.length)
                            t.ok(exceptionResults.length === 0, exceptionResults.length)
                        })

                    } else if(name === "shouldFail") {
                        t.test("shouldFail", function(t) {
                            t.ok(testSuccesses === 1, testSuccesses)
                            t.ok(testFailures === 2, testFailures)
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
                    return result
                },
                exception: function(e) {
                    return e
                },
                log: function(msg) {
                    return msg
                }
            })
        })

        this.test("results are available", function() {
            var test = Unit.test(function() {
                this.ok(true)
            })

            this.ok(test.results() !== undefined, test.results())
        })

        this.test("default formats", function() {
            this.test('string exceptions', function(t) {
                this.count(2)

                var test = Unit.test("Testing the Unit Tester", function() {
                    throw "strings aren't exceptions yo"
                })

                test.string().then(function(resultOutput) {
                    t.log(resultOutput)

                    t.ok(resultOutput.indexOf("strings aren't exceptions yo") !== -1)
                    t.ok(resultOutput.indexOf("t\n") === -1) // this tests for the case where a string is printed one character per line (which is not desirable)
                }).done()
            })

            this.test('logging exceptions with custom properties', function(t) {
                this.count(3)

                var test = Unit.test("Testing the Unit Tester", function() {
                    var customError = CustomError('testCustom', {a:1, b:'two', c:[1,2,3], d:{four:4}})
                    this.log(customError)
                })

                test.string().then(function(resultOutput) {
                    t.log(resultOutput)

                    t.ok(resultOutput.indexOf("testCustom") !== -1)
                    t.ok(resultOutput.indexOf("two") !== -1)
                    t.ok(resultOutput.indexOf("four") !== -1)
                }).done()
            })
        })
    })

    console.log("")
    realTest.writeConsole()

}).catch(function(e) {
    console.log(e.stack)
}).done()
