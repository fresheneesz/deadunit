`deadunit`
========

A dead-simple nesting unit testing module for node.js (and someday the browser!).
This repository provides default visual representations for the output of [deadunit-core](https://github.com/fresheneesz/deadunitCore),
  as well as a formatter that can be used to easily create custom test visualizations.


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

For documentation on how to write unit tests, see [deadunit-core](https://github.com/fresheneesz/deadunitCore).


Formatter
---------

(docs coming soon)

Todo
====

See [the todos for deadunit-core](https://github.com/fresheneesz/deadunitCore#to-do)

How to Contribute!
============

Anything helps:

* Creating issues (aka tickets/bugs/etc). Please feel free to use issues to report bugs, request features, and discuss changes
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/testDeadunit.js) to verify that your change
7. When you're done, run the unit tests and ensure they all pass
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
