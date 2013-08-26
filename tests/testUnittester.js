"use strict";

var Unit = require('../deadunit')
var indent = require("../indent")
var Future = require('nodejsUtils/asyncFuture')

var futuresToWaitOn = []

var testGroups = Unit.test("Testing the Unit Tester", function() {

	this.test("Test Some Stuff", function() {
		this.test("assertSomething", function() {
			this.ok(5 === 5)
		})
		this.test("shouldFail", function() {
			this.ok(5 === 3)
			this.equal(true, false)
            this.log("test log")
		})
		this.test("shouldThrowException", function() {
            this.ok(true)
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
	})
	this.test("SuccessfulTestGroup", function() {
		this.test("yay", function() {
			this.equal(true, true)
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

// Unit test the results

var mainTest = Unit.test("Unit test the unit test-results", function() {
    var test = testGroups.results()

    this.ok(test.type === "group")
    this.ok(test.name === "Testing the Unit Tester")
    this.ok(test.exceptions.length === 0)
    this.ok(test.results.length === 2)

        var subtest1 = test.results[0]
        this.ok(subtest1.type === "group")
        this.ok(subtest1.name === "Test Some Stuff")
        this.ok(subtest1.exceptions.length === 0)
        this.ok(subtest1.results.length === 4)

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
                this.ok(subtest3.line === 15)
                this.ok(subtest3.column === 14)

            subtest2 = subtest1.results[1]
            this.ok(subtest2.name === "shouldFail")
            this.ok(subtest2.exceptions.length === 0)
            this.ok(subtest2.results.length === 3)

                subtest3 = subtest2.results[0]
                this.ok(subtest3.success === false)
                this.ok(subtest3.sourceLines.join("\n").indexOf("5 === 3") !== -1)

                subtest3 = subtest2.results[1]
                this.ok(subtest3.success === false)
                this.ok(subtest3.sourceLines.join("\n").indexOf("true") !== -1)

                subtest3 = subtest2.results[2]
                this.ok(subtest3.type === "log")
                this.ok(subtest3.msg === "test log")

            subtest2 = subtest1.results[2]
            this.ok(subtest2.name === "shouldThrowException")
            this.ok(subtest2.exceptions.length === 1)
            this.ok(subtest2.exceptions[0].message === "Ahhhhh!")
            this.ok(subtest2.results.length === 1)

                subtest3 = subtest2.results[0]
                this.ok(subtest3.success === true)

            subtest2 = subtest1.results[3]
            this.ok(subtest2.name === "should throw an asynchronous exception")
            this.ok(subtest2.exceptions.length === 1)
            this.ok(subtest2.exceptions[0].message === "Asynchronous Ahhhhh!")
            this.ok(subtest2.results.length === 0)

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

})

Future.all(futuresToWaitOn).then(function() {
    mainTest.writeConsole()
}).done()



//console.log(stringTestResults(testGroups.results()))
//console.log(" ----------- ")



console.log("\n--Displaying the results visually--\n");



var simpleSuccess = Unit.test(function() {
	this.ok(true)
})
var simpleFailure = Unit.test(function() {
	this.ok(false)
})
var simpleException = Unit.test(function() {
	throw Error("sync")
})

var f = new Future()
var simpleAsyncException = Unit.test(function() {
	setTimeout(function() {
        f.return()
        throw Error("Async")
    }, 1000)
})

console.log("simple success")
simpleSuccess.writeConsole()
console.log("\nsimple failure")
simpleFailure.writeConsole()
console.log("\nsimple exception")
simpleException.writeConsole()
f.then(function() {
    console.log("\nsimple async exception")
    simpleAsyncException.writeConsole()
}).done()


console.log(testGroups.toString())	// returns plain text
testGroups.writeConsole() 		// writes color console output

//console.log(testGroups.html())		// returns html
/*testGroups.write.html()			// appends html to the current (html) page the tests are running in
*/