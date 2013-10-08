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




