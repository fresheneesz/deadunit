**Status**: API finalized, needs testing

`deadunit`
========

A *dead*-simple nesting unit testing module for node.js (and someday the browser!).
This repository provides default visual representations for the output of [deadunit-core](https://github.com/fresheneesz/deadunitCore),
  as well as a formatter that can be used to easily create custom test visualizations.

'*Now with both console and HTML output!*'

Why use it over...
==================

* [Jasmine](http://pivotal.github.io/jasmine/) / [Node-Unit](https://github.com/caolan/nodeunit) / [Wizek's Tree](https://github.com/Wizek/Tree)
 * deadunit's *dead*-simple API only has two major ways to assert behavior (`ok` and `count`) making it easy to learn.
 * deadunit prints the lines of code of asserts in the test results!
 * deadunit just uses javascript! It doesn't have an awkward sentence-like api.
 * deadunit's `count` method elegantly solves various issues like expecting exceptions and asynchronous asserts - just `count` up the number of `ok`s!
 * deadunit follows best practices for modular design rather than creating global variables and functions
 * deadunit doesn't provide spies. The use of spies is bad practice as tests should treat the modules they test as black boxes by only testing the public API. The internals of these APIs should be left alone.
 * deadunit is simpler to use because it doesn't provide needless sugar (e.g. Tree's always-pass/always-fail asserts)
 * deadunit doesn't proscribe synchronization for you - it only expects that you tell it when all the tests are complete (using `this.done()`).
 * deadunit supports testing code that uses [node fibers](https://github.com/laverdet/node-fibers)
 * deadunit's output is easier to visually parse than jasmine, or wizek's tree, and much easier than node-unit

Deadunit doesn't work in the browser yet tho, whereas Jasmine and Tree do.

Example
=======

```javascript
var Unit = require('deadunit')

var test = Unit.test('some test name', function() {
    var obj = someFunctionToTest()

    this.ok(obj.x === 5)
    this.ok(obj.y === 'y')

    this.test('nested test', function() {
        this.ok(obj.go() > 4)
    })
})

test.writeConsole() // writes colorful output!
test.html()         // returns pretty html!
```

Install
=======

```
npm install deadunit
```

Usage
=====

Unit Tester
-----------

```javascript
var Unit = require('deadunit')
```

`Unit.test([<name>, ]<testFunction>)` - runs a suite of unit tests. Returns an ExtendedUnitTest object.

`Unit.error(<handler>)` - see [deadunit-core](https://github.com/fresheneesz/deadunitCore#usage)

`Unit.format(<unitTest>, <format>)` - creates custom formatted output for test results according to the passed in `<format>`.

* `<unitTest>` is a `UnitTest` (or `ExtendedUnitTest`) object
* `<format>` - an object containing functions that format the various types of results. Each formater function should return a `String`.
    * `format.assert(result, testName)`
    	* `result` is a deadunit-core [assert result object](https://github.com/fresheneesz/deadunitCore#assert)
        * `testName` is the name of the test the assert is under
    * `format.exception(exception)`
        * `exception` is an exception object (could be any object that was thrown)
    * `format.group(name, totalDuration, totalSynchronousDuration, testCaseSuccesses, testCaseFailures,`  
       `assertSuccesses, assertFailures, exceptions, results, exceptionResults, nestingLevel)`
       * `name` is the test group name
       * `totalDuration` - the total duration the test took from start to the last test-action
       * `totalSynchronousDuration` - the time it took for the test function to complete synchronously (ignores all asynchronous parts)
       * `testCaseSuccesses` - the number of successful asserts (the `ok` method) and groups in this test group. *Does not count asserts and test-groups inside subtest groups*
       * `testCaseFailures` - the number of failed asserts and groups in this test group. *Does not count asserts and test-groups inside subtest groups*
       * `assertSuccesses` - the number of successful asserts in this test group and all subgroups.
       * `assertFailures` - the number of failed asserts in this test group and all subgroups.
       * `exceptions` - the number of exceptions in this test group and all subgroups.
       * `results` - an array of already-formatted test results.
       * `exceptionResults` - an array of already-formatted exceptions.
       * `nestingLevel` is what level of test group this is. The top-level test is at level 0.
    * `format.log(values)`
    	* `values` is an array of logged values

For documentation on how to write unit tests, see [deadunit-core](https://github.com/fresheneesz/deadunitCore).

ExtendedUnitTest
----------------

This object extends [UnitTest from deadunit-core](https://github.com/fresheneesz/deadunitCore#unittest). Also has the following methods:

`test.toString(<colorize>)` - returns a string containing formatted test results. *See below for screenshots.*

`test.string(<colorize>)` - alias of `toString`

`test.writeConsole()` - writes colorized text output to the console. *See below for screenshots.*

`test.html()` - returns a string containing html-formatted test results. *See below for screenshots.*

### Screenshots ###

![Simple colorized tests](screenshots/SimpleTestsColorized.png "Simple colorized tests")

![Full colorized test results](screenshots/FullTestColorized.png "Full colorized test results")

![Plain Text Output](screenshots/PlainTextScreenshot.png "Plain Text Output")

![Simple HTML tests](screenshots/SimpleTestsHtml.png "Simple HTML tests")

Passing tests are closed and failling tests are open by default. Clicking on the bars toggles sections open or closed.
![Full HTML test results](screenshots/FullTestHtml.png "Full HTML test results")

Todo
====

* Print out own-properties of exceptions that happen
* Once `colors` supports a safe mode (where it doesn't modify the String prototype), use that. *Modifying builtins is dangerous*.
* Output test results as they happen, and display a summary at the end (so you can see what progress the test is making).
* Also see [the todos for deadunit-core](https://github.com/fresheneesz/deadunitCore#to-do)

How to Contribute!
============

Anything helps:

* Creating issues (aka tickets/bugs/etc). Please feel free to use issues to report bugs, request features, and discuss changes.
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/testDeadunit.js) to verify that your change works
7. When you're done, run the unit tests and ensure they all pass
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request

Change Log
=========

* 1.0.7
  * Pretty printing logs other places objects are printed
  * html output
  * handling properties on exceptions

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
