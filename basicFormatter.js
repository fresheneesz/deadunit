
var Future = require('async-future')

// built in test formatting helper
module.exports = function(unitTest, printOnTheFly, hangingTimeout, format) {
    var result = new Future

    var events = {
        end: function(e) {
            var results = unitTest.results()
            result.return(formatGroup(results, format, 0).result)

            if(hangingTimeout !== 0) {
                setTimeout(function() {
                    console.log(("Script is hanging (lasted more than "+hangingTimeout+"ms after test \""+results.name+"\" finished printing)").red)
                }, hangingTimeout).unref() // note: unref is only available in node.js
            }
        }
    }

    if(printOnTheFly) {
        events.assert = function(e) {
            console.log(format.assert(e))
        }
        events.exception = function(e) {
            console.log(format.exception(e.error))
        }
        events.log = function(e) {
            console.log(format.log(e.values))
        }
    }

    unitTest.events(events)

    return result
}

function formatGroup(testResults, format, nestingLevel) {
    var assertSuccesses = 0
    var assertFailures = 0
    var exceptions = 0

    var testCaseSuccesses= 0, testCaseFailures=0;

    var results = []
    testResults.results.forEach(function(result) {
        if(result.type === 'assert') {
            if(result.success) {
                testCaseSuccesses++
                assertSuccesses ++
            } else {
                testCaseFailures++
                assertFailures++
            }

            results.push(format.assert(result, testResults.name))

        } else if(result.type === 'group') {
            var group = formatGroup(result, format, nestingLevel+1)
            exceptions+= group.exceptions

            if(group.failures === 0 && group.exceptions === 0)
                testCaseSuccesses++
            else
                testCaseFailures++

            results.push(group.result)
            assertSuccesses+= group.assertSuccesses
            assertFailures+= group.assertFailures

        } else if(result.type === 'log') {
            results.push(format.log(result.values))
        } else {
            throw new Error("Unknown result type: "+result.type)
        }
    })

    var exceptionResults = []
    testResults.exceptions.forEach(function(e) {
        exceptionResults.push(format.exception(e))
    })

    exceptions+= testResults.exceptions.length

    var formattedGroup = format.group(testResults.name, testResults.totalSyncDuration, testResults.duration,
                                      testCaseSuccesses, testCaseFailures,
                                      assertSuccesses, assertFailures, exceptions,
                                      results, exceptionResults, nestingLevel, testResults.timeout)
    return {result: formattedGroup,
            successes: testCaseSuccesses,
            failures: testCaseFailures,
            assertSuccesses: assertSuccesses,
            assertFailures: assertFailures,
            exceptions: exceptions
    }
}

