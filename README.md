**Status**: API finalized, needs testing

`deadunit`
========

A dead-simple nesting unit testing module for node.js (and someday the browser!).
This repository provides default visual representations for the output of [deadunit-core](https://github.com/fresheneesz/deadunitCore),
  as well as a formatter that can be used to easily create custom test visualizations.


Why use it over...
==================

The only competitive alternative I know is [Wizek's Tree](https://github.com/Wizek/Tree). 

* deadunit is simple, doesn't provide needless sugar (e.g. always-pass/always-fail asserts) or an awkward sentence-like api
* deadunit doesn't proscribe synchronization for you - it only expects that you make sure your tests finish before you access the resutls.

Then again, tree is designed to work in browsers, whereas deadunit doesn't yet do that.

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
    * `format.exception(exception)`
    * `format.group(testName, testDuration, totalDuration, testCaseSuccesses, testCaseFailures, assertSuccesses,`  
`assertFailures, exceptions, results, exceptionResults, nestingLevel)`
    * `format.log(message)`

For documentation on how to write unit tests, see [deadunit-core](https://github.com/fresheneesz/deadunitCore).

ExtendedUnitTest
----------------

This object extends [UnitTest from deadunit-core](https://github.com/fresheneesz/deadunitCore#unittest). Also has the following methods:

`test.toString(<colorize>)` - returns a string containing formatted test results. *See below for screenshots.*

`test.string(<colorize>)` - alias of `toString`

`test.writeConsole` - writes colorized text output to the console. *See below for screenshots.*

### Screenshots ###

![Simple colorized tests](screenshots/SimpleTestsColorized.png "Simple colorized tests")

![Full colorized test results](screenshots/FullTestColorized.png "Full colorized test results")

![Plain Text Output](screenshots/PlainTextScreenshot.png "Plain Text Output")

Todo
====

* Once `colors` supports a safe mode (where it doesn't modify the String prototype), use that. *Modifying builtins is dangerous*.
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

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
