"use strict";

var Unit = require('../deadunit')
var indent = require("../indent")
var Future = require('asyncFuture')

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

    var mainTest = Unit.test("Unit test the unit test-results (these should all succeed)", function() {
        var test = testGroups.results()

        this.ok(test.type === "group")
        this.ok(test.name === "Testing the Unit Tester")
        this.ok(test.testDuration !== undefined && test.testDuration > 0, test.testDuration)
        this.ok(test.exceptions.length === 0)
        this.ok(test.results.length === 3, test.results.length)

            var subtest1 = test.results[0]
            this.ok(subtest1.type === "group")
            this.ok(subtest1.name === "Test Some Stuff")
            this.ok(subtest1.testDuration !== undefined && subtest1.testDuration > 0 && subtest1.testDuration < 100, subtest1.testDuration)
            this.ok(subtest1.totalDuration !== undefined && subtest1.totalDuration >= subtest1.testDuration)  // totalDuration is the duration including before and after
            this.ok(subtest1.exceptions.length === 0)
            this.ok(subtest1.results.length === 5, subtest1.results.length)

                var subtest2 = subtest1.results[0]
                this.ok(subtest2.type === "group")
                this.ok(subtest2.name === "assertSomething")
                this.ok(subtest2.exceptions.length === 0)
                this.ok(subtest2.results.length === 1)

                    var subtest3 = subtest2.results[0]
                    this.ok(subtest3.type === "assert")
                    this.ok(subtest3.success === true)
                    this.ok(subtest3.sourceLines.join("\n").indexOf("5 === 5") !== -1)
                    this.ok(subtest3.file === "testUnittester.js")
                    this.ok(subtest3.line === 13, subtest3.line)
                    //this.ok(subtest3.column === 9, subtest3.column)

                subtest2 = subtest1.results[1]
                this.ok(subtest2.name === "shouldFail")
                this.ok(subtest2.testDuration !== undefined && subtest2.testDuration >= 0 && subtest2.testDuration < 10, subtest2.testDuration)
                this.ok(subtest2.exceptions.length === 0)
                this.ok(subtest2.results.length === 4, subtest2.results.length)

                    subtest3 = subtest2.results[0]
                    this.ok(subtest3.success === false)
                    this.ok(subtest3.sourceLines.join("\n").indexOf("5 === 3") !== -1)
                    this.ok(subtest3.actual === 'actual')
                    this.ok(subtest3.expected === 'expected')

                    subtest3 = subtest2.results[1]
                    this.ok(subtest3.success === false)
                    this.ok(subtest3.sourceLines.join("\n").indexOf("true, false") !== -1)
                    this.ok(subtest3.file === "testUnittester.js")
                    this.ok(subtest3.line === 17, subtest3.line)
                    //this.ok(subtest3.column === 9, subtest3.column)

                    subtest3 = subtest2.results[2]
                    this.ok(subtest3.type === "log")
                    this.ok(subtest3.msg === "test log")

                    subtest3 = subtest2.results[3]      // count
                    this.ok(subtest3.type === "assert", subtest3.type)
                    this.ok(subtest3.success === false, subtest3.success)

                subtest2 = subtest1.results[2]
                this.ok(subtest2.name === "shouldThrowException")
                this.ok(subtest2.testDuration !== undefined && subtest2.testDuration >= 0 && subtest2.testDuration < 10, subtest2.testDuration)
                this.ok(subtest2.exceptions.length === 1)
                this.ok(subtest2.exceptions[0].message === "Ahhhhh!")
                this.ok(subtest2.results.length === 2, subtest2.results.length)

                    subtest3 = subtest2.results[0]
                    this.ok(subtest3.success === true)

                    subtest3 = subtest2.results[1]     // count
                    this.ok(subtest3.success === true)

                subtest2 = subtest1.results[3]
                this.ok(subtest2.name === "should throw an asynchronous exception")
                this.ok(subtest2.exceptions.length === 1)
                this.ok(subtest2.exceptions[0].message === "Asynchronous Ahhhhh!")
                this.ok(subtest2.results.length === 0)

                subtest2 = subtest1.results[4]     // count
                this.ok(subtest2.success === true)

            subtest1 = test.results[1]
            this.ok(subtest1.name === "SuccessfulTestGroup")
            this.ok(subtest1.exceptions.length === 0)
            this.ok(subtest1.results.length === 1)

                subtest2 = subtest1.results[0]
                this.ok(subtest2.name === "yay")
                this.ok(subtest2.exceptions.length === 0)
                this.ok(subtest2.results.length === 1)

                    subtest3 = subtest2.results[0]
                    this.ok(subtest3.success === true)
                    this.ok(subtest3.sourceLines.join("\n").indexOf("true") !== -1)


        this.test("befores and afters", function() {
            var x = 0
            var that = this

            this.before(function(that2) {
                this.ok(this === that)
                this.ok(this === that2)
                this.log("before: "+x)
                x++
            })
            this.after(function(that2) {
                this.ok(this === that)
                this.ok(this === that2)
                this.log("after: "+x)
                x+=10
            })

            this.test("one", function() {
                this.log("x is: "+x)
                this.ok(x===1, x)
            })
            this.test("two", function() {
                this.ok(x===12, x)
            })
        })

    })

    mainTest.writeConsole()

    //console.log(stringTestResults(testGroups.results()))
    //console.log(" ----------- ")



    console.log("\n\n\n--Displaying the results visually--\n\n");



    var simpleSuccess = Unit.test(function() {
        this.ok(true)
    })
    var simpleFailure = Unit.test(function() {
        this.ok(false)
    })
    var simpleException = Unit.test(function() {
        throw Error("sync")
    })

    var simpleAsyncExceptionFuture = new Future()
    var simpleAsyncException = Unit.test(function() {
        setTimeout(function() {
            f.return()
            throw Error("Async")
        }, 0)
    })

    console.log("simple success")
    simpleSuccess.writeConsole()
    console.log("\nsimple failure")
    simpleFailure.writeConsole()
    console.log("\nsimple exception")
    simpleException.writeConsole()
    simpleAsyncExceptionFuture.then(function() {
        console.log("\nsimple async exception")
        simpleAsyncException.writeConsole()
    }).done()


    console.log(testGroups.toString())	// returns plain text
    testGroups.writeConsole() 		// writes color console output

    //console.log(testGroups.html())		// returns html
    /*testGroups.write.html()			// appends html to the current (html) page the tests are running in
    */

}).done()


console.log('expecting an error below from an unaccessed test')

Unit.test("something", function() {})


