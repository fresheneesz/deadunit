(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["deadunit"] = factory();
	else
		root["deadunit"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ((function(modules) {
	// Check all modules for deduplicated modules
	for(var i in modules) {
		switch(typeof modules[i]) {
		case "number":
			// Module is a copy of another module
			modules[i] = modules[modules[i]];
			break;
		case "object":
			// Module can be created from a template
			modules[i] = (function(_m) {
				var args = _m.slice(1), fn = modules[_m[0]];
				return function (a,b,c) {
					fn.apply(null, [a,b,c].concat(args));
				};
			}(modules[i]));
		}
	}
	return modules;
}([
/* 0 */
/*!*****************************!*\
  !*** ./deadunit.browser.js ***!
  \*****************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var Future = __webpack_require__(/*! async-future */ 9)
	var proto = __webpack_require__(/*! proto */ 8)
	var defaultFormats = __webpack_require__(/*! ./defaultFormats */ 1)
	
	var Container = __webpack_require__(/*! blocks.js/Container */ 4)
	var OriginalText = __webpack_require__(/*! blocks.js/Text */ 5)
	var Block = __webpack_require__(/*! blocks.js/Block */ 6)
	Block.dev = true
	var Style = __webpack_require__(/*! blocks.js/Style */ 7)
	
	var deadunitInternal = __webpack_require__(/*! ./deadunit.internal */ 2)
	var utils = __webpack_require__(/*! ./utils */ 3)
	
	
	module.exports = deadunitInternal({
	    deadunitCore: __webpack_require__(/*! deadunit-core/src/deadunitCore.browser */ 10),
	
	    environmentSpecificMethods: function() {
	        var red = 'rgb(200,30,30)'
	
	        var warningWritten = false
	        function warnAboutLateEvents(domNode) {
	            if(!warningWritten) {
	                append(domNode, "Test results were accessed before asynchronous parts of tests were fully complete.", {style: "color: red;"})
	                warningWritten = true
	            }
	        }
	
	        function writeLateEvent(written, ended, domNode, event, manager) {
	            if(ended) {
	                written.then(function() {
	                    warnAboutLateEvents(domNode)
	                    append(domNode, JSON.stringify(event), {style: "color: red;"})
	                })
	            }
	        }
	
	        // writes html on the current (browser) page
	        this.writeHtml = function(domNode) {
	            if(domNode === undefined) domNode = document.body
	
	            var f = new Future, groups = {}, ended = false, mainGroup, lateEventsWarningPrinted=false;
	            this.events({
	                group: function(groupStartEvent) {
	                    if(groupStartEvent.parent === undefined) {
	                        var group = mainGroup = MainGroup(groupStartEvent.name, groupStartEvent.time)
	                        domNode.appendChild(mainGroup.domNode)
	
	                    } else {
	                        var group = Group(mainGroup, groupStartEvent.name, groupStartEvent.time, groups[groupStartEvent.parent])
	                        group.parentGroup.addSubGroup(group)
	                    }
	
	                    groups[groupStartEvent.id] = group
	                    lateEventCheck()
	                },
	                count: function(e) {
	                    groups[e.parent].addExpectedCount(e.expected, Count(e.sourceLines, e.file, e.line, e.column, ended, e.expected))
	                    lateEventCheck()
	                },
	                assert: function(e) {
	                    groups[e.parent].addAssert(Assert(e.sourceLines, e.file, e.line, e.column, ended, e.expected, e.actual, e.success))
	                    lateEventCheck()
	                },
	                exception: function(exceptionEvent) {
	                    groups[exceptionEvent.parent].addException(Exception(exceptionEvent.error, ended))
	                    lateEventCheck()
	                },
	                log: function(logEvent) {
	                    groups[logEvent.parent].results.add(Log(logEvent.values, ended))
	                    lateEventCheck()
	                },
	                groupEnd: function(groupEvent) {
	                    var group = groups[groupEvent.id]
	                    group.end(groupEvent.time, ended)
	
	                    if(group.parentGroup !== undefined && group.state.subject.success) {
	                        group.parentGroup.title.passed++
	                        group.parentGroup.updateTitle()
	                    }
	
	                    lateEventCheck()
	                },
	                end: function(endEvent) {
	                    mainGroup.endTest(endEvent.type, endEvent.time)
	                    ended = true
	                    f.return()
	                }
	            })
	            return f
	
	            // if late is true, prints out the late event warning, unless it's already been printed
	            function lateEventCheck() {
	                if(ended && !lateEventsWarningPrinted) {
	                    mainGroup.add(Text('lateEventsWarning', "Warning: some events happened after the test ended."))
	                    lateEventsWarningPrinted = true
	                }
	            }
	        }
	
	    }
	})
	
	function append(domNode, content, attributes) {
	    if(domNode.setAttributeNode === undefined || domNode.appendChild === undefined)
	        console.log("Object that is not a dom node passed to 'append' (jquery objects aren't supported anymore): "+domNode)
	    if(attributes ===  undefined) attributes = {}
	
	    /*var div = document.createElement('div')
	        div.innerHTML = content
	    for(var attribute in attributes) {
	        var a = document.createAttribute(attribute)
	            a.nodeValue = attributes[attribute]
	        domNode.setAttributeNode(a);
	    }
	
	    domNode.appendChild(div)
	    */
	    $(domNode).append(content)
	}
	
	var color = defaultFormats.htmlColors
	
	document.body.style.backgroundColor = color.black
	var mainGroupStyle = Style({
	    color: color.white,
	    marginTop: 10,
	
	    Text: {
	        $mainTitle:{
	            cursor: 'pointer',
	            color: color.brightBlue,
	            fontSize: 28,
	            fontWeight: 'bold',
	            margin: '9px 0'
	        },
	        $timeout: {
	            color: color.red
	        },
	        $lateEventsWarning: {
	            color: color.yellow
	        }
	    },
	
	    Container:{$results:{
	        $state: function(state) {
	            if(state.success) {
	                if(state.late) {
	                    var borderColor = color.darkYellow
	                } else {
	                    var borderColor = color.green
	                }
	            } else {
	                var borderColor = color.red
	            }
	
	            return Style({
	                border: '1px solid '+borderColor,
	                display: 'block',
	                padding: 5
	            })
	        }
	    }},
	
	    MainBar: {
	        $state: function(state) {
	            if(state.success) {
	                if(state.late) {
	                    var borderColor = color.darkYellow
	                } else {
	                    var borderColor = color.green
	                }
	            } else {
	                var borderColor = color.red
	            }
	
	            return Style({
	                cursor: 'pointer',
	                border: "2px solid "+borderColor,
	                display: 'block',
	                padding: 1,
	            })
	        },
	
	
	        Container: {
	            $inner: {
	                $state: function(state) {
	                    if(state.success) {
	                        if(state.late) {
	                            var backgroundColor = color.darkYellow
	                        } else {
	                            var backgroundColor = color.green
	                        }
	                    } else {
	                        var backgroundColor = color.red
	                    }
	
	                    return Style({
	                        backgroundColor: backgroundColor,
	                        display: "block",
	                        padding: "1px 3px",
	                    })
	                },
	
	                Text: {
	                    color: color.white,
	                    $title: {
	                        color: color.brightBlue
	                    }
	                }
	            },
	            $passes: {
	                Text: {color: color.brightGreen}
	            },
	            $failures: {
	                Text: {color: color.darkRed}
	            },
	            $exceptions: {
	                Text: {color: color.brightPurple}
	            },
	            $clickText: {
	                float: 'right',
	                Text: {fontStyle: 'italic'}
	            }
	        },
	    },
	
	    Group: {
	        padding: 1,
	        margin: '8px 0',
	
	        GroupTitle: {
	            $state: function(state) {
	                if(state.success) {
	                    var textColor = color.brightGreen
	                    if(state.late) {
	                        var backgroundColor = color.darkYellow
	                    } else {
	                        var backgroundColor = color.green
	                    }
	                } else {
	                    var textColor = color.white
	                    var backgroundColor = color.red
	                }
	
	                return Style({
	                    backgroundColor: backgroundColor,
	                    color: textColor,
	                    paddingLeft: 3,
	                    cursor: 'pointer'
	                })
	            },
	
	            Text: {
	                $timeElapsed: {
	                    color: color.gray
	                }
	            }
	        },
	    },
	
	    ResultLine: {
	        $state: function(state) {
	            if(!state.success) {
	                var textColor = color.red
	            } else if(state.late) {
	                var textColor = color.yellow
	            } else {
	                var textColor = color.green
	            }
	
	            return Style({color: textColor})
	        },
	
	        Container: {
	            $location: {
	                Text: {
	                    color: color.gray,
	                    $line: {
	                        color: color.white
	                    }
	                }
	            },
	            $expectedAndActual: {
	                Text: {
	                    color: color.gray,
	                    $actual: {
	                        color: color.white
	                    },
	                    $expected: {
	                        color: color.white
	                    }
	                }
	            }
	        }
	    },
	
	    Exception: {
	        color: color.purple
	    },
	    Log: {
	        Text: {
	            display: 'block'
	        }
	    }
	})
	
	
	
	// a Block on its own line
	var Line = proto(Block, function() {
	    this.name = "Line"
	    this.defaultStyle = Style({
	        display: 'block'
	    })
	})
	
	var Group = proto(Line, function() {
	    this.name = "Group"
	
	    this.build = function(mainGroup, groupTitle, time, parentGroup) {
	        this.mainGroup = mainGroup
	        this.results = Container('results')
	        this.parentGroup = parentGroup
	
	        this.add(this.results)
	        this.createTitleBar(groupTitle)
	        this.startTime = time
	        this.count = 0
	
	        this.title.on('click', function() {
	            this.results.visible = !this.results.visible
	        }.bind(this))
	    }
	
	    this.createTitleBar = function(groupTitle) {
	        this.title = GroupTitle(groupTitle)
	        this.addAt(0, this.title)
	    }
	
	    this.addExpectedCount = function(expected, countBlock) {
	        this.expected = expected
	        this.countBlock = countBlock
	        this.countBlock.count = this.count
	        this.results.addAt(0, countBlock)
	        this.title.total++
	
	        updateCountSuccess(this)   // must be run before updateTitle (because it modifies info updateTitle relies on)
	        this.updateTitle()
	    }
	
	    this.addAssert = function(assertBlock) {
	        this.results.add(assertBlock)
	        this.count++
	        if(this.countBlock !== undefined)
	            this.countBlock.count = this.count
	
	        this.title.total++
	        if(assertBlock.state.subject.success) {
	            this.title.passed++
	            this.mainGroup.title.testTotalPasses++
	        } else {
	            this.mainGroup.title.testTotalFailures++
	        }
	
	        updateCountSuccess(this)   // must be run before updateTitle (because it modifies info updateTitle relies on)
	        this.updateTitle()
	    }
	
	    this.addException = function(exceptionBlock) {
	        this.results.add(exceptionBlock)
	        this.title.exceptions++
	        this.mainGroup.title.testTotalExceptions++
	
	        this.updateTitle()
	    }
	
	    this.addSubGroup = function(groupBlock) {
	        this.results.add(groupBlock)
	        this.count++
	        if(this.countBlock !== undefined)
	            this.countBlock.count = this.count
	
	        this.title.total++
	
	        updateCountSuccess(this)   // must be run before updateTitle (because it modifies info updateTitle relies on)
	        this.updateTitle()
	    }
	
	    this.end = function(time) {
	        //updateCountSuccess(this, true) // must be run before groupEnded is set (because it relies on groupEnded being false at this point)
	        if(this.expected !== undefined && !(this.count === this.expected)) this.mainGroup.title.testTotalFailures++
	
	        this.groupEnded = true
	        this.updateTitle()
	        if(!(this instanceof MainGroup)) {
	            this.title.add(Text('timeElapsed', ' took '+(time - this.startTime)+'ms'))
	        }
	    }
	
	    this.updateTitle = function() {
	        var success = this.title.passed === this.title.total && this.title.exceptions === 0
	                      && (this !== this.mainGroup || this.title.testTotalFailures === 0 && this.title.testTotalExceptions === 0)
	
	        this.results.visible = !success
	        var parts = [this,this.results,this.title]// things to set success on (since $state styling is currently so limited, you have to set it on everything that needs a style)
	        if(this instanceof MainGroup) {
	            parts.push(this.title.inner)
	        }
	
	        var ended = this.mainGroup.ended
	        parts.forEach(function(block) {
	            block.state.set("success", success)
	            block.state.set("late", ended)
	        })
	
	        if(this.parentGroup !== undefined) this.parentGroup.updateTitle()
	    }
	})
	
	// figure out if count succeeded and update the main group and the countblock state
	function updateCountSuccess(that) {
	    if(that.expected !== undefined) {
	        var countSuccess = that.count === that.expected
	        that.countBlock.state.set("success", countSuccess)
	        if(that.groupEnded) that.countBlock.results.state.set("late", true)
	
	        if(countSuccess) {
	            that.mainGroup.title.testTotalPasses++
	            that.title.passed++
	            if(that.groupEnded) {
	                that.mainGroup.title.testTotalFailures--
	                that.groupEndCountSubtracted = true // marks that failures were subtracted after the test finished (so successes can be later subtracted correctly if need be)
	            }
	        } else if(that.groupEndCountSubtracted) {
	            that.mainGroup.title.testTotalFailures++
	            that.mainGroup.title.testTotalPasses--
	            that.title.passed--
	        }
	    }
	}
	
	var MainGroup = proto(Group, function(superclass) {
	    this.name = "MainGroup"
	
	    this.createTitleBar = function(groupTitle) {
	        this.title = MainBar(groupTitle)
	        this.add(this.title)
	    }
	
	    this.build = function(groupTitle, time) {
	        superclass.build.call(this, this,groupTitle,time)
	        this.style = mainGroupStyle
	
	        var mainTitle = Text('mainTitle', groupTitle)
	        this.addAt(0, mainTitle)
	        this.add(this.pendingText=Text("Pending..."))
	
	        mainTitle.on('click', function() {
	            this.results.visible = !this.results.visible
	        }.bind(this))
	    }
	
	    this.endTest = function(type, time) {
	        if(type === 'timeout')
	            this.add(Text('timeout', "The test timed out!"))
	
	        this.pendingText.visible = false
	        this.updateTitle()
	        this.testTotalTime = getTimeDisplay(time - this.startTime)
	        this.title.takenText.text = "Took "
	        this.ended = true
	    }
	})
	
	
	
	var Text = proto(OriginalText, function() { // doing this cause i'm to lazy to update blocks.js right now
	    this.defaultStyle = Style({
	        whiteSpace: 'pre-wrap'
	    })
	})
	
	
	var GroupTitle = proto(Line, function() {
	    this.name = "GroupTitle"
	
	    this.build = function(title) {
	        this.totalNode = Text('0')
	        this.passedNode = Text('0')
	        this.exceptionsNode = Text('0')
	
	
	        if(title !== undefined) {
	            this.add(Text(title+":       "))
	        }
	
	        this.add(this.passedNode, Text('/'), this.totalNode, Text(' and '), this.exceptionsNode, Text(" exceptions "))
	    }
	
	    ;['total','passed','exceptions'].forEach(function(property) {
	        Object.defineProperty(this, property, {
	            get: function() {  return parseInt(this[property+"Node"].text)},
	            set: function(v) {
	                this[property+"Node"].text = v
	                if(property === 'total' && this.totalPlural) {
	                    if(v == 1) this.totalPlural.visible = false
	                    else       this.totalPlural.visible = true
	                }
	            }
	        })
	    }.bind(this))
	})
	
	var MainBar = proto(GroupTitle, function() {
	    this.name = "MainBar"
	
	    /*override*/ this.build = function(title) {
	        this.totalNode = Text('0'); this.totalPlural = Text('s')
	        this.passedNode = Text('0')
	        this.exceptionsNode = Text('0')  // unused, but needed to match the interface of GroupTitle
	
	        this.testTotalPassesNode = Text('0'); this.testTotalPassesPlural = Text('es')
	        this.testTotalFailuresNode = Text('0'); this.testTotalFailuresPlural = Text('s')
	        this.testTotalExceptionsNode = Text('0'); this.testTotalExceptionsPlural = Text('s')
	        this.testTotalTimeNode = Text('0')
	
	        // used temporarily to approximate the time when counting up on-the-fly
	        // will be replaced by the time coming from deadunitCore's events at the end
	        this.temporaryStartTime = Date.now()
	
	        this.inner = Container('inner', []) // outer used for styling)
	        this.add(this.inner)
	
	        if(title !== undefined) {
	            this.inner.add(Text('title', title), Text(' - '))
	        }
	
	        this.inner.add(
	            this.passedNode, Text('/'), this.totalNode, Text(' successful test'),this.totalPlural,Text('. '),
	            Container('passes', this.testTotalPassesNode, Text(" pass"), this.testTotalPassesPlural), Text(", "),
	            Container('failures', this.testTotalFailuresNode, Text(" failure"),this.testTotalFailuresPlural), Text(", and "),
	            Container('exceptions', this.testTotalExceptionsNode, Text(" exception"), this.testTotalExceptionsPlural), Text(". "),
	            Container('time', this.takenText=Text("Has taken "), this.testTotalTimeNode, Text(".")),
	            Container('clickText', Text("click on this bar"))
	        )
	    }
	
	    ;['testTotalPasses','testTotalFailures','testTotalExceptions','testTotalTime'].forEach(function(property) {
	        Object.defineProperty(this, property, {
	            get: function() {  return parseInt(this[property+"Node"].text)},
	            set: function(v) {
	                this[property+"Node"].text = v
	
	                if(property!=='testTotalTime') {
	                    this.testTotalTime = getTimeDisplay(Date.now() - this.temporaryStartTime)
	
	                    if(v == 1) this[property+'Plural'].visible = false
	                    else        this[property+'Plural'].visible = true
	                }
	            }
	        })
	    }.bind(this))
	})
	
	
	// a line of result text
	var ResultLine = proto(Line, function() {
	    this.name = "ResultLine"
	
	    this.build = function(resultText, sourceLines, file, line, column, expected, actual) {
	        this.resultTextNode = Text(resultText)
	        var location = Container('location',[Text("["+file+' '), Text('line',line), Text(":"+column+'] ')])
	        this.add(this.resultTextNode, location, Text(sourceLines))
	
	        this.expectedAndActual = Container('expectedAndActual')
	        this.add(this.expectedAndActual)
	
	        if(expected !== undefined) {
	            this.expectedAndActual.add(Text(" Expected "), Text('expected', utils.valueToMessage(expected)))
	        }
	        if(actual !== undefined) {
	            if(expected !== undefined)
	                this.expectedAndActual.add(Text(","))
	
	            this.got = Text("actual", utils.valueToMessage(actual))
	            this.expectedAndActual.add(Text(" Got "), this.got)
	        }
	    }
	})
	
	
	var Assert = proto(Line, function() {
	    this.name = "Assert"
	
	    this.successText = "Ok! "
	    this.failText = "Fail: "
	
	    this.build = function(sourceLines, file, line, column, late, expected, actual, success) {
	        var text = success?this.successText:this.failText
	
	        this.results = ResultLine(text, sourceLines, file, line, column, expected, actual)
	        this.add(this.results)
	
	        var that = this
	        this.state.on('change', function() {
	            that.results.expectedAndActual.visible = !that.state.subject.success
	        })
	
	        this.state.set("success", success)
	        this.results.state.set("success", success)
	        if(late) this.results.state.set("late", true)
	    }
	})
	
	var Exception = proto(Line, function() {
	    this.name = "Exception"
	
	    this.build = function(error, late) {
	        if(late) this.state.set("late", true)
	
	        var exceptionText = Text(utils.errorToString(error))
	        this.add(exceptionText)
	    }
	})
	
	var Count = proto(Assert, function(superclass) {
	    this.name = "Count"
	
	    this.build = function(sourceLines, file, line, column, late, expected) {
	        superclass.build.call(this, sourceLines, file, line, column, late, expected, 0, false)
	        this.expected = expected
	    }
	
	    Object.defineProperty(this, 'count', {
	        get: function() {
	            return this.results.got.text
	        }, set: function(count) {
	            this.results.got.text = count
	            if(count === this.expected) {
	                this.results.resultTextNode.text = this.successText
	            } else {
	                this.results.resultTextNode.text = this.failText
	            }
	
	            this.results.state.set("success", count === this.expected)
	        }
	    })
	})
	
	var Log = proto(Line, function() {
	    this.name = "Log"
	
	    this.build = function(values, late) {
	        if(late) this.state.set("late", true)
	
	        values.forEach(function(v) {
	            this.add(Text(utils.valueToString(v)))
	        }.bind(this))
	
	    }
	})
	
	function getTimeDisplay(milliseconds) {
	    if(milliseconds > 1000) {
	        return Math.floor(milliseconds/1000)+'s'
	    } else {
	        return milliseconds+'ms'
	    }
	}
	


/***/ },
/* 1 */
/*!***************************!*\
  !*** ./defaultFormats.js ***!
  \***************************/
/***/ function(module, exports, __webpack_require__) {

	var Future = __webpack_require__(/*! async-future */ 9)
	
	var formatBasic = __webpack_require__(/*! ./basicFormatter */ 11)
	var indent = __webpack_require__(/*! ./indent */ 12)
	var utils = __webpack_require__(/*! ./utils */ 3)
	
	// unitTest is a deadunit-core UnitTest object
	// if consoleColoring is true, the string will contain console color annotations
	// if printOnTheFly is true, test results will be printed to the screen in addition to being returned
	// returns a future containing a string with the final results
	exports.text = function textOutput(unitTest, consoleColors, printOnTheFly, printLateEvents) {
	    if(printLateEvents === undefined) printLateEvents = true
	
	    function color(theColor, theString) {
	        if(consoleColors !== undefined)
	            return consoleColors[theColor](theString.toString())
	        else
	            return theString.toString()
	    }
	
	    var warningHasBeenPrinted = false
	    function lateEventsWarning() {
	        if(ended && !warningHasBeenPrinted && printLateEvents) {
	            warningHasBeenPrinted = true
	
	            return color('red',
	                'Test results were accessed before asynchronous parts of tests were fully complete'
	                +" If you have tests with asynchronous parts, make sure to use `this.count` to declare how many assertions you're waiting for."
	            )+'\n\n'
	        } else {
	            return ''
	        }
	    }
	
	
	    var ended = false
	    return formatBasic(unitTest, printOnTheFly, consoleColors, {
	        group: function(name, totalDuration, testSuccesses, testFailures,
	                              assertSuccesses, assertFailures, exceptions,
	                              testResults, exceptionResults, nestingLevel, timedOut, onTheFly) {
	
	            var total = testSuccesses+testFailures
	
	            var addResults = function() {
	                var result = ''
	                if(testResults.length > 0)
	                    result += '\n'+indent('   ', testResults.join('\n'))
	                if(exceptionResults.length > 0)
	                    result += '\n'+indent('   ', exceptionResults.join('\n'))
	                return result
	            }
	
	
	            var testColor, exceptionColor, failColor, finalColor
	            testColor = exceptionColor = failColor = finalColor = 'green'
	            if(testFailures > 0) {
	                testColor = failColor = finalColor = 'red'
	            }
	            if(exceptions > 0) {
	                finalColor = 'red'
	                exceptionColor = 'magenta'
	            }
	
	            var durationText = utils.timeText(totalDuration)
	
	            if(nestingLevel === 0) {
	                var resultsLine = ''
	
	                if(name) resultsLine += color('cyan', name+' - ')
	
	
	
	                resultsLine += color(finalColor, testSuccesses+'/'+(testSuccesses+testFailures)+' successful tests. ')+
	                        color('green', assertSuccesses+' pass'+utils.plural(assertSuccesses,"es",""))+
	                        ', '+color(failColor, assertFailures+' fail'+utils.plural(assertFailures))+
	                        ', and '+color(exceptionColor, exceptions+' exception'+utils.plural(exceptions))+"."
	                        +color('grey', " Took "+durationText+".")
	
	                var result = ''
	                if(name) result += color('cyan', name)+'\n'
	                result += addResults()
	                result += '\n\n'+resultsLine
	
	                if(timedOut) {
	                    result += color('red', '\n    The test timed out')
	                }
	            } else {
	                if(!name) name = "<unnamed test>"
	                var result = color(finalColor, name)+':           '
	                                +color(testColor, testSuccesses+'/'+total)
	                                +" and "+color(exceptionColor, exceptionResults.length+" exception"+utils.plural(exceptionResults.length))
	                                +color('grey', " took "+durationText)
	                result += addResults()
	            }
	
	            return lateEventsWarning()+result
	        },
	        assert: function(result, test, onTheFly) {
	            if(result.success) {
	                var word = "Ok!  ";
	                var c = 'green'
	            } else {
	                var word = "Fail:";
	                var c = 'red'
	            }
	
	            var linesDisplay = result.sourceLines
	            if(result.sourceLines.indexOf("\n") !== -1) {
	                linesDisplay = "\n"+linesDisplay;
	            }
	
	            var expectations = ""
	            if(!result.success && (result.actual !== undefined || result.expected !== undefined)) {
	                var things = []
	                if(result.expected !== undefined)
	                    things.push("Expected "+utils.valueToMessage(result.expected))
	                if(result.actual !== undefined)
	                    things.push("Got "+utils.valueToMessage(result.actual))
	
	                expectations = " - "+things.join(', ')
	            }
	
	            var column = ''
	            if(result.column !== undefined) {
	                column = color('grey', ":"+result.column)
	            }
	
	            return lateEventsWarning()+color(c, word)+" ["+color('grey', result.file)+" "+result.line+column+"] "
	                        +color(c, linesDisplay)
	                        +expectations
	        },
	        exception: function(e, onTheFly) {
	            return lateEventsWarning()+color('red', 'Exception: ')
	                        +color('magenta', utils.errorToString(e))
	        },
	        log: function(values, onTheFly) {
	            return lateEventsWarning()+values.map(function(v) {
	                return utils.valueToString(v)
	            }).join(', ')
	        },
	        end: function() {
	            ended = true
	        }
	    })
	}
	
	
	var htmlColors = exports.htmlColors = {
	    red: 'rgb(200,30,30)',
	    darkRed: 'rgb(90,0,0)',
	    lightRed: 'rgb(255,210,230)',
	
	    black: 'rgb(20,20,20)',
	    white: 'rgb(240,220,220)',
	    gray: 'rgb(185, 180, 180)',
	
	    green: 'rgb(0,100,20)',
	    brightGreen: 'rgb(0,200,50)',
	
	    purple: 'rgb(190,0,160)',
	    brightPurple: 'rgb(255,126,255)',
	
	    blue: 'rgb(0, 158, 173)',
	    brightBlue: 'rgb(0, 233, 255)',
	
	    yellow: 'rgb(210,182,0)',
	    darkYellow: 'rgb(106,93,0)'
	}
	
	var red = htmlColors.red
	var darkRed = htmlColors.darkRed
	var lightRed = htmlColors.lightRed
	var black = htmlColors.black
	var white = htmlColors.white
	var green = htmlColors.green
	var brightGreen = htmlColors.brightGreen
	var purple = htmlColors.purple
	var brightPurple = htmlColors.brightPurple
	var blue = htmlColors.blue
	var brightBlue = htmlColors.brightBlue
	var gray = htmlColors.gray
	
	
	exports.html = function(unitTest, printLateEvents) {
	    if(printLateEvents === undefined) printLateEvents = true
	
	    var getTestDisplayer = function() {
	        return {
	            onToggle: function(displayNone, $bgcolor, innerSelector, outerSelector) {
	                if(displayNone == true) {
	                    $(innerSelector).css({"display":""});
	                    if(outerSelector != undefined) {
	                        $(outerSelector).css({"border":"1px solid "+$bgcolor});
	                    }
	                } else {
	                    $(innerSelector).css({"display":"none"});
	                    if(outerSelector != undefined) {
	                        $(outerSelector).css({"border":""});
	                    }
	                }
	            }
	        }
	    }
	
	
	    var formattedTestHtml = formatBasic(unitTest, false, {
	        group: function(name, totalDuration, testSuccesses, testFailures,
	                          assertSuccesses, assertFailures, exceptions,
	                          testResults, exceptionResults, nestingLevel, timedOut) {
	
	            var total = testSuccesses+testFailures
	            var mainId = getMainId(name)
	
	            if(testFailures > 0 || exceptions > 0) {
	                var bgcolor=red;
	                var show = "true";
	                var foregroundColor = lightRed
	            } else {
	                var bgcolor=green;
	                var show = "false";
	                var foregroundColor = brightGreen
	            }
	
	            var durationText = utils.timeText(totalDuration)
	
	            if(nestingLevel === 0) {
	
	                var initTestGroup = function(mainId, bgcolor, show) {
	                    $(function()
	                    {	$('#'+mainId).css({"border-color":"'+bgcolor+'"});
	                        TestDisplayer.onToggle(show, bgcolor, '#'+mainId);
	
	                        $('#'+mainId+'_final').click(function()
	                        {	TestDisplayer.onToggle($('#'+mainId).css("display") == "none", bgcolor, '#'+mainId);
	                        });
	                    });
	                }
	
	                var nameLine = "", titleLine = ''
	                if(name) {
	                    titleLine = '<h1 class="primaryTitle">'+name+'</h1>'
	                    nameLine = name+' - '
	                }
	
	                var timeoutNote = ""
	                if(timedOut) {
	                    timeoutNote = 'The test timed out'
	                }
	
	                return titleLine+
	                       '<div class="testResultsArea" id="'+mainId+'">'+
	                            testResults.join('\n')+
	                            exceptionResults.join('\n')+"\n"+
	                            '<div style="color:'+red+'">'+timeoutNote+'</div>'+
	                       '</div>'+
	                       '<div class="testResultsBar link" style="border:2px solid '+bgcolor+';" id="'+mainId+'_final">'+
	                            '<div class="testResultsBarInner" style="background-color:'+bgcolor+';">'+
	                                '<div style="float:right;"><i>click on this bar</i></div>'+
	                                '<div><span class="testResultsName">'+nameLine+'</span>' + testSuccesses+'/'+total+' successful tests. '+
	                                '<span style="color:'+brightGreen+'">'+assertSuccesses+' pass'+utils.plural(assertSuccesses,"es","")+'</span>'+
	                                ', <span style="color:'+darkRed+'">'+assertFailures+' fail'+utils.plural(assertFailures)+'</span>'+
	                                ', and <span style="color:'+brightPurple+'">'+exceptions+' exception'+utils.plural(exceptions)+'</span>'+
	                                '. <span style="color: '+white+'">Took '+durationText+".</span>"+
	                            '</div>'+
	                       '</div>'+
	
	                       '<script>;('+initTestGroup+')("'+mainId+'", "'+bgcolor+'", '+show+')</script>'+
	                       '</div>'
	
	            } else {
	                var n = getNewNumber()
	
	                var testId = mainId+n
	
	                var initTest = function(mainId, bgcolor, show, n) {
	                    $(function()
	                    {	$('#'+mainId).css({borderColor:bgcolor});
	                        TestDisplayer.onToggle(show, bgcolor, '#'+mainId+n+'_inner', '#'+mainId+n);
	
	                        $('.'+mainId+n+'_status').click(function()
	                        {	TestDisplayer.onToggle
	                            (	$('#'+mainId+n+'_inner').css("display") == "none",
	                                bgcolor,
	                                '#'+mainId+n+'_inner',
	                                '#'+mainId+n+''
	                            );
	                        });
	                    });
	                }
	
	                if(!name) name = "<unnamed test>"
	
	                return '<div class="resultsArea" id="'+mainId+n+'">'+
	                            '<div class="resultsBar link '+mainId+n+'_status" style="background-color:'+bgcolor+';color:'+foregroundColor+'">'+
	                                name+': &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+
	                                testSuccesses+'/'+total+" and "+exceptions+" exception"+utils.plural(exceptions)
	                                +' <span style="color: white">took '+durationText+'</span>'+
	                            '</div>'+
	                            '<div class="resultsAreaInner" id="'+testId+'_inner">'+
	                                '<h2 class="'+testId+'_status link" style="color:'+bgcolor+';">'+name+'</h2>'+
	                                testResults.join('\n')+"\n"+
	                                exceptionResults.join('\n')+"\n"+
	                            '</div>'+
	                            '<script>;('+initTest+')("'+mainId+'", "'+bgcolor+'", '+show+', '+n+')</script>'+
	                      '</div>';
	            }
	        },
	        assert: function(result) {
	            if(false === result.success) {
	                var color = red;
	                var word = "Fail:";
	            } else {
	                var color = green;
	                var word = "Ok!";
	            }
	
	            var linesDisplay = "<i>"+utils.textToHtml(result.sourceLines)+"</i>";
	            if(result.sourceLines.indexOf("\n") !== -1) {
	                linesDisplay = "<br>\n"+linesDisplay;
	            }
	
	            var expectations = ""
	            if(!result.success && (result.actual !== undefined || result.expected !== undefined)) {
	                var things = []
	                if(result.expected !== undefined)
	                    things.push("Expected "+utils.textToHtml(utils.valueToMessage(result.expected)))
	                if(result.actual !== undefined)
	                    things.push("Got "+utils.textToHtml(utils.valueToMessage(result.actual)))
	
	                expectations = " - "+things.join(', ')
	            }
	
	            var column = ''
	            if(result.column !== undefined) {
	                column = ":"+result.column
	            }
	
	            return '<div style="color:'+color+';"><span >'+word+'</span>'+
	                        " <span class='locationOuter'>[<span class='locationInner'>"
	                                +result.file+" line <span class='lineNumber'>"+result.line+"</span>"+column+"</span>]"
	                        +"</span> "
	                    +linesDisplay
	                    +' <span class="expectations">'+expectations+'</span>'
	            +"</div>"
	        },
	        exception: function(exception) {
	            var formattedException = utils.textToHtml(utils.errorToString(exception))
	            return '<div style="color:'+purple+';">Exception: '+formattedException+'</div>'
	        },
	        log: function(values) {
	            return '<div>'
	                +values.map(function(v) {
	                    return utils.textToHtml(utils.valueToString(v))
	                }).join(', ')
	            +'</div>'
	
	        }
	    })
	
	    return formattedTestHtml.then(function(formattedHtml) {
	        return Future('<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>'+
	        '<style>\
	            body{\
	                background-color: '+black+';\
	                color: '+white+';\
	            }\
	            h2{\
	                margin-bottom: 5px;\
	                margin-top: 10px;\
	            }\
	            .green\
	            {   color: '+green+';\
	            }\
	            .link\
	            {   cursor:pointer;\
	            }\
	            .primaryTitle {\
	                color: '+blue+';\
	            }\
	            .testResultsName {\
	                color: '+brightBlue+';\
	            }\
	            .asyncTime {\
	                color: '+gray+';\
	            }\
	            .resultsArea{\
	                margin:1px;\
	                margin-bottom: 5px;\
	            }\
	                .resultsAreaInner{\
	                    padding:0 8px;\
	                }\
	                .resultsBar{\
	                    color:white;\
	                    margin-bottom:4px;\
	                    padding: 1px 3px;\
	                }\
	            .testResultsArea{\
	                padding:0 8px;\
	            }\
	            .testResultsBar{\
	                background-color:'+black+';color:white;margin:4px 0;\
	            }\
	                .testResultsBarInner{\
	                    color:white;margin:1px;padding: 1px 3px;\
	                }\
	                \
	            .locationOuter{\
	                color:'+white+';\
	            }\
	            .locationInner, .expectations {\
	                color:'+gray+';\
	            }\
	            .lineNumber{\
	                color:'+white+';\
	            }\
	         </style>'+
	        '<script type="text/javascript">                      \
	             var TestDisplayer = ('+getTestDisplayer+')() \
	          </script>'
	        +formattedHtml)
	    })
	}
	
	var nextId = 0
	var getMainId = function(name) {
	    nextId++
	    return 'unitTest_'+nextId//+name.replace(/[^a-zA-Z]/g, "") // get rid of all characters except letters
	}
	var getNewNumber = function() {
	    getNewNumber.n++
	    return getNewNumber.n
	}
	getNewNumber.n = 0
	


/***/ },
/* 2 */
/*!******************************!*\
  !*** ./deadunit.internal.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	module.exports = function(options) {
	    var exports = {}
	
	    var deadunitCore = options.deadunitCore
	    var proto = __webpack_require__(/*! proto */ 8)
	
	    var defaultFormats = __webpack_require__(/*! ./defaultFormats */ 1)
	    exports.format = __webpack_require__(/*! ./basicFormatter */ 11)
	
	    exports.error = deadunitCore.error
	
	    exports.test = proto(deadunitCore.test, function() {
	        this.string = function() {
	            return defaultFormats.text(this, undefined, /*printOnTheFly=*/false, /*printLateEvents=*/false)
	        }
	
	        this.html = function() {
	            return defaultFormats.html(this, false)
	        }
	
	        this.results = function() {
	            arguments[0] = false
	            return deadunitCore.test.results.apply(this, arguments)
	        }
	
	        options.environmentSpecificMethods.call(this)
	    })
	
	    return exports
	}
	


/***/ },
/* 3 */
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/***/ function(module, exports, __webpack_require__) {

	
	var util = __webpack_require__(/*! util */ 13)
	
	exports.plural = function (num, plural, singular) {
		var plur = num!==1;
	
	    if(singular === undefined) {
	    	if(plur)	return "s"
	        else        return ""
	    } else {
	    	if(plur)	return plural
	        else		return singular
	    }
	}
	
	
	exports.textToHtml = function(text) {
	    return htmlEscape(text)
	            .replace(/ /g, '&nbsp;')
	            .replace(/\n/g, "<br>\n")
	            .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
	}
	
	exports.timeText = function (ms) {
	    if(ms < 2000)
	        return ms+"ms"
	    else
	        return Number(ms/1000).toPrecision(3)+'s'
	}
	
	
	exports.valueToMessage = function(value) {
	    if(value instanceof Error) {
	        return exports.errorToString(value)
	    } else {
	        return prettyPrint(value)
	    }
	}
	
	exports.errorToString = function(err) {
	    if(err instanceof Error) {
	        var otherProperties = []
	        for(var n in err) {
	            if(Object.hasOwnProperty.call(err, n) && n !== 'message' && n !== 'stack') {
	                otherProperties.push(exports.valueToString(err[n]))
	            }
	        }
	
	        var properties = ''
	        if(otherProperties.length > 0)
	            properties = '\n'+otherProperties.join("\n")
	
	
	        if(err.stack !== undefined) {
	            if(err.stack.indexOf(err.message) !== -1) { // chrome
	                return err.stack+properties
	            } else { // firefox (others?)
	                return err.message+'\n'+err.stack+properties
	            }
	        } else {
	            return err.toString()+properties
	        }
	    } else {
	        return err
	    }
	}
	
	exports.valueToString = function(v) {
	    if(v instanceof Error) {
	        return exports.errorToString(v)
	
	    } else if(typeof(v) === 'string') {
	        return v
	    } else {
	        return prettyPrint(v)
	    }
	}
	
	function prettyPrint(value) {
	    try {
	        return util.inspect(value)       // I've seen this throw an error if the value contains a radio button dom object
	    } catch(e) {
	        console.log(e)
	        return "<error printing value>"
	    }
	}
	
	
	function htmlEscape(str) {
	    return String(str)
	            .replace(/&/g, '&amp;')
	            .replace(/"/g, '&quot;')
	            .replace(/'/g, '&#39;')
	            .replace(/</g, '&lt;')
	            .replace(/>/g, '&gt;')
	}

/***/ },
/* 4 */
/*!**********************************!*\
  !*** ./~/blocks.js/Container.js ***!
  \**********************************/
/***/ function(module, exports, __webpack_require__) {

	// This file just contains a proxies to the actual source file, so that you can access standard blocks via require('blocks/Container')
	module.exports = __webpack_require__(/*! ./src/~/Components/Container */ 16)

/***/ },
/* 5 */
/*!*****************************!*\
  !*** ./~/blocks.js/Text.js ***!
  \*****************************/
/***/ function(module, exports, __webpack_require__) {

	// This file just contains a proxies to the actual source file, so that you can access standard blocks via require('blocks/Text')
	module.exports = __webpack_require__(/*! ./src/~/Components/Text */ 17)

/***/ },
/* 6 */
/*!******************************!*\
  !*** ./~/blocks.js/Block.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	// This file just contains a proxies to the actual source file, so that you can access standard blocks via require('blocks/Select')
	module.exports = __webpack_require__(/*! ./src/~/Block */ 15)

/***/ },
/* 7 */
/*!******************************!*\
  !*** ./~/blocks.js/Style.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	// This file just contains a proxies to the actual source file, so that you can access standard blocks via require('blocks/Select')
	module.exports = __webpack_require__(/*! ./src/~/Style */ 14)

/***/ },
/* 8 */
/*!**************************!*\
  !*** ./~/proto/proto.js ***!
  \**************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var noop = function() {}
	
	var prototypeName='prototype', undefined, protoUndefined='undefined', init='init', ownProperty=({}).hasOwnProperty; // minifiable variables
	function proto() {
	    var args = arguments // minifiable variables
	
	    if(args.length == 1) {
	        var parent = {init: noop}
	        var prototypeBuilder = args[0]
	
	    } else { // length == 2
	        var parent = args[0]
	        var prototypeBuilder = args[1]
	    }
	
	    // special handling for Error objects
	    var namePointer = {}    // name used only for Error Objects
	    if([Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError].indexOf(parent) !== -1) {
	        parent = normalizeErrorObject(parent, namePointer)
	    }
	
	    // set up the parent into the prototype chain if a parent is passed
	    var parentIsFunction = typeof(parent) === "function"
	    if(parentIsFunction) {
	        prototypeBuilder[prototypeName] = parent[prototypeName]
	    } else {
	        prototypeBuilder[prototypeName] = parent
	    }
	
	    // the prototype that will be used to make instances
	    var prototype = new prototypeBuilder(parent)
	    namePointer.name = prototype.name
	
	    // if there's no init, assume its inheriting a non-proto class, so default to applying the superclass's constructor.
	    if(!prototype[init] && parentIsFunction) {
	        prototype[init] = function() {
	            parent.apply(this, arguments)
	        }
	    }
	
	    // constructor for empty object which will be populated via the constructor
	    var F = function() {}
	        F[prototypeName] = prototype    // set the prototype for created instances
	
	    var constructorName = prototype.name?prototype.name:''
	    if(prototype[init] === undefined || prototype[init] === noop) {
	        var ProtoObjectFactory = new Function('F',
	            "return function " + constructorName + "(){" +
	                "return new F()" +
	            "}"
	        )(F)
	    } else {
	        // dynamically creating this function cause there's no other way to dynamically name a function
	        var ProtoObjectFactory = new Function('F','i','u','n', // shitty variables cause minifiers aren't gonna minify my function string here
	            "return function " + constructorName + "(){ " +
	                "var x=new F(),r=i.apply(x,arguments)\n" +    // populate object via the constructor
	                "if(r===n)\n" +
	                    "return x\n" +
	                "else if(r===u)\n" +
	                    "return n\n" +
	                "else\n" +
	                    "return r\n" +
	            "}"
	        )(F, prototype[init], proto[protoUndefined]) // note that n is undefined
	    }
	
	    prototype.constructor = ProtoObjectFactory;    // set the constructor property on the prototype
	
	    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
	    for(var n in prototype) {
	        addProperty(ProtoObjectFactory, prototype, n)
	    }
	
	    // add properties from parent that don't exist in the static class object yet
	    for(var n in parent) {
	        if(ownProperty.call(parent, n) && ProtoObjectFactory[n] === undefined) {
	            addProperty(ProtoObjectFactory, parent, n)
	        }
	    }
	
	    ProtoObjectFactory.parent = parent;            // special parent property only available on the returned proto class
	    ProtoObjectFactory[prototypeName] = prototype  // set the prototype on the object factory
	
	    return ProtoObjectFactory;
	}
	
	proto[protoUndefined] = {} // a special marker for when you want to return undefined from a constructor
	
	module.exports = proto
	
	function normalizeErrorObject(ErrorObject, namePointer) {
	    function NormalizedError() {
	        var tmp = new ErrorObject(arguments[0])
	        tmp.name = namePointer.name
	
	        this.message = tmp.message
	        if(Object.defineProperty) {
	            /*this.stack = */Object.defineProperty(this, 'stack', { // getter for more optimizy goodness
	                get: function() {
	                    return tmp.stack
	                }
	            })
	        } else {
	            this.stack = tmp.stack
	        }
	
	        return this
	    }
	
	    var IntermediateInheritor = function() {}
	        IntermediateInheritor.prototype = ErrorObject.prototype
	    NormalizedError.prototype = new IntermediateInheritor()
	
	    return NormalizedError
	}
	
	function addProperty(factoryObject, prototype, property) {
	    try {
	        var info = Object.getOwnPropertyDescriptor(prototype, property)
	        if(info.get !== undefined || info.get !== undefined && Object.defineProperty !== undefined) {
	            Object.defineProperty(factoryObject, property, info)
	        } else {
	            factoryObject[property] = prototype[property]
	        }
	    } catch(e) {
	        // do nothing, if a property (like `name`) can't be set, just ignore it
	    }
	}

/***/ },
/* 9 */
/*!***************************************!*\
  !*** ./~/async-future/asyncFuture.js ***!
  \***************************************/
[103, 25],
/* 10 */
/*!*****************************************************!*\
  !*** ./~/deadunit-core/src/deadunitCore.browser.js ***!
  \*****************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var deadunitCore = __webpack_require__(/*! ./deadunitCore */ 18)
	var browserConfig = __webpack_require__(/*! ./deadunitCore.browserConfig */ 19)
	
	module.exports = deadunitCore(browserConfig())

/***/ },
/* 11 */
/*!***************************!*\
  !*** ./basicFormatter.js ***!
  \***************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var Future = __webpack_require__(/*! async-future */ 9)
	
	// built in test formatting helper
	module.exports = function(unitTest, printOnTheFly/*, [consoleColors,] format*/) {
	    if(arguments.length === 3) {
	        var format = arguments[2]
	    } else /* if(arguments.length > 3) */{
	        var color = arguments[2]
	        var format = arguments[3]
	    }
	
	    var dotText = '.'
	    if(color !== undefined) {
	        dotText = color.green('.')
	    }
	
	    var result = new Future
	
	    var lastPrintWasDot = false
	    var printDot = function(dot) {
	        if(dot) {
	            process.stdout.write(dotText)
	        } else if(lastPrintWasDot) {
	            process.stdout.write('\n')
	        }
	
	        lastPrintWasDot = dot
	    }
	
	    var ended = false
	    var events = {
	        end: function(e) {
	            ended = true
	            if(printOnTheFly) printDot(false)
	
	            var results = unitTest.results()
	            result.return(formatGroup(results, format, 0).result)
	
	            if(format.end !== undefined)
	                format.end()
	        }
	    }
	
	    if(printOnTheFly) {
	        var groups = {}
	        events.assert = function(e) {
	            printDot(e.success && !ended)
	            if(e.success) {
	                groups[e.parent].testSuccesses++
	                groups[e.parent].assertSuccesses++
	            } else {
	                groups[e.parent].testFailures++
	                groups[e.parent].assertFailures++
	            }
	
	            if(!e.success || ended) {
	                console.log(format.assert(e, undefined, true))
	            }
	        }
	        events.exception = function(e) {
	            printDot(false)
	            groups[e.parent].exceptions++
	
	            console.log(format.exception(e.error, true))
	        }
	        events.log = function(e) {
	            printDot(false)
	            console.log(format.log(e.values, true))
	        }
	        events.group = function(g) {
	            groups[g.id] = {parent: g.parent, name: g.name, testSuccesses: 0, testFailures: 0, assertSuccesses: 0, assertFailures: 0, exceptions: 0}
	        }
	        events.groupEnd = function(g) {
	            var parent = groups[g.id].parent
	            if(parent !== undefined) {
	                printDot(false)
	                if(groups[g.id].testFailures === 0 && groups[g.id].assertFailures === 0 && groups[g.id].exceptions === 0) {
	                    groups[parent].testSuccesses++
	                } else {
	                    groups[parent].testFailures++
	                }
	
	                console.log(format.group(groups[g.id].name, undefined, groups[g.id].testSuccesses,groups[g.id].testFailures,groups[g.id].assertSuccesses,groups[g.id].assertFailures,
	                                        groups[g.id].exceptions, [], [], 1, false, true))
	            }
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
	
	            results.push(format.assert(result, testResults.name, false))
	
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
	            results.push(format.log(result.values, false))
	        } else {
	            throw new Error("Unknown result type: "+result.type)
	        }
	    })
	
	    var exceptionResults = []
	    testResults.exceptions.forEach(function(e) {
	        exceptionResults.push(format.exception(e, false))
	    })
	
	    exceptions+= testResults.exceptions.length
	
	    var formattedGroup = format.group(testResults.name, testResults.duration,
	                                      testCaseSuccesses, testCaseFailures,
	                                      assertSuccesses, assertFailures, exceptions,
	                                      results, exceptionResults, nestingLevel, testResults.timeout, false)
	    return {result: formattedGroup,
	            successes: testCaseSuccesses,
	            failures: testCaseFailures,
	            assertSuccesses: assertSuccesses,
	            assertFailures: assertFailures,
	            exceptions: exceptions
	    }
	}
	
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! (webpack)/~/node-libs-browser/~/process/browser.js */ 20)))

/***/ },
/* 12 */
/*!*******************!*\
  !*** ./indent.js ***!
  \*******************/
/***/ function(module, exports, __webpack_require__) {

	
	module.exports = function(i, str) {
	    return i+str.split("\n")       // get all lines
	              .join("\n"+i)      // join all lines with an indent
	}

/***/ },
/* 13 */
/*!****************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/util/util.js ***!
  \****************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }
	
	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};
	
	
	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }
	
	  if (process.noDeprecation === true) {
	    return fn;
	  }
	
	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }
	
	  return deprecated;
	};
	
	
	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};
	
	
	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;
	
	
	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};
	
	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};
	
	
	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];
	
	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}
	
	
	function stylizeNoColor(str, styleType) {
	  return str;
	}
	
	
	function arrayToHash(array) {
	  var hash = {};
	
	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });
	
	  return hash;
	}
	
	
	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }
	
	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }
	
	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);
	
	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }
	
	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }
	
	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }
	
	  var base = '', array = false, braces = ['{', '}'];
	
	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }
	
	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }
	
	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }
	
	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }
	
	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }
	
	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }
	
	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }
	
	  ctx.seen.push(value);
	
	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }
	
	  ctx.seen.pop();
	
	  return reduceToSingleString(output, base, braces);
	}
	
	
	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}
	
	
	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}
	
	
	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}
	
	
	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }
	
	  return name + ': ' + str;
	}
	
	
	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);
	
	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }
	
	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}
	
	
	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;
	
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;
	
	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;
	
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;
	
	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;
	
	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;
	
	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	
	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;
	
	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;
	
	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;
	
	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;
	
	exports.isBuffer = __webpack_require__(/*! ./support/isBuffer */ 21);
	
	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	
	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}
	
	
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];
	
	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}
	
	
	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};
	
	
	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(/*! inherits */ 32);
	
	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;
	
	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};
	
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(/*! (webpack)/~/node-libs-browser/~/process/browser.js */ 20)))

/***/ },
/* 14 */
/*!************************************!*\
  !*** ./~/blocks.js/src/~/Style.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	var jssModule = __webpack_require__(/*! ../external/jss */ 26)
	var proto = __webpack_require__(/*! proto */ 8)
	var HashMap = __webpack_require__(/*! hashmap */ 34)
	
	var utils = __webpack_require__(/*! ./utils */ 22)
	var blockStyleUtils = __webpack_require__(/*! ./blockStyleUtils */ 24)
	
	var baseClassName = '_ComponentStyle_' // the base name for generated class names
	var nextClassNumber = 0
	
	// creates a style object
	var Style = module.exports = proto(function() {
	
	    this.defaultClassName = '_default_'     // the name of the default class (used to prevent style inheritance)
	
	    // styleDefinition is an object where key-value pairs can be any of the following:
	    // <cssPropertyName>: the value should be a valid css value for that style attribute
	    // <ComponentName>: the value can either be a Style object or a nested styleDefinition object
	    // $setup: the value is a function to be run on a component when the style is applied to it
	    // $kill: the value is a function to be run on a component when a style is removed from it
	    // $state: the value should be a state handler function
	    // $<label>: the value should be a nested styleDefinition object that does not contain any label styles.
	    this.init = function(styleDefinition, privateOptions) {
	        if(privateOptions === undefined) privateOptions = {}
	        if(privateOptions.inLabel===undefined) inLabel = false
	
	        this.className = baseClassName+nextClassNumber
	        nextClassNumber++
	
	        this.componentStyleMap = {}
	        this.labelStyleMap = {}
	
	        var labelStyles = {}
	        var pseudoClassStyles = {}
	        var cssProperties = {}
	        for(var key in styleDefinition) {
	            var value = styleDefinition[key]
	
	            if(key === '$setup') {
	                if(!(value instanceof Function)) throw new Error("$setup key must be a function ('setup' can't be used as a label)")
	                this.setup = value
	
	            } else if(key === '$kill') {
	                if(!(value instanceof Function)) throw new Error("$kill key must be a function ('kill' can't be used as a label)")
	                this.kill = value
	
	            } else if(key === '$state') {
	                if(!(value instanceof Function)) throw new Error("$state key must be a function ('$state' can't be used as a label)")
	                this.stateHandler = value
	
	            } else if(key.indexOf('$$') === 0) { // pseudo-class style
	                var pseudoClass = mapCamelCase(key.substr(2))
	                if(pseudoClass === '') {
	                    throw new Error("Empty pseudo-class name not valid (style key '$$')")
	                }
	
	                utils.merge(pseudoClassStyles, flattenPseudoClassStyles(pseudoClass, value))
	
	            } else if(key.indexOf('$') === 0) {   // label style
	                if(privateOptions.inLabel)
	                    throw new Error("Can't create nested label style "+key+" because components can only have one label")
	
	                var label = key.substr(1)
	                if(label === '') {
	                    throw new Error("Empty label name not valid (style key '$')")
	                }
	
	                labelStyles[label] = value
	
	            } else if(isStyleObject(value)) {
	                this.componentStyleMap[key] = value
	
	            } else if(value instanceof Object) {
	                this.componentStyleMap[key] = Style(value)  // turn the object description into a full fledged style object
	            } else {
	                var cssStyle = key
	                var cssStyleName = mapCamelCase(cssStyle)
	                cssProperties[cssStyleName] = cssValue(cssStyleName, value)
	            }
	        }
	
	        // create the css class
	        if(privateOptions.default) {
	            var jssSheet = defaultJss
	        } else {
	            var jssSheet = jss
	        }
	
	        jssSheet.set('.'+this.className, cssProperties)
	
	        //if(module.exports.isDev) {
	            this.styleDefinitions = {}
	            this.styleDefinitions['.'+this.className] = cssProperties
	        //}
	
	        // create label styles
	        if(Object.keys(labelStyles).length > 0) {
	            var baseStyle = utils.merge({}, cssProperties, this.componentStyleMap)
	
	            for(var label in labelStyles) {
	                if(isStyleObject(labelStyles[label])) {
	                    this.labelStyleMap[label] = labelStyles[label]
	                } else {
	                    var mergedStyle = utils.merge({}, baseStyle, labelStyles[label])
	                    this.labelStyleMap[label] = Style(mergedStyle, {inLabel:true})
	                }
	            }
	        }
	
	        // create pseudoclass styles
	        if(Object.keys(pseudoClassStyles).length > 0) {
	
	            var tieredPseudoClasses = createTieredPseudoClasses(this, pseudoClassStyles)
	            pseudoclassCombinations(tieredPseudoClasses) // mutates tieredPseudoClasses
	
	            // turn the emulatable pseudo classes into Style objects
	            // also build up the set of psuedoclasses that will be emulated
	            // also build up a map of pseudoclasses-to-emulate to the emulation functions for those pseudoclasses
	            var pseudoClasesToEmulate = []
	            var preSplitPseudoClasses = [] // a list where each element looks like: [pseudoClassList, styleObject]  (this is primarily for performance - so we don't have to split the key every time we check for state changes)
	            var pseudoClassesToEmulationInfo = {}
	            for(var key in tieredPseudoClasses) {
	                if(isStyleObject(tieredPseudoClasses[key])) {
	                    tieredPseudoClasses[key] = tieredPseudoClasses[key]
	                } else {
	                    var newStyle = Style(utils.merge({}, cssProperties, tieredPseudoClasses[key])) // pseudoClassStyles merged with parent css styles
	
	                    // merge in componentStyleMap and labelStyleMap
	                    for(var k in this.componentStyleMap) {
	                        if(newStyle.componentStyleMap[k] === undefined)
	                            newStyle.componentStyleMap[k] = this.componentStyleMap[k]
	                    }
	                    for(var k in this.labelStyleMap) {
	                        if(newStyle.labelStyleMap[k] === undefined)
	                            newStyle.labelStyleMap[k] = this.labelStyleMap[k]
	                    }
	
	                    tieredPseudoClasses[key] = newStyle
	                }
	
	
	                var pseudoClassList = key.split(":")
	                for(var n=0; n<pseudoClassList.length; n++) {
	                    var pseudoClass = pseudoClassList[n]
	                    if(pseudoClasesToEmulate.indexOf(pseudoClass) === -1) {
	                        pseudoClasesToEmulate.push(pseudoClass)
	
	                        var pseudoClassParts = getPseudoClassParts(pseudoClass)
	                        var fns = emulatedPseudoClasses[pseudoClassParts.class]
	                        var info = {fns: fns}
	                        if(fns.processParameter !== undefined) {
	                            info.parameter = fns.processParameter(pseudoClassParts.parameter)
	                        }
	                        pseudoClassesToEmulationInfo[pseudoClass] = info
	                    }
	                }
	
	                preSplitPseudoClasses.push([pseudoClassList, tieredPseudoClasses[key]])
	            }
	
	            // create functions that initialize and keep track of state
	            var initializeState = function(component) {
	                var state = {}
	                for(var n=0; n<pseudoClasesToEmulate.length; n++) {
	                    var pseudoClass = pseudoClasesToEmulate[n]
	                    var pseudoClassEmulationInfo = pseudoClassesToEmulationInfo[pseudoClass]
	                    state[pseudoClass] = pseudoClassEmulationInfo.fns.check(component, pseudoClassEmulationInfo.parameter)
	                }
	
	                return state
	            }
	
	            var that = this
	            var changeStyleIfNecessary = function(currentStyle, component, state) {
	                var longestMatchingLength = 0;
	                var mostSpecificMatchingStyle = that; // if nothing else matches, change back to the base style object
	                for(var n=0; n<preSplitPseudoClasses.length; n++) {
	                    var pseudoClassList = preSplitPseudoClasses[n][0]
	                    for(var j=0; j<pseudoClassList.length; j++) {
	                        if(!state[pseudoClassList[j]]) {
	                            break;
	                        }
	                    }
	
	                    if(j === pseudoClassList.length && j > longestMatchingLength) {
	                        longestMatchingLength = j
	                        mostSpecificMatchingStyle = preSplitPseudoClasses[n][1]
	                    }
	                }
	
	                if(mostSpecificMatchingStyle !== currentStyle) {
	                    component.style = mostSpecificMatchingStyle
	
	                    //blockStyleUtils.setCurrentStyle(component, mostSpecificMatchingStyle)
	                    //blockStyleUtils.propogateStyleSet(component.children, component.computedStyleMap) // propogate styles to children
	                }
	            }
	
	            // setup pseudoclass emulation with $setup and $kill handlers
	
	            var wrapSetupAndKill = function(style) {
	                var originalSetup = style.setup
	                style.setup = function(component) {
	                    var that = this
	
	                    this._styleSetupStates = {} // maps pseudoClass to setupState
	                    var state = initializeState(component)
	                    for(var pseudoClass in pseudoClassesToEmulationInfo) {
	                        ;(function(pseudoClass, emulationInfo){   // close over those variables (so they keep the value they had when the function was setup)
	                            that._styleSetupStates[pseudoClass] = emulationInfo.fns.setup(component, function() { // start
	                                state[pseudoClass] = true
	                                changeStyleIfNecessary(that, component, state)
	                            }, function() { // end
	                                state[pseudoClass] = false
	                                changeStyleIfNecessary(that, component, state)
	                            }, emulationInfo.parameter)
	
	                        })(pseudoClass, pseudoClassesToEmulationInfo[pseudoClass])
	                    }
	
	                    changeStyleIfNecessary(that, component, state)
	
	                    if(originalSetup !== undefined) {
	                        originalSetup.apply(this, arguments)
	                    }
	                }
	
	                var originalKill = style.kill
	                style.kill = function(component) {
	                    for(var pseudoClass in pseudoClassesToEmulationInfo) {
	                        var emulationInfo = pseudoClassesToEmulationInfo[pseudoClass]
	                        emulationInfo.fns.kill(component, this._styleSetupStates[pseudoClass])
	                    }
	
	                    if(originalKill !== undefined) {
	                        originalKill.apply(this, arguments)
	                    }
	                }
	            }
	
	            // wrap all the setup and kill functions
	
	            for(var key in tieredPseudoClasses) {
	                var style = tieredPseudoClasses[key]
	                wrapSetupAndKill(style)
	            }
	
	            wrapSetupAndKill(this)
	        }
	    }
	
	    // instance properties
	
	    this.className          // the css classname for this style
	    this.componentStyleMap; // maps a Component name to a Style object for that component
	    this.labelStyleMap;     // maps a label name to a Style object for that label
	    this.setup;             // run some javascript on any element this class is applied to
	    this.kill;              // a function to run on removal of the style (should reverse setup)
	
	    // gets the style object for a component based on the current style object (takes into account whether the component has a label
	    this.get = function(component) {
	        if(component.label !== undefined) {
	            var labelStyle = this.labelStyleMap[component.label]
	            if(labelStyle !==  undefined) {
	                return labelStyle
	            }
	        }
	        // else
	        return this
	    }
	})
	
	
	// private
	
	
	// returns a two-level map where the top-level keys are emulatable psuedo classes, and non-emulatable pseudo classes are at the second level
	// the classes will also be sorted and deduped
	// Example return value: {"hover:lastChild": {color:'red', "$$visited:disabled": {fontWeight: 'bold'}}, }
	// parameters:
	    // style - the style object being created
	    // pseudoClassStyles - a flat object where each key is a list of pseudoclasses separated by colons (e.g. "hover" or "hover:focus") and the value is an object of styles that don't contain pseudoclasses
	function createTieredPseudoClasses(style, pseudoClassStyles) {
	    var tieredPseudoClasses = {} // the two-level map
	    for(var key in pseudoClassStyles) {
	        var value = pseudoClassStyles[key]
	
	        // split key into pseudoclass list
	        var pseudoClassList = key.split(":")
	        var emulatablePseudoClasses = []
	        var nonEmulatablePseudoClasses = []
	        for(var n in pseudoClassList) {
	            var pseudoClass = pseudoClassList[n]
	            var pseudoClassParts = getPseudoClassParts(pseudoClass)
	            if(pseudoClassParts.class in emulatedPseudoClasses) {
	                emulatablePseudoClasses.push(pseudoClass)
	            } else {
	                nonEmulatablePseudoClasses.push(pseudoClass)
	            }
	        }
	
	        // todo: add a third branch as an optimization: if the Style can be rendered without emulation - do that
	        if(emulatablePseudoClasses.length === 0) { // if none of the pseudoclasses can be emulated using javascript
	            validatePurePseudoClassStyles(key, value)                        // then validate the value and
	            createPseudoClassRules(style, key, '.'+style.className+":"+key, value)   // create pseudoClassRules
	
	        } else { // if some of the pseudoclasses can be emulated using javascript
	
	            emulatablePseudoClasses.sort()
	            var emulatablePseudoClassKey = emulatablePseudoClasses.join(':')
	            if(tieredPseudoClasses[emulatablePseudoClassKey] === undefined)
	                tieredPseudoClasses[emulatablePseudoClassKey] = {}
	
	            if(nonEmulatablePseudoClasses.length === 0) {
	                utils.merge(tieredPseudoClasses[emulatablePseudoClassKey], value)
	            } else {
	                nonEmulatablePseudoClasses.sort()
	                var nonEmulatablePsuedoClassKey = nonEmulatablePseudoClasses.join(':')
	
	                var secondTier = {}
	                secondTier['$$'+nonEmulatablePsuedoClassKey] = value
	
	                utils.merge(tieredPseudoClasses[emulatablePseudoClassKey], secondTier)
	            }
	        }
	    }
	
	    return tieredPseudoClasses
	}
	
	
	
	// make combinations of the emulatable pseudoclasses, so that they combine like the non-emulated ones do
	// info about mathematical combination: https://en.wikipedia.org/wiki/Combination
	// mutates tieredPseudoClasses
	function pseudoclassCombinations(tieredPseudoClasses) {
	    var tieredPseudoClassesKeys = Object.keys(tieredPseudoClasses).reverse().map(function(v) {    // reverse first so that more specific pseudoclasses go first
	        return {key: v, parts: v.split(':')} // so it doesn't have to split every time
	    })
	
	    for(var n=0; n<tieredPseudoClassesKeys.length; n++) {
	        var keyA = tieredPseudoClassesKeys[n]
	        for(var k=2; k <= tieredPseudoClassesKeys.length; k++) { // k is the number of psuedoclasses to combine
	            for(var j=n+1; j<tieredPseudoClassesKeys.length-(k-2); j++) {
	                var result = combinePseudoclasses(tieredPseudoClasses, [keyA].concat(tieredPseudoClassesKeys.slice(j, k)))
	                if(result.key in tieredPseudoClasses) {
	                    utils.merge(tieredPseudoClasses[result.key], result.value)
	                } else { // new key
	                    tieredPseudoClasses[result.key] = result.value
	                }
	            }
	        }
	    }
	}
	
	
	
	// keys is a list of objects where each object has the members:
	    // key - the original string key
	    // parts - the key split by ":"
	// returns an object with the following members:
	    // key - the new combined key
	    // value - the new merged value
	var combinePseudoclasses = function(pseudoclasses, keys) {
	    var resultKeyParts = keys[0].parts
	    var resultValue = utils.merge({}, pseudoclasses[keys[0].key]) // make a copy
	    for(var n=1; n<keys.length; n++) {
	        var key = keys[n]
	        // merge all psuedoclasses that don't already exist into the resultKey
	        for(var j=0; j<key.parts.length; j++) {
	            var part = key.parts[j]
	            if(resultKeyParts.indexOf(part) === -1) {
	                resultKeyParts.push(part)
	            }
	        }
	
	        // merge the value into resultValue
	        utils.merge(resultValue, pseudoclasses[key.key])
	    }
	
	    return {key: resultKeyParts.join(':'), value: resultValue}
	}
	
	// a map of pseudoclass names and how they are emulated with javascript
	// each pseudoclass sets up the following functions:
	    // check - a function that checks if that pseudoclass currently applies to the component when its called
	    // setup - calls a callback when the pseudoClass starts and stops applying
	        // should return an object that will be passed to the kill function (as its 'state' parameter)
	    // kill - cleans up anything set up in the 'setup' function
	    // processParameter - takes the pseudoclass parameter and returns some object representing it that will be used by the setup and check functions
	var emulatedPseudoClasses = {
	    hover: {
	        check: function(component) {
	            var nodes = document.querySelectorAll( ":hover" )
	            for(var n=0; n<nodes.length; n++) {
	                if(nodes[n] === component.domNode) {
	                    return true
	                }
	            }
	            return false
	        },
	        setup: function(component, startCallback, endCallback) {
	            component.on("mouseover", function() {
	                startCallback()
	            })
	            component.on("mouseout", endCallback)
	
	            return {start: startCallback, end: endCallback}
	        },
	        kill: function(component, state) {
	            component.off("mouseover", state.start)
	            component.off("mouseout", state.end)
	        }
	    },
	    checked: {
	        check: function(component) {
	            return component.selected
	        },
	        setup: function(component, startCallback, endCallback) {
	            var setupState = {}
	            component.on("change", setupState.listener = function() {
	                if(component.selected) {
	                    startCallback()
	                } else {
	                    endCallback()
	                }
	            })
	
	            return setupState
	        },
	        kill: function(component, state) {
	            component.removeListener("change", state.listener)
	        }
	    },
	    required: {
	        check: function(component) {
	            return component.attr('required') !== undefined
	        },
	        setup: function(component, startCallback, endCallback) {
	            var observer = new MutationObserver(function() {
	                if(component.attr('required') !== undefined) {
	                    startCallback()
	                } else {
	                    endCallback()
	                }
	            })
	
	            observer.observe(component.domNode, {attributes: true})
	
	            return {observer: observer}
	        },
	        kill: function(component, state) {
	            state.observer.disconnect()
	        }
	    },
	    'last-child': {
	        check: function(component) {
	            return nthLastChildCheck(component, '1')
	        },
	        setup: function(component, startCallback, endCallback) {
	            var observer = new MutationObserver(function() {
	                if(nthLastChildCheck(component, '1')) {
	                    startCallback()
	                } else {
	                    endCallback()
	                }
	            })
	
	            var setupObserver = function() {
	                // note that since this uses the component parent rather than domNode.parentNode, this won't work for components added to non-component nodes (and there's no good way to do it, because you would have to poll for parent changes)
	                observer.observe(component.parent.domNode, {childList: true})
	            }
	
	            if(component.parent !== undefined) {
	                setupObserver()
	            }
	
	            component.on('newParent', function() {
	                setupObserver()
	            })
	            component.on('parentRemoved', function() {
	                observer.disconnect()
	            })
	
	            return {observer: observer}
	        },
	        kill: function(component, state) {
	            state.observer.disconnect()
	        }
	    },
	    'nth-child': {
	        // todo: support full an+b parameters for nth-child https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child
	        check: function(component, parameterCheck) {
	            return nthChildCheck(component, parameterCheck)
	        },
	        setup: function(component, startCallback, endCallback, parameterCheck) {
	
	            var checkAndCallCallbacks = function() {
	                if(nthChildCheck(component, parameterCheck)) {
	                    startCallback()
	                } else {
	                    endCallback()
	                }
	            }
	
	            var observer = new MutationObserver(function() {
	                checkAndCallCallbacks()
	            })
	
	            var setupObserver = function() {
	                // note that since this uses the component parent rather than domNode.parentNode, this won't work for components added to non-component nodes (and there's no good way to do it, because you would have to poll for parent changes)
	                observer.observe(component.parent.domNode, {childList: true})
	            }
	
	            if(component.parent !== undefined) {
	                setupObserver()
	            }
	
	            component.on('newParent', function() {
	                setupObserver()
	                checkAndCallCallbacks()
	            })
	            component.on('parentRemoved', function() {
	                observer.disconnect()
	                checkAndCallCallbacks()
	            })
	
	            return {observer: observer}
	        },
	        kill: function(component, state) {
	            state.observer.disconnect()
	        },
	        processParameter: function(parameter) {
	            return nthChildParameterFn(parameter)
	        }
	    },
	
	    // not's parameter is a statement consisting of pseudoclasses separated either by & or ,
	    // $$not(pseudoclass1&pseudoclass2,psuedoclass3) translates to the css :not(:pseudoclass1:pseudoclass2,:psuedoclass3)
	    /*not: {
	        check: function() {
	
	        },
	    }*/
	}
	
	// name is the name of the new pseudoclass
	// fns is an object with the members:
	    // check(component) - returns true if the pseudoclass applies to the component
	    // setup(component, startCallback, endCallback, parameter) - a function that should call startCallback when the pseudoclass starts applying, and endCallback when it stops applying
	        // parameter - the parameter passed to the pseudoclass (e.g. in :not(:first-child), ":first-child" is the parameter)
	    // kill - a function that cleans up any event listeners or anything else set up in the 'setup' function
	module.exports.addPseudoClass = function(name, fns) {
	    if(emulatedPseudoClasses[name] !== undefined) throw new Error("The pseudoclass '"+name+"' is already defined.")
	    // else
	    emulatedPseudoClasses[name] = fns
	}
	
	
	function nthChildCheck(component, testFn) {
	    if(component.domNode.parentNode === null)
	        return false
	
	    var children = component.domNode.parentNode.children                    // must be domNode.parentNode, because child nodes may not be Components
	    var index = Array.prototype.indexOf.call(children, component.domNode)
	    return testFn(index)
	}
	
	function nthLastChildCheck(component, parameter) {
	    if(component.domNode.parentNode === null)
	        return false
	
	    var children = component.domNode.parentNode.children                    // must be domNode.parentNode, because child nodes may not be Components
	    var index = children.length - parseInt(parameter)
	    return children[index] === component.domNode
	}
	
	// returns a function that takes an index and tell you if that index applies to the nthChildParameter
	var nthChildParameter = /^(((-?\d*)(([+-]\d*)n?)?)|((-?\d)*n?([+-]\d*)?))$/
	function nthChildParameterFn(parameter) {
	    var parts = parameter.match(nthChildParameter)
	    if(parts === null)
	        throw new Error("nth-child parameter '"+parameter+"' isn't valid")
	
	    if(parts[2] !== undefined) {
	        var constant = parts[3]
	        var variable = parts[5]
	    } else {
	        var constant = parts[8]
	        var variable = parts[7]
	    }
	
	    if(constant === undefined) constant = 0
	    else                       constant = parseInt(constant)
	    if(variable === undefined) variable = 0
	    else                       variable = parseInt(variable)
	
	    if(variable === 0) {
	        return function(index) {
	            return index+1 === constant
	        }
	    } else {
	        return function(index) {
	            return ((index+1-constant)/variable) % 1 === 0
	        }
	    }
	
	}
	
	// maps a style value to a css value
	// style values that are numbers are mapped to strings, usually with px postfix
	function cssValue(cssStyleName, value) {
	    // If a number was passed in, add 'px' to the (except for certain CSS properties) [also taken from jquery's code]
	    if(typeof(value) === "number" && cssNumber[cssStyleName] === undefined) {
	        return value+"px"
	    } else {
	        return value.toString()
	    }
	}
	
	function createPseudoClassRules(that, pseudoClass, selector, pseudoClassStyle) {
	
	    var pseudoClassCss = {}
	    for(var key in pseudoClassStyle) {
	        var value = pseudoClassStyle[key]
	
	        if(!(value instanceof Object)) {
	            var cssStyle = key
	            var cssStyleName = mapCamelCase(cssStyle)
	            pseudoClassCss[cssStyleName] = cssValue(cssStyleName, value)
	        } else {
	            throw new Error("All properties within the pseudoclasses '"+pseudoClass+"' must be css styles")
	        }
	    }
	
	    // create immediate pseudo class style
	    defaultJss.set(selector, pseudoClassCss) // create the css class with the pseudoClass
	
	    //if(module.exports.isDev) {
	        that.styleDefinitions = {}
	        that.styleDefinitions[selector] = pseudoClassCss
	    //}
	}
	
	// throws exceptions for various style configurations that are unsupported by pure pseudo classes (ones that can't be emulated usuing javascript)
	function validatePurePseudoClassStyles(pseudoClass, pseudoClassStyles) {
	    for(var key in pseudoClassStyles) {
	        var value = pseudoClassStyles[key]
	
	        if(isStyleObject(value)) {
	            throw new Error("Can't set the pseudoclasses '"+pseudoClass+"' to a Style object")
	        } else if(key === '$setup') {
	            throw new Error("$setup can't be used within the pseudoclasses '"+pseudoClass+"'")
	        } else if(key === '$kill') {
	            throw new Error("$kill can't be used within the pseudoclasses '"+pseudoClass+"'")
	        } else if(key.indexOf('$') === 0) {   // label style
	            throw new Error("Block labels can't be used within the pseudoclasses '"+pseudoClass+"'")
	        }
	    }
	}
	
	// e.g. pulls out 'nth-child' and '2+3n' from 'nth-child(2+3n)'
	var pseudoClassRegex = /^([^(]*)(\((.*)\))?$/
	function getPseudoClassParts(fullPsuedoClass) {
	    var x = fullPsuedoClass.match(pseudoClassRegex)
	    if(x === null) throw new Error("Pseudoclass '"+fullPsuedoClass+"' is invalid")
	    return {class: x[1], parameter: x[3]}
	}
	
	
	// takes in a list of pseudoClassRules and changes any nesting like {hover: {focus: {}}} into something like {hover: {}, "hover:focus": {}}
	// also does some validation
	function flattenPseudoClassStyles(pseudoClass, pseudoClassStyle) {
	    var nonPseudoClassStyles = {}
	    var subpseudoClasses = {}
	    for(var key in pseudoClassStyle) {
	        var value = pseudoClassStyle[key]
	
	        if(key.indexOf('$$') === 0) { // pseudo-class style
	            var subPseudoClass = key.substr(2)
	            if(subPseudoClass === '') {
	                throw new Error("Empty pseudo-class name not valid (style key '$$')")
	            }
	
	            subpseudoClasses[subPseudoClass] = value
	        } else {
	            nonPseudoClassStyles[key] = value
	        }
	    }
	
	    // create flattened styles (with merged in styles from its parent pseudoclass
	    var flattenedStyles = {}
	    for(var subPseudoClass in subpseudoClasses) {
	        var value = subpseudoClasses[subPseudoClass]
	
	        if(isStyleObject(value)) {
	            flattenedStyles[pseudoClass+":"+subPseudoClass] =  value
	        } else {
	            utils.merge(flattenedStyles, flattenPseudoClassStyles(pseudoClass+":"+subPseudoClass, utils.merge({}, nonPseudoClassStyles, value)))
	        }
	    }
	
	    // write the top-level pseudoClass
	    flattenedStyles[pseudoClass] = nonPseudoClassStyles
	
	    return flattenedStyles
	}
	
	
	// taken from jquery's code
	var cssNumber = {
	    "column-count": 1,
	    "fill-opacity": 1,
	    "flex-grow": 1,
	    "flex-shrink": 1,
	    "font-weight": 1,
	    "line-height": 1,
	    "opacity": 1,
	    "order": 1,
	    "orphans": 1,
	    "widows": 1,
	    "z-index": 1,
	    "zoom": 1
	}
	
	function isStyleObject(o) {
	    return o.componentStyleMap !== undefined
	}
	
	
	var asciiA = 'A'.charCodeAt(0), asciiZ = 'Z'.charCodeAt(0), difference = 'a'.charCodeAt(0) - asciiA
	function mapCamelCase(cssStyleName) {
	    for(var n=0; n<cssStyleName.length; n++) {
	        var ascii = cssStyleName.charCodeAt(n)
	        if(asciiA <= ascii && ascii <= asciiZ) { // found capital letter
	            cssStyleName = cssStyleName.slice(0, n) + '-'+String.fromCharCode(ascii+difference) + cssStyleName.slice(n+1)
	            n++ // increment a second time for the dash
	        }
	    }
	
	    return cssStyleName
	}
	
	// maps all the styles that are inherited by descendant nodes to their default values
	// source: http://stackoverflow.com/questions/5612302/which-css-styles-are-inherited
	var defaultStyleValues = {
	    'azimuth': 'center',
	    'border-collapse': 'separate',
	    'border-spacing': '0',
	    'caption-side': 'top',
	    //'color': 'black',         // let this inherit
	    //'cursor': 'auto',         // let this one inherit - its weird otherwise
	    'direction': 'ltr',
	     display: 'inline-block', // changes the default display to inline-block
	    'elevation': '',
	    'empty-cells': 'show',
	    // 'font-family': '',       // let this inherit
	    // 'font-size': 'medium',   // let this inherit
	    //'font-style': 'normal',   // let this inherit
	    //'font-variant': 'normal', // let this inherit
	    //'font-weight': 'normal',  // let this inherit
	    'letter-spacing': 'normal',
	    'line-height': 'normal',
	    'list-style-image': 'none',
	    'list-style-position': 'outside',
	    'list-style-type': 'disc',
	    'orphans': '2',
	    'pitch-range': '',
	    'pitch': '',
	     position: 'relative', // changes the default positioning so that absolute is relative to its parent by default
	    'quotes': '',
	    'richness': '',
	    'speak-header': '',
	    'speak-numeral': '',
	    'speak-punctuation': '',
	    'speak': '',
	    'speak-rate': '',
	    'stress': '',
	    'text-align': 'left',
	    'text-indent': '0',
	    'text-transform': 'none',
	    //'visibility': 'visible',    // let this inherit - otherwise you just hide the container and not the contents
	    'voice-family': '',
	    'volume': '',
	    'white-space': 'normal',
	    'widows': '2',
	    'word-spacing': 'normal'
	}
	
	
	
	// returns index of the passed css classname, or undefined if sheet containing that class isn't found
	function cssClassSheetIndex(classname) {
	    var result = undefined
	
	    var styleNodes = document.querySelectorAll("style")
	    for(var n=0; n<styleNodes.length; n++) {
	        var sheet = styleNodes[n].sheet
	        jssModule.defaultSheet = sheet
	
	        var defaultStyleMaybe = jssModule.get(classname)
	        if(Object.keys(defaultStyleMaybe).length > 0) {
	            result = n
	            break
	        }
	    }
	
	    jssModule.defaultSheet = undefined
	    return result
	}
	
	
	var defaultJss = jssModule.forDocument(document) // must be created before the jss object (so that the styles there override the styles in the default sheet)
	var jss = jssModule.forDocument(document)
	
	var defaultClassSheetIndex = cssClassSheetIndex('.'+Style.defaultClassName)
	if(defaultClassSheetIndex === undefined) {
	    defaultJss.defaultSheet = defaultJss._createSheet() // create its sheet first (before the regular jss sheet)
	
	    jss.defaultSheet = jss._createSheet()
	
	    defaultJss.set('.'+Style.defaultClassName, defaultStyleValues) // creates default css class in order to prevent inheritance
	
	    defaultJss.set('input', { // chrome and firefox user agent stylesheets mess with this otherwise
	        cursor: 'inherit'
	    })
	} else {
	    // if the default styleclass *already* exists, it probably means that blocks.js is being loaded twice
	    console.log("Warning: the default-styles class name for blocks.js looks like its already in use. This probably means you have two versions of blocks.js loaded. If so, Blocks.js will continue to work, but your app will be a bit bloated. If something other than block.js created that class, blocks.js may break that style.")
	
	    var styleNodes = document.querySelectorAll("style")
	    defaultJss.defaultSheet = styleNodes[defaultClassSheetIndex].sheet
	    jss.defaultSheet = styleNodes[defaultClassSheetIndex+1].sheet
	
	    // make sure the baseClassName isn't already taken
	    var dedupNumber = 0
	    while(true) {
	        var testBaseClassName = baseClassName+dedupNumber
	        if(cssClassSheetIndex('.'+testBaseClassName+dedupNumber+0) !== undefined) {
	            dedupNumber++
	        } else {
	            break;
	        }
	    }
	
	    baseClassName = testBaseClassName+dedupNumber
	}
	
	
	/*private*/ module.exports.isDev; // should be set by Block
	
	var computedStyles = module.exports.computedStyles = new HashMap() // stores a map from styleMap components, to the combined style map
	


/***/ },
/* 15 */
/*!************************************!*\
  !*** ./~/blocks.js/src/~/Block.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	var EventEmitterB = __webpack_require__(/*! EventEmitterB */ 29)
	var proto = __webpack_require__(/*! proto */ 8);
	var trimArguments = __webpack_require__(/*! trimArguments */ 33)
	var observe = __webpack_require__(/*! observe */ 35)
	
	var utils = __webpack_require__(/*! ./utils */ 22)
	var domUtils = __webpack_require__(/*! ./domUtils */ 23)
	var blockStyleUtils = __webpack_require__(/*! ./blockStyleUtils */ 24)
	
	var Style = __webpack_require__(/*! ./Style */ 14)
	Style.isDev = function() {return module.exports.dev}
	
	var components = {};
	
	var setOfBrowserEvents = utils.arrayToMap([
	    'abort','afterprint','animationend','animationiteration','animationstart','audioprocess','beforeprint','beforeunload',
	    'beginEvent','blocked','blur','cached','canplay','canplaythrough','change','chargingchange','chargingtimechange',
	    'checking','click','close','compassneedscalibration','complete','compositionend','compositionstart','compositionupdate','contextmenu',
	    'copy','cut','dblclick','decivelight','devicemotion','deviceorientation','deviceproximity','dischargingtimechange','DOMContentLoaded',
	    'downloading','drag','dragend','dragenter','dragleave','dragover','dragstart','drop','durationchange','emptied','ended','endEvent',
	    'error','focus','focusin','focusout','fullscreenchange','fullscreenerror','gamepadconnected','gamepaddisconnected','hashchange',
	    'input','invalid','keydown','keypress','keyup','languagechange','levelchange','load','loadeddata','loadedmetadata','loadend',
	    'loadstart','message','mousedown','mouseenter','mouseleave','mousemove','mouseout','mouseover','mouseup','noupdate','obsolete',
	    'offline','online','open','orientationchange','pagehide','pageshow','paste','pause','pointerlockchange','pointerlockerror','play',
	    'playing','popstate','progress','ratechange','readystatechange','repeatEvent','reset','resize','scroll','seeked','seeking','select',
	    'show','stalled','storage','submit','success','suspend','SVGAbort','SVGError','SVGLoad','SVGResize','SVGScroll','SVGUnload','SVGZoom',
	    'timeout','timeupdate','touchcancel','touchend','touchenter','touchleave','touchmove','touchstart','transitionend','unload',
	    'updateready','upgradeneeded','userproximity','versionchange','visibilitychange','volumechange','waiting','wheel'
	])
	
	// events:
	    // newParent - emits this when a component gets a new parent
	    // parentRemoved - emits this when a component is detached from its parent
	var Block = module.exports = proto(EventEmitterB,function(superclass) {
	
	    // static properties
	
	    // constructor
		this.init = function() {
	        var that = this
	
	        if(this.name === undefined) {
	            throw new Error("The 'name' property is required for Blocks")
	        }
	
	        var defaultBlockStyle = blockStyleUtils.defaultStyleMap.get(this.constructor)
	        if(defaultBlockStyle === undefined) {
	            defaultBlockStyle = blockStyleUtils.createDefaultBlockStyle(this)
	        }
	
	        superclass.init.call(this)
	
	        this.children = []
	        this.state = observe({})
	        this.parent = undefined;
	
			if (this.id !== undefined) {
				components[this.id] = this;
			}
	
	        if(this.domNode === undefined) {
	            this.domNode = domUtils.div()
	        }
	
	        this.build.apply(this, arguments)
	
	        //if(module.exports.dev) {
	            this.attr('blkName', this.name)
	        //}
	
	        var classList = [this.domNode.className]
	        if(defaultBlockStyle !== false) classList.push(defaultBlockStyle.className)
	        classList.push(Style.defaultClassName)
	        this.domNode.className = classList.join(' ') // note that the order of classes doesn't matter
	
	        // set up dom event handlers
	        var ifonHandlers={}
	        that.ifon(function(event) {
	            if(event in setOfBrowserEvents && (that.excludeDomEvents === undefined || !(event in that.excludeDomEvents))) {
	                that.domNode.addEventListener(event, ifonHandlers[event]=function() {
	                    that.emit.apply(that, [event].concat(Array.prototype.slice.call(arguments)))
	                })
	            }
	        })
	        that.ifoff(function(event) {
	            if(event in setOfBrowserEvents && (that.excludeDomEvents === undefined || !(event in that.excludeDomEvents))) {
	                that.domNode.removeEventListener(event,ifonHandlers[event])
	            }
	        })
		}
	
	    // sub-constructor - called by the constructor
	    // parameters:
	        // label - (Optional) A label that can be used to style a component differently.
	                   // Intended to be some string describing what the component is being used for.
	                   // Note, tho, that labels are not dynamic - changing the label won't affect styling until a new style is applied to the component)
	        // domNode - (Optional) A domNode to be used as the container domNode instead of the default (a div)
	    this.build = function(/*[label,] domNode*/) {
	        if(arguments.length === 1) {
	            this.domNode = arguments[0]
	        } else if(arguments.length >= 2) {
	            this.label = arguments[0]
	            this.domNode = arguments[1]
	        }
	    }
		
	
		// instance properties
	
		
		this.domNode;
	    this.label;
	    this.excludeDomEvents;
	    this.children;     // a list of child components that are a part of a Block object (these are used so Styles can be propogated down to child components)
	
	
	    Object.defineProperty(this, 'label', {
	        get: function() {
	            return this._label
	        }, set: function(v) {
	            if(this._label === undefined) {
	                this._label = v
	
	                if(module.exports.dev) {
	                    this.attr('label', this._label)
	                }
	            } else {
	                throw new Error("A Block's label can only be set once (was already set to: "+this._label+")")
	            }
	        }
	    })
	
	    // adds elements to the components main domNode
	    // arguments can be one of the following:
	        // component, component, component, ...
	        // listOfBlocks
	    this.add = function() {
	        this.addAt.apply(this, [this.domNode.children.length].concat(trimArguments(arguments)))
		}
	
	    // adds nodes at a particular index
	    // nodes can be one of the following:
	        // component, component, component, ...
	        // listOfBlocks
	    this.addAt = function(index/*, nodes...*/) {
	        var nodes = normalizeAddAtArguments.apply(this, arguments)
	
	        for (var i=0;i<nodes.length;i++) {
				var node = nodes[i];
	            this.children.splice(index+i, 0, node)
	
	            if(!isBlock(node)) {
	                throw new Error("node is not a Block")
	            }
	
	            node.parent = undefined
	            node.emit('parentRemoved')
	
	            var beforeChild = this.children[1+i+index]
	            if(beforeChild === undefined) {
	                this.domNode.appendChild(node.domNode)
	            } else {
	                this.domNode.insertBefore(node.domNode, beforeChild.domNode)
	            }
	
	            node.parent = this;
	            node.emit('newParent')
	
	            // apply styles
	            //if(itsaBlock) { // its always a component now
	                var that = this
	                node.getParentStyleMap = function() {return that.computedStyleMap}
	                blockStyleUtils.propogateStyleSet([node], this.computedStyleMap)
	            //}
			}
	    }
	
		// add a list of nodes before a particular node
	    // if beforeChild is undefined, this will append the given nodes
	    // arguments can be one of the following:
	        // component, component, component, ...
	        // listOfBlocks
	    this.addBefore = this.addBeforeNode = function(beforeChild) {
	        var nodes = trimArguments(arguments).slice(1)
	        if(beforeChild === undefined) {
	            this.add.apply(this, nodes)
	        } else {
	            var index = this.children.indexOf(beforeChild)
	            this.addAt.apply(this, [index].concat(nodes))
	        }
	    }
	
	
	    // arguments can be one of the following:
	        // component, component, component, ...
	        // index, index, index, ... - each index is the numerical index to remove
	        // arrayOfComponents
	        // arrayOfIndexes
	    this.remove = function() {
	        var removals = normalizeRemoveArguments.apply(this, arguments)
	        removals = removals.sort(function(a,b) {
	            return b-a // reverse sort (so that removing multiple indexes doesn't mess up)
	        })
	
	        for(var n=0; n<removals.length; n++) {
	            var r = removals[n]
	            var c = this.children[r]
	
	            if(c === undefined) {
	                throw new Error("There is no child at index "+r)
	            }
	
	            c.parent = undefined
	            this.children.splice(r, 1)
	            this.domNode.removeChild(this.domNode.childNodes[r])
	
	            c.emit('parentRemoved')
	        }
	    }
	
	    // sets or gets an attribute on the components domNode
	    // parameter sets:
	    // if one argument is passed, the attribute's value is returned (if there is no attribute, undefined is returned)
	    // if there are two arguments passed, the attribute is set
	        // if 'value' is undefined, the attribute is removed
	    this.attr = function(/*attribute, value OR attributeObject*/) {
	        if(arguments.length === 1) {
	            if(arguments[0] instanceof Object) {
	                var attributes = arguments[0]
	                for(var attribute in attributes) {
	                    domUtils.setAttribute(this.domNode, attribute, arguments[0][attribute])
	                }
	            } else {
	                var attribute = this.domNode.getAttribute(arguments[0])
	                if(attribute === null) {
	                    return undefined // screw null
	                } else {
	                    return attribute
	                }
	            }
	        } else {
	            var attribute = arguments[0]
	            if(arguments[1] !== undefined) {
	                var value = arguments[1]
	                domUtils.setAttribute(this.domNode, arguments[0], value)
	            } else {
	                this.domNode.removeAttribute(attribute)
	            }
	        }
	    }
	
	    Object.defineProperty(this, 'visible', {
	        // returns true if the element is visible
	        get: function() {
	            return this.domNode.style.display !== 'none';
	
	        // sets whether or not the element is visible
	        }, set: function(setToVisible) {
	            if(setToVisible) {
	                if (this._displayStyle !== undefined) {
	                    this.domNode.style.display = this._displayStyle // set back to its previous inline style
	                    this._displayStyle = undefined
	                } else {
	                    this.domNode.style.display = ''
	                }
	            } else {
	                if(this.domNode.style.display !== '' && this.domNode.style.display !== 'none') { // domNode has inline style
	                    this._displayStyle = this.domNode.style.display
	                }
	
	                this.domNode.style.display = 'none'
	            }
	        }
	    })
	
	
	    Object.defineProperty(this, 'focus', {
	        // returns true if the element is in focus
	        get: function() {
	            return document.activeElement === this.domNode
	
	        // sets whether or not the element is in focus (setting it to true gives it focus, setting it to false blurs it)
	        }, set: function(setToInFocus) {
	            if(setToInFocus) {
	                this.domNode.focus()
	            } else {
	                this.domNode.blur()
	            }
	        }
	    })
	
	    Object.defineProperty(this, 'style', {
	        get: function() {
	            return this._style
	
	        // sets the style, replacing one if one already exists
	        }, set: function(styleObject) {
	            if(styleObject === undefined) {
	                var styleMap = this.getParentStyleMap()
	                if(styleMap !== undefined) {
	                    blockStyleUtils.setCurrentStyle(this, blockStyleUtils.getStyleForComponent(styleMap, this))
	                } else {
	                    blockStyleUtils.setCurrentStyle(this, undefined)
	                }
	
	                this.computedStyleMap = styleMap
	
	            } else {
	                blockStyleUtils.setCurrentStyle(this, styleObject)
	                var specificStyle = styleObject.get(this)
	                if(this.getParentStyleMap() !== undefined) {
	                    this.computedStyleMap = blockStyleUtils.styleMapConjunction(this.getParentStyleMap(), specificStyle.componentStyleMap)
	                } else {
	                    this.computedStyleMap = specificStyle.componentStyleMap
	                }
	            }
	
	            this._style = styleObject
	            blockStyleUtils.propogateStyleSet(this.children, this.computedStyleMap) // propogate styles to children
	        }
	    })
	
	    Object.defineProperty(this, 'selectionRange', {
	        // returns the visible character selection range inside the element
	        // returns an array like [offsetStart, offsetEnd]
	        get: function() {
	            return domUtils.getSelectionRange(this.domNode)
	
	        // sets the visible character selection range
	        }, set: function(selection) {
	            domUtils.setSelectionRange(this.domNode, selection[0], selection[1])
	        }
	    })
	
	    this.attach = function() {
	        attach(this)
	    }
	    this.detach = function() {
	        detach(this)
	    }
	
	
		// private instance variables/functions
	
	    this.getParentStyleMap = function() {/*default returns undefined*/}  // should be set to a function that returns the computedStyleMap of the component containing this one (so Styles objects can be inherited)
	    this.computedStyleMap;  // a map of style objects computed from the Styles set on a given component and its parent components
	
		this._style;              // the object's explicit Style object (undefined if it inherits a style)
	    this.currentStyle;       // the object's current Style (inherited or explicit)
	    this._displayStyle;      // temporariliy stores an inline display style while the element is hidden (for use when 'show' is called)
	    this._styleSetupStates   // place to put states for setup functions (used for css pseudoclass emulation)
	});
	
	
	module.exports.dev = false // set to true to enable dom element naming (so you can see boundaries of components when inspecting the dom)
	
	
	// appends components to the body
	var attach = module.exports.attach = function(/*component,component,.. or components*/) {
	    if(arguments[0] instanceof Array) {
	        var components = arguments[0]
	    } else {
	        var components = arguments
	    }
	
	    if(document.body === null) throw new Error("Your document does not have a body.")
	
	    for(var n=0; n<components.length; n++) {
	        document.body.appendChild(components[n].domNode)
	    }
	}
	// removes components from the body
	var detach = module.exports.detach = function(/*component,component,.. or components*/) {
	    if(arguments[0] instanceof Array) {
	        var components = arguments[0]
	    } else {
	        var components = arguments
	    }
	
	    for(var n=0; n<components.length; n++) {
	        document.body.removeChild(components[n].domNode)
	    }
	}
	
	// creates a body tag (only call this if document.body is null)
	
	module.exports.createBody = function(callback) {
	    var dom = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
	    var body = dom.createElement("body")
	    dom.documentElement.appendChild(body)
	    setTimeout(function() {  // set timeout is needed because the body tag is only added after javascript goes back to the scheduler
	        callback()
	    },0)
	}
	
	
	
	
	// returns a list of indexes to remove from Block.remove's arguments
	/*private*/ var normalizeRemoveArguments = module.exports.normalizeRemoveArguments = function() {
	    var that = this
	
	    if(arguments[0] instanceof Array) {
	        var removals = arguments[0]
	    } else {
	        var removals = Array.prototype.slice.call(arguments)
	    }
	
	    return removals.map(function(removal, parameterIndex) {
	        if(isBlock(removal)) {
	            var index = that.children.indexOf(removal)
	            if(index === -1) {
	                throw new Error("The Block passed at index "+parameterIndex+" is not a child of this Block.")
	            }
	            return index
	        } else {
	            return removal
	        }
	
	    })
	}
	
	// returns a list of nodes to add
	/*private*/ var normalizeAddAtArguments = module.exports.normalizeAddAtArguments = function() {
	    if(arguments.length === 2) {
	        if(arguments[1] instanceof Array) {
	            return arguments[1]
	        } else {
	            return [arguments[1]]
	        }
	    } else { // > 2
	        return trimArguments(arguments).slice(1)
	    }
	}
	
	function isBlock(c) {
	    return c.add !== undefined && c.children instanceof Array && c.domNode !== undefined
	}
	function isDomNode(node) {
	    return node.nodeName !== undefined
	}

/***/ },
/* 16 */
/*!***************************************************!*\
  !*** ./~/blocks.js/src/~/Components/Container.js ***!
  \***************************************************/
/***/ function(module, exports, __webpack_require__) {

	var Block = __webpack_require__(/*! ../Block */ 15)
	var proto = __webpack_require__(/*! proto */ 8)
	
	module.exports = proto(Block, function(superclass) {
	
		// static properties
	
	    this.name = 'Container'
	
	
		// instance properties
	
		this.init = function (/*[label,] content*/) {
	        if(typeof(arguments[0]) !== 'string') {
	            var contentArgs = arguments
	        } else {
	            var label = arguments[0]
	            var contentArgs = Array.prototype.slice.call(arguments, 1)
	        }
	
	        superclass.init.call(this) // superclass constructor
	
	        this.label = label
	
			if(contentArgs !== undefined)
	            this.add.apply(this,contentArgs)
		}
	})


/***/ },
/* 17 */
/*!**********************************************!*\
  !*** ./~/blocks.js/src/~/Components/Text.js ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	var Block = __webpack_require__(/*! ../Block */ 15)
	var proto = __webpack_require__(/*! proto */ 8)
	var Style = __webpack_require__(/*! Style */ 14)
	
	module.exports = proto(Block, function(superclass) {
	
	    //static properties
	
	    this.name = 'Text'
	
	    this.defaultStyle = Style({
	        whiteSpace: 'pre-wrap' // so whitespace is displayed (e.g. multiple spaces don't collapse)
	    })
	
	    this.init = function(/*[label,] text*/) {
	        if(arguments.length === 1) {
	            var text = arguments[0]
	        } else {
	            var label = arguments[0]
	            var text = arguments[1]
	        }
	
	        if (text === undefined) text = '';
	
	        superclass.init.call(this) // superclass constructor
	
	        var that = this
	
	        this.label = label
	        this.text = text
	
	        this.on("input",function(data) {
	            var eventData = {newText:data.srcElement.textContent,oldText:that.oldText};
	            that.oldText = eventData.newText;
	            //that.emit("input",eventData);
	        });
	
	        this.on("blur",function(data) {
	            var eventData = {newText:data.srcElement.textContent,oldText:that.lastFocus};
	            that.lastFocus = eventData.newText;
	            //that.emit("blur",eventData);
	        });
	    }
	
	    // instance properties
	
	    Object.defineProperty(this, 'text', {
	        get: function() {
	            return this.domNode.textContent
	        }, set: function(v) {
	            this.domNode.innerText = v   // apparently textContent can't be set or something
	        }
	    })
	});


/***/ },
/* 18 */
/*!*********************************************!*\
  !*** ./~/deadunit-core/src/deadunitCore.js ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var path = __webpack_require__(/*! path */ 30)
	var Url = __webpack_require__(/*! url */ 31)
	
	var proto = __webpack_require__(/*! proto */ 36)
	var Future = __webpack_require__(/*! async-future */ 37)
	var SourceMapConsumer = __webpack_require__(/*! source-map */ 38).SourceMapConsumer
	
	var processResults = __webpack_require__(/*! ./processResults */ 27)
	var isRelative = __webpack_require__(/*! ./isRelative */ 28)
	
	// returns a module intended for a specific environment (that environment being described by the options)
	// options can contain:
	    // initialization - a function run once that can setup things (like a global error handler).
	        // Gets a single parameter 'state' which has the following form:
	            // unhandledErrorHandler(error,warn)
	    // initializeMainTest - a function run once that can setup things (like a test-specific handler).
	        // Gets a single parameter 'mainTestState' which has the following form:
	            // unhandledErrorHandler(error,warn) - the error handler for that test
	    // getDomain - a function that returns the current domain, or undefined if the environment (*cough* browsers) doesn't have domains
	    // getSourceMapObject - a function that returns a future of the pre-parsed source map object for a file, or future undefined
	        // gets the parameter:
	            // url - the url of the file to find a sourcemap for
	            // warningHandler - a warningHandler function that expects an error to be passed to it
	    // runTestGroup - a function run that allows you to wrap the actual test run in some way (intended for node.js domains)
	        // gets parameters:
	            // state - the same state object sent into `initialization`
	            // tester - a UnitTester object for the test
	            // runTest - the function that you should call to run the test group. Already has a synchronous try catch inside it (so you don't need to worry about that)
	            // handleError - a function that handles an error if one comes up. Takes the error as its only parameter. Returns a future.
	    // mainTestDone - a function run once a test is done
	        // gets the 'mainTestState' parameter
	    // defaultUnhandledErrorHandler - a function that handles an error unhandled by any other handler
	        // gets the 'error' as its only parameter
	    // defaultTestErrorHandler - is passed the current test, and should return a function that handles an error
	module.exports = function(options) {
	
	    // a variable that holds changeable state
	    var state = {
	        unhandledErrorHandler: options.defaultUnhandledErrorHandler
	    }
	
	    options.initialize(state)
	
	    // the prototype of objects used to manage accessing and displaying results of a unit test
	    var UnitTest = proto(function() {
	        this.init = function(/*mainName=undefined, groups*/) {
	            var that = this
	            var args = arguments
	            this.manager = EventManager(this)
	
	            setTimeout(function() {
	                runTest.call(that, args)
	            },0)
	        }
	
	        this.events = function(handlers) {
	            this.manager.add(handlers, options.getDomain())
	            return this
	        }
	
	        this.results = function() {
	            return processResults(this)
	        }
	
	        // private
	
	        function runTest(args) {
	            var fakeTest = new UnitTester()
	                fakeTest.id = undefined // fake test doesn't get an id
	                fakeTest.manager = this.manager
	                fakeTest.timeouts = []
	                fakeTest.onDoneCallbacks = []
	
	                var getUnhandledErrorHandler = function() {
	                    var unhandledErrorHandler = createUnhandledErrorHandler(fakeTest.mainSubTest)
	                    getUnhandledErrorHandler = function() { // memoize this junk
	                        return unhandledErrorHandler
	                    }
	                    return unhandledErrorHandler
	                }
	                fakeTest.mainTestState = {get unhandledErrorHandler(){return getUnhandledErrorHandler() || options.defaultTestErrorHandler(fakeTest)}}
	
	                var warningInfoMessageHasBeenOutput = false
	                this.manager.testObject.warningHandler = fakeTest.warningHandler = function(w) {
	                    var errorHandler = getUnhandledErrorHandler()
	                    if(warningInfoMessageHasBeenOutput === false) {
	                        var warning = newError("You've received at least one warning. If you don't want to treat warnings as errors, use the `warning` method to redefine how to handle them.")
	                        errorHandler(warning, false)
	                        warningInfoMessageHasBeenOutput = true
	                    }
	
	                    errorHandler(w, false)
	                }
	
	                options.initializeMainTest(fakeTest.mainTestState)
	
	                timeout(fakeTest, 3000, true) // initial (default) timeout
	                fakeTest.onDone = function() { // will execute when this test is done
	                    fakeTest.manager.lastEmitFuture.then(function() { // wait for all the already-registered emits to emit before finalizing the test
	                        done(fakeTest)
	                        options.mainTestDone(fakeTest.mainTestState)
	                    }).done()
	                }
	                fakeTest.callOnDone = function(cb) {
	                    fakeTest.onDoneCallbacks.push(cb)
	                }
	
	            UnitTester.prototype.test.apply(fakeTest, args) // set so the error handler can access the real test
	            this.mainTester = fakeTest
	
	            fakeTest.groupEnded = true
	            checkGroupDone(fakeTest)
	        }
	    })
	
	    var EventManager = proto(function() {
	
	        this.init = function(testObject) {
	            this.handlers = {
	                group: [],
	                assert: [],
	                count: [],
	                exception: [],
	                log: [],
	                end: [],
	                groupEnd: [],
	                before: [],
	                after: [],
	                beforeEnd: [],
	                afterEnd: []
	            }
	
	            this.history = []
	            this.emitDepth = 0 // records how many futures are waiting on eachother, so we can make sure maximum stack depth isn't exceeded
	            this.lastEmitFuture = Future(undefined)
	            this.testObject = testObject
	        }
	
	        this.testObject; // used to get the right warningHandler
	
	        // emits an event
	        // eventDataFuture resolves to either an eventData object, or undefined if nothing should be emitted
	        this.emit = function(type, eventDataFuture) {
	            var that = this
	            var lastEmitFuture = that.lastEmitFuture // capture it for the possible setTimeout threadlet
	            var doStuff = function(f) {
	                var resultFuture = lastEmitFuture.then(function() {
	                    return eventDataFuture
	                }).then(function(eventData){
	                    if(eventData !== undefined)
	                        recordAndTriggerHandlers.call(that, type, eventData)
	                }).catch(function(e) {
	                    that.testObject.warningHandler(e)
	                })
	
	                if(f !== undefined) {
	                    resultFuture.finally(function() {
	                        setTimeout(function(){f.return()},0) // make sure we don't get a "too much recursion error" // todo: test not doing this once browsers all support proper tail calls
	                    })
	                    return f
	                } else {
	                    return resultFuture
	                }
	            }
	
	            this.emitDepth++
	            if(this.emitDepth % 40 === 0) { // 40 seems to be the magic number here for firefox - such a finicky browser
	                that.lastEmitFuture = doStuff(new Future)
	            } else {
	                that.lastEmitFuture = doStuff()
	            }
	
	            return this.lastEmitFuture
	        }
	
	        // adds a set of listening handlers to the event stream, and runs those handlers on the stream's history
	        // domain is optional, but if defined will be the node.js domain that unhandled errors will be routed to
	        this.add = function(handlers, domain) {
	            // run the history of events on the the handlers
	            this.history.forEach(function(e) {
	                if(handlers[e.type] !== undefined) {
	                    handlers[e.type].call(undefined, e.data)
	                }
	            })
	
	            // then have those handlers listen on future events
	            for(var type in handlers) {
	                var typeHandlers = this.handlers[type]
	                if(typeHandlers === undefined) {
	                    throw new Error("event type '"+type+"' invalid")
	                }
	
	                typeHandlers.push({handler: handlers[type], domain: domain})
	            }
	        }
	
	        // the synchronous part of emitting
	        function recordAndTriggerHandlers(type, eventData) {
	            this.history.push({type:type, data: eventData})
	            this.handlers[type].forEach(function(handlerInfo) {
	                try {
	                    handlerInfo.handler.call(undefined, eventData)
	                } catch(e) {
	
	                    // throw error asynchronously because these error should be separate from the test exceptions
	                    var throwErrorFn = options.throwAsyncException
	
	                    if(handlerInfo.domain) {
	                        throwErrorFn = handlerInfo.domain.bind(throwErrorFn)    // this domain bind is needed because emit is done inside deadunit's test domain, which isn't where we want to put errors caused by the event handlers
	                    }
	
	                    throwErrorFn(e)
	                }
	            })
	        }
	    })
	
	    function testGroup(tester, test) {
	
	        // handles any error (synchronous or asynchronous errors)
	        var handleError = createUnhandledErrorHandler(tester)
	
	        var runTest = function() {
	            try {
	                test.call(tester, tester) // tester is both 'this' and the first parameter (for flexibility)
	            } catch(e) {
	                handleError(e, true).done()
	            }
	         }
	
	        options.runTestGroup(state, tester, runTest, handleError)
	    }
	
	    function createUnhandledErrorHandler(tester) {
	
	        var handleErrorInErrorHandler = function(warn, newError) {
	            if(warn !== false) {
	                try {
	                    tester.warningHandler(newError)
	                } catch(warningHandlerError) {
	                    var warningHandlerErrorText = warningHandlerError.stack?warningHandlerError.stack:warningHandlerError
	                    var textForOriginalError = newError.stack?newError.stack:newError
	                    var errorception = new Error("An error happened in the error handler: "+warningHandlerErrorText+"\n"+textForOriginalError)
	                    tester.manager.emit('exception', Future(errorception)).done() // if shit gets this bad, that sucks
	                }
	            } else {
	                console.error(newError)
	            }
	        }
	
	        // warn should be set to false if the handler is being called to report a warning
	        return function(e, warn) {
	            if(tester.unhandledErrorHandler !== undefined) {
	                try {
	                    tester.unhandledErrorHandler(e)
	                    return Future(undefined)
	
	                } catch(newError) {     // error handler had an error...
	                    handleErrorInErrorHandler(warn, newError)
	                }
	            }
	            // else
	
	            var errorToEmit = mapException(e, tester.warningHandler).catch(function(newError) {
	                if(newError.message !== "Accessing the 'caller' property of a function or arguments object is not allowed in strict mode") { // stacktrace.js doesn't support IE for certain things
	                    handleErrorInErrorHandler(warn, newError)
	                }
	                return Future(e) // use the original unmapped exception
	
	            }).then(function(exception){
	                return Future(exceptionEmitData(tester,exception))
	            })
	
	            var emitFuture = tester.manager.emit('exception', errorToEmit)
	            return afterWaitingEmitIsComplete(tester, emitFuture)
	
	        }
	    }
	
	    function exceptionEmitData(tester, e) {
	        return {
	            parent: tester.id,
	            time: now(),
	            error: e
	        }
	    }
	
	
	    // the prototype of objects used to write tests and contain the results of tests
	    var UnitTester = function(name, mainTester) {
	        if(!mainTester) mainTester = this
	
	        this.id = groupid()
	        this.mainTester = mainTester // the mainTester is used to easily figure out if the test results have been accessed (so early accesses can be detected)
	        this.name = name
	
	        this.doneTests = 0
	        this.doneAsserts = 0
	        this.runningTests = 0 // the number of subtests created synchronously
	        this.doneCalled = false
	        this.doSourcemappery = true // whether to do source mapping, if possible, within this test
	
	        this.complete = new Future // resolved when done
	    }
	
	        UnitTester.prototype = {
	            test: function() {
	                if(arguments.length === 1) {
	                    var test = arguments[0]
	
	                // named test
	                } else {
	                    var name = arguments[0]
	                    var test = arguments[1]
	                }
	
	                var that = this
	                this.runningTests++
	
	                var tester = new UnitTester(name, this.mainTester)
	                tester.manager = this.manager
	                tester.doSourcemappery = this.doSourcemappery // inherit from parent test
	                tester.warningHandler = this.warningHandler
	
	                if(this.id === undefined) { // ie its the top-level fake test
	                    this.mainSubTest = tester
	                }
	
	                tester.onDone = function() { // will execute when this test is done
	                    that.doneTests += 1
	
	                    that.manager.emit('groupEnd', Future({
	                        id: tester.id,
	                        time: now()
	                    }))
	
	                    try {
	                        tester.complete.return()
	                    } catch(e) {
	                        createUnhandledErrorHandler(tester)(e)
	                    }
	
	                    checkGroupDone(that)
	                }
	
	                tester.mainTester.callOnDone(function() {
	                    if(!tester.doneCalled) { // a timeout happened - end the test
	                        tester.doneCalled = true
	                        that.manager.emit('groupEnd', Future({
	                            id: tester.id,
	                            time: now()
	                        }))
	                    }
	                })
	
	                this.manager.emit('group', Future({
	                    id: tester.id,
	                    parent: this.id,
	                    name: name,
	                    time: now()
	                }))
	
	                if(this.beforeFn) {
	                    this.manager.emit('before', Future({
	                        parent: tester.id,
	                        time: now()
	                    }))
	
	                    this.beforeFn.call(this, this)
	
	                    this.manager.emit('beforeEnd', Future({
	                        parent: tester.id,
	                        time: now()
	                    }))
	                }
	
	                testGroup(tester, test)
	
	                if(this.afterFn) {
	                    this.manager.emit('after', Future({
	                        parent: tester.id,
	                        time: now()
	                    }))
	
	                    this.afterFn.call(this, this)
	
	                    this.manager.emit('afterEnd', Future({
	                        parent: tester.id,
	                        time: now()
	                    }))
	                }
	
	                tester.groupEnded = true
	                checkGroupDone(tester)
	
	                return tester
	            },
	
	            ok: function(success, actualValue, expectedValue) {
	                this.doneAsserts += 1
	                afterWaitingEmitIsComplete(this, assert(this, success, actualValue, expectedValue, 'assert', "ok")).done()
	            },
	            eq: function(actualValue, expectedValue) {
	                this.doneAsserts += 1
	                afterWaitingEmitIsComplete(this, assert(this, expectedValue === actualValue, actualValue, expectedValue, 'assert', "eq")).done()
	            },
	            count: function(number) {
	                if(this.countExpected !== undefined)
	                    throw Error("count called multiple times for this test")
	                this.countExpected = number
	
	                afterWaitingEmitIsComplete(this,assert(this, undefined, undefined, number, 'count', "count")).done()
	            },
	
	            before: function(fn) {
	                if(this.beforeFn !== undefined)
	                    throw Error("before called multiple times for this test")
	
	                this.beforeFn = fn
	            },
	            after: function(fn) {
	                if(this.afterFn !== undefined)
	                    throw Error("after called multiple times for this test")
	
	                this.afterFn = fn
	            },
	
	            log: function(/*arguments*/) {
	                this.manager.emit('log', Future({
	                    parent: this.id,
	                    time: now(),
	                    values: Array.prototype.slice.call(arguments, 0)
	                }))
	            },
	
	            timeout: function(t) {
	                timeout(this, t, false)
	            },
	
	            error: function(handler) {
	                this.unhandledErrorHandler = handler
	            },
	            warning: function(handler) {
	                this.warningHandler = handler
	            },
	
	            sourcemap: function(doSourcemappery) {
	                this.doSourcemappery = doSourcemappery
	            }
	        }
	
	    function afterWaitingEmitIsComplete(that, assertFuture) {
	        return assertFuture.finally(function() {
	            checkGroupDone(that)
	        })
	    }
	
	    function checkGroupDone(group) {
	        if(!group.doneCalled && group.groupEnded === true
	            && ((group.countExpected === undefined || group.countExpected <= group.doneAsserts+group.doneTests)
	                && group.runningTests === group.doneTests)
	        ) {
	            group.doneCalled = true // don't call twice
	            group.onDone()
	        }
	
	    }
	
	    function done(unitTester) {
	        if(unitTester.mainTester.ended) {
	            unitTester.mainTester.manager.emit('exception', Future({
	                parent: unitTester.mainTester.mainSubTest.id,
	                time: now(),
	                error: newError("done called more than once (probably because the test timed out before it finished)")
	            }))
	        } else {
	            unitTester.mainTester.timeouts.forEach(function(to) {
	                clearTimeout(to)
	            })
	            unitTester.mainTester.timeouts = []
	
	            endTest(unitTester, 'normal')
	        }
	    }
	
	    // if a timeout is the default, it can be overridden
	    function timeout(unitTester, t, theDefault) {
	        var timeouts = unitTester.mainTester.timeouts
	
	        var to = setTimeout(function() {
	            remove(timeouts, to)
	
	            if(timeouts.length === 0 && !unitTester.mainTester.ended) {
	                endTest(unitTester.mainTester, 'timeout')
	            }
	        }, t)
	
	        timeouts.push(to)
	
	        if(theDefault) {
	            timeouts.default = to
	        } else if(timeouts.default !== undefined) {
	            clearTimeout(timeouts.default)
	            remove(timeouts, timeouts.default)
	            timeouts.default = undefined
	        }
	
	        function remove(array, item) {
	            var index = array.indexOf(item)
	            if(index === -1)
	                throw Error("Item doesn't exist to remove")
	            array.splice(index, 1)
	        }
	    }
	
	    function endTest(that, type) {
	        that.mainTester.ended = true
	
	        if(that.mainTester === that) { // if its the main tester
	            that.onDoneCallbacks.forEach(function(cb) {
	                cb()
	            })
	        }
	
	        setTimeout(function() { // setTimeout here is to make it so the currently running threadlet that caused the test to end can finish before the end event is sent
	            that.manager.emit('end', Future({
	                type: type,
	                time: now()
	            }))
	        },0)
	    }
	
	    // type - either "count" or "assert"
	    function assert(that, success, actualValue, expectedValue, type, functionName/*="ok"*/, lineInfo/*=dynamic*/, stackIncrease/*=0*/) {
	        if(!stackIncrease) stackIncrease = 1
	        if(!functionName) functionName = "ok"
	        if(!lineInfo)
	            var lineInfoFuture = getLineInformation(functionName, stackIncrease, that.doSourcemappery, that.warningHandler)
	        else
	            var lineInfoFuture = Future(lineInfo)
	
	        var emitData = lineInfoFuture.then(function(lineInfo) {
	            var result = lineInfo
	            result.type = 'assert'
	            if(type !=='count') result.success = success === true
	
	            if(actualValue !== undefined)     result.actual = actualValue
	            if(expectedValue !== undefined)   result.expected = expectedValue
	
	            result.parent = that.id
	            result.time = now()
	
	           return Future(result)
	        })
	
	        return that.manager.emit(type, emitData)
	    }
	
	
	    function getLineInformation(functionName, stackIncrease, doSourcemappery, warningHandler) {
	
	        var file, line, column, lineinfo;
	        return options.getLineInfo(stackIncrease).then(function(info){
	            lineinfo = info
	            return getSourceMapConsumer(info.file, warningHandler)
	        }).catch(function(e){
	            warningHandler(e)
	            return Future(undefined)
	
	        }).then(function(sourceMapConsumer) {
	            if(sourceMapConsumer !== undefined && doSourcemappery) {
	
	                var mappedInfo = getMappedSourceInfo(sourceMapConsumer, lineinfo.file, lineinfo.line, lineinfo.column)
	                file = mappedInfo.file
	                line = mappedInfo.line
	                column = mappedInfo.column
	                var sourceLines = mappedInfo.sourceLines
	
	                var multiLineSearch = !mappedInfo.usingOriginalFile // don't to a multi-line search if the source has been mapped (the file might not be javascript)
	            } else {
	                file = lineinfo.file
	                line = lineinfo.line
	                column = lineinfo.column
	                var sourceLines = undefined
	                var multiLineSearch = true
	            }
	
	            return getFunctionCallLines(sourceLines, file, functionName, line, multiLineSearch, warningHandler)
	
	        }).catch(function(e) {
	            warningHandler(e)
	            return Future("<source not available>")
	        }).then(function(sourceLines) {
	            return Future({
	                sourceLines: sourceLines,
	                file: path.basename(file),
	                line: line,
	                column: column
	            })
	        })
	    }
	
	    // returns the line, column, and filename mapped from a source map
	    // appropriately handles cases where some information is missing
	    function getMappedSourceInfo(sourceMapConsumer, originalFilePath, originalLine, originalColumn, originalFunctionName) {
	        var sourceMapInfo = sourceMapConsumer.originalPositionFor({line:originalLine, column:originalColumn||0})       // the 0 is for browsers (like firefox) that don't output column numbers
	        var line = sourceMapInfo.line
	        var column = sourceMapInfo.column
	        var fn = sourceMapInfo.name
	
	        if(sourceMapInfo.source !== null) {
	            var relative = isRelative(sourceMapInfo.source)
	
	            /* I don't think this is needed any longer, and probably isn't correct - this was working around an issue in webpack: See https://github.com/webpack/webpack/issues/559 and https://github.com/webpack/webpack/issues/238
	            if(sourceMapConsumer.sourceRoot !== null) {
	                sourceMapInfo.source = sourceMapInfo.source.replace(sourceMapConsumer.sourceRoot, '') // remove sourceRoot
	            }*/
	
	            if(relative) {
	                var file = Url.resolve(originalFilePath, path.basename(sourceMapInfo.source))
	            } else {
	                var file = sourceMapInfo.source
	            }
	
	
	            var originalFile = true
	        } else {
	            var file = originalFilePath
	            var originalFile = false
	        }
	
	        if(fn === null || !originalFile) {
	            fn = originalFunctionName
	        }
	        if(line === null || !originalFile) {
	            line = originalLine
	            column = originalColumn
	        }
	        if(column === null) {
	            column = undefined
	        }
	
	        if(file != undefined && sourceMapConsumer.sourcesContent != undefined) { // intentional single !=
	            var index = sourceMapConsumer.sources.indexOf(file)
	            var sourceLines = sourceMapConsumer.sourcesContent[index]
	            if(sourceLines !== undefined) sourceLines = sourceLines.split('\n')
	        }
	
	        return {
	            file: file,
	            function: fn,
	            line: line,
	            column: column,
	            usingOriginalFile: originalFile,
	            sourceLines: sourceLines
	        }
	    }
	
	    // gets the actual lines of the call
	    // if multiLineSearch is true, it finds
	    function getFunctionCallLines(sourcesContent, filePath, functionName, lineNumber, multiLineSearch, warningHandler) {
	        if(sourcesContent !==  undefined) {
	            var source = Future(sourcesContent)
	        } else {
	            var source = options.getScriptSourceLines(filePath)
	        }
	        return source.catch(function(e) {
	            warningHandler(e)
	            return Future(undefined)
	
	        }).then(function(fileLines) {
	            if(fileLines !== undefined) {
	
	                var startLine = findStartLine(fileLines, functionName, lineNumber)
	                if(startLine === 'lineOfCodeNotFound') {
	                    return Future("<line of code not found (possibly an error?)> ")
	
	                } else if(startLine !== 'sourceNotAvailable') {
	                    if(multiLineSearch) {
	                        return Future(findFullSourceLine(fileLines, startLine))
	                    } else {
	                        return Future(fileLines[startLine].trim())
	                    }
	                }
	            }
	            // else
	            return Future("<source not available>")
	
	        })
	    }
	
	    var sourceMapConsumerCache = {} // a map from a script url to a future of its SourceMapConsumer object (null means no sourcemap exists)
	    function getSourceMapConsumer(url, warningHandler) {
	        if(sourceMapConsumerCache[url] === undefined) {
	            try {
	                sourceMapConsumerCache[url] = options.getSourceMapObject(url, warningHandler).then(function(sourceMapObject) {
	                    if(sourceMapObject !== undefined) {
	                        if(sourceMapObject.version === undefined) {
	                            warningHandler(new Error("Sourcemap for "+url+" doesn't contain the required 'version' property. Assuming version 2."))
	                            sourceMapObject.version = 2 // assume version 2 to make browserify's broken sourcemap format that omits the version
	                        }
	                        return Future(new SourceMapConsumer(sourceMapObject))
	                    } else {
	                        return Future(undefined)
	                    }
	                })
	            } catch(e) {
	                sourceMapConsumerCache[url] = Future(undefined)
	                warningHandler(e)
	            }
	        }
	
	        return sourceMapConsumerCache[url]
	    }
	
	    // takes an exception and returns a future exception that has a stacktrace with sourcemapped tracelines
	    function mapException(exception, warningHandler) {
	        try {
	            if(exception instanceof Error) {
	                var stacktrace;
	                return options.getExceptionInfo(exception).then(function(trace){
	                    stacktrace = trace
	
	                    var smcFutures = []
	                    for(var n=0; n<trace.length; n++) {
	                        if(trace[n].file !== undefined) {
	                            smcFutures.push(getSourceMapConsumer(trace[n].file, warningHandler))
	                        } else {
	                            smcFutures.push(Future(undefined))
	                        }
	                    }
	
	                    return Future.all(smcFutures)
	                }).then(function(sourceMapConsumers) {
	                    var CustomMappedException = proto(MappedException, function() {
	                        // set the name so it looks like the original exception when printed
	                        // this subclasses MappedException so that name won't be an own-property
	                        this.name = exception.name
	                    })
	
	                    try {
	                        throw CustomMappedException(exception, stacktrace, sourceMapConsumers)  // IE doesn't give exceptions stack traces unless they're actually thrown
	                    } catch(mappedExcetion) {
	                        return Future(mappedExcetion)
	                    }
	                })
	            } else {
	                return Future(exception)
	            }
	        } catch(e) {
	            var errorFuture = new Future
	            errorFuture.throw(e)
	            return errorFuture
	        }
	    }
	
	    // an exception where the stacktrace's files and lines are mapped to the original file (when applicable)
	    var MappedException = proto(Error, function(superclass) {
	
	        // constructor. Takes the parameters:
	            // originalError
	            // traceInfo - an array where each element is an object containing information about that stacktrace line
	            // sourceMapConsumers - an array of the same length as traceInfo where each element is the sourcemap consumer for the corresponding info in traceInfo
	        this.init = function(originalError, traceInfo, sourceMapConsumers) {
	            superclass.call(this, originalError.message)
	
	            for(var p in originalError) {
	                if(Object.hasOwnProperty.call(originalError, p)) {
	                    this[p] = originalError[p]
	                }
	            }
	
	            var newTraceLines = []
	            for(var n=0; n<traceInfo.length; n++) {
	                var info = traceInfo[n]
	                if(sourceMapConsumers[n] !== undefined) {
	                    info = getMappedSourceInfo(sourceMapConsumers[n], info.file, info.line, info.column, info.function)
	                }
	
	                var fileLineColumn = info.line
	                if(info.column !== undefined) {
	                    fileLineColumn += ':'+info.column
	                }
	                if(info.file !== undefined) {
	                    fileLineColumn = info.file+':'+fileLineColumn
	                }
	
	                var traceLine = "    at "
	                if(info.function !== undefined) {
	                    traceLine += info.function+' ('+fileLineColumn+')'
	                } else {
	                    traceLine += fileLineColumn
	                }
	
	                newTraceLines.push(traceLine)
	            }
	
	            Object.defineProperty(this, 'stack', {
	                get: function() {
	                    return this.name+': '+this.message+'\n'+newTraceLines.join('\n')
	                }
	            })
	        }
	    })
	
	    // attempts to find the full function call expression (over multiple lines) given the sources lines and a starting point
	    function findFullSourceLine(fileLines, startLine) {
	        var lines = []
	        var parenCount = 0
	        var mode = 0 // mode 0 for paren searching, mode 1 for double-quote searching, mode 2 for single-quote searching
	        var lastWasBackslash = false // used for quote searching
	        for(var n=startLine; true; n++) {
	            var line = fileLines[n]
	            lines.push(line.trim())
	
	            for(var i=0; i<line.length; i++) {
	                var c = line[i]
	
	                if(mode === 0) {
	                    if(c === '(') {
	                        parenCount++
	                        //if(parenCount === 0) {
	                          //  return lines.join('\n') // done
	                        //}
	                    } else if(c === ')' && parenCount > 0) {
	                        parenCount--
	                        if(parenCount === 0) {
	                            return lines.join('\n') // done
	                        }
	                    } else if(c === '"') {
	                        mode = 1
	                    } else if(c === "'") {
	                        mode = 2
	                    }
	                } else if(mode === 1) {
	                    if(c === '"' && !lastWasBackslash) {
	                        mode = 0
	                    }
	
	                    lastWasBackslash = c==='\\'
	                } else { // mode === 2
	                    if(c === "'" && !lastWasBackslash) {
	                        mode = 0
	                    }
	
	                    lastWasBackslash = c==='\\'
	                }
	            }
	        }
	
	        return lines.join('\n') // if it gets here, something minor went wrong
	    }
	
	    // finds the line a function started on given the file's lines, and the stack trace line number (and function name)
	    // returns undefined if something went wrong finding the startline
	    function findStartLine(fileLines, functionName, lineNumber) {
	        var startLine = lineNumber - 1
	        while(true) {
	            if(startLine < 0) {
	                return 'lineOfCodeNotFound' // something went wrong if this is being returned (the functionName wasn't found above - means you didn't get the function name right)
	            }
	
	            var line = fileLines[startLine]
	            if(line === undefined) {
	                return 'sourceNotAvailable'
	            }
	
	            //lines.push(line.trim())
	            var containsFunction = line.indexOf(functionName) !== -1
	            if(containsFunction) {
	                return startLine
	            }
	
	            startLine--
	        }
	    }
	
	    function groupid() {
	        groupid.next++
	        return groupid.next
	    }
	    groupid.next = -1
	
	    // returns a Unix Timestamp for now
	    function now() {
	        return (new Date()).getTime()
	    }
	
	    return {
	        test: UnitTest
	    }
	}
	
	function newError(message, ErrorPrototype) {
	    try {
	        throw new Error(message) // IE needs an exception to be actually thrown to get a stack trace property
	    } catch(e) {
	        return e
	    }
	}

/***/ },
/* 19 */
/*!***********************************************************!*\
  !*** ./~/deadunit-core/src/deadunitCore.browserConfig.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var path = __webpack_require__(/*! path */ 30);
	
	var Future = __webpack_require__(/*! async-future */ 37)
	var proto = __webpack_require__(/*! proto */ 36)
	var stacktracejs = __webpack_require__(/*! stacktrace-js */ 39)
	var ajax = __webpack_require__(/*! ajax */ 40)
	var resolveSourceMap = Future.wrap(__webpack_require__(/*! source-map-resolve */ 41).resolveSourceMap)
	
	var deadunitCore = __webpack_require__(/*! ./deadunitCore */ 18)
	var isRelative = __webpack_require__(/*! ./isRelative */ 28)
	
	//ajax.setSynchronous(true) // todo: REMOVE THIS once this chrome bug is fixed in a public release: https://code.google.com/p/chromium/issues/detail?id=368444
	
	var sourceCache = {}
	/* todo: add something like this back once stacktrace-js support swapping out ajax implementations
	// add sourceFile contents into stacktrace.js's cache
	
	var cacheGet = function(url) {
	    return sourceCache[url]
	}
	var cacheSet = function(url, responseFuture) {
	    sourceCache[url] = responseFuture
	    if(stackinfo.sourceCache[url] === undefined) {
	        responseFuture.then(function(response) {
	            stackinfo.sourceCache[url] = response.text.split('\n')
	        }).done()
	    }
	}
	
	// what was this for?
	if(window.setImmediate === undefined) {
	    window.setImmediate = function(fn, params) {
	        setTimeout(function() {
	            fn.apply(this,params)
	        },0)
	    }
	}
	
	
	//ajax.cacheGet(cacheGet)
	//ajax.cacheSet(cacheSet)
	*/
	
	
	var config = module.exports = proto(function() {
	    this.init = function() {
	        var that = this
	        // node.js errback style readFile
	        /*private*/ this.readFile = function(url, callback) {
	            that.ajax(url).then(function(response) { // need to use 'that' because readFile will not be called with this config object as the context
	                callback(undefined, response.text)
	            }).catch(callback).done()
	        }
	    }
	
	    this.ajax = ajax
	
	    this.initialize = function() {}
	
	    this.initializeMainTest = function(testState) {
	        //testState.active = true // make sure
	
	        testState.oldOnerror = window.onerror
	        testState.newOnerror = window.onerror = function(errorMessage, filename, line, column) {
	            if(column === undefined) var columnText = ''
	            else                     var columnText = "/"+column
	
	            try {
	                throw new Error("Uncaught error in "+filename+" line "+line+columnText+": "+errorMessage) // IE needs the exception to actually be thrown before it will have a stack trace
	            } catch(e) {
	                testState.unhandledErrorHandler(e, true)
	                if(testState.oldOnerror)
	                    testState.oldOnerror.apply(this, arguments)
	            }
	        }
	    }
	    this.mainTestDone= function(testState) {
	        //testState.active = false // make sure the test-specific onerror code is no longer run
	        /*if(testState.newOnerror === window.onerror) {
	            window.onerror = testState.oldOnerror // otherwise something else has overwritten onerror, so don't mess with it
	        }*/
	    }
	
	    this.getDomain= function() {
	        return undefined // domains don't exist in-browser
	    }
	
	    this.runTestGroup= function(deadunitState, tester, runTest, handleError, handleUnhandledError) {
	        runTest()
	    }
	    this.getScriptSourceLines= function(path) {
	        /* todo: figure out what to do here when you can merge file caches with stacktrace.js
	        if(stackinfo.sourceCache[path] !== undefined) {
	            return Future(stackinfo.sourceCache[path])
	        } else {*/
	            return this.ajax(path).then(function(response) {
	                return Future(response.text.split('\n'))
	            })
	        //}
	
	    }
	    this.getSourceMapObject = function(url, warningHandler) {
	        var that = this
	        return this.ajax(url).then(function(response) {
	            var headers = response.headers
	            if(headers['SourceMap'] !== undefined) {
	                var headerSourceMap = headers['SourceMap']
	            } else if(headers['X-SourceMap']) {
	                var headerSourceMap = headers['X-SourceMap']
	            }
	
	            if(headerSourceMap !== undefined) {
	                if(isRelative(headerSourceMap)) {
	                    headerSourceMap = path.join(path.dirname(url),headerSourceMap)
	                }
	
	                return that.ajax(headerSourceMap).then(function(response) {
	                    return Future(JSON.parse(response.text))
	                })
	
	            } else {
	                return resolveSourceMap(response.text, url, that.readFile).catch(function(e){
	                    warningHandler(e)
	                    return Future(null)
	
	                }).then(function(sourceMapObject) {
	                    if(sourceMapObject !== null) {
	                        return Future(sourceMapObject.map)
	                    } else {
	                        return Future(undefined)
	                    }
	                })
	            }
	        })
	    }
	
	    this.defaultUnhandledErrorHandler= function(e) {
	        //if(e !== undefined)
	            setTimeout(function() {
	                if(e.stack)
	                    console.log(e.stack)
	                else
	                    console.log(e)
	            },0)
	    }
	    this.defaultTestErrorHandler= function(tester) {
	        return function(e) {
	            tester.manager.emit('exception', {
	                parent: tester.mainSubTest.id,
	                time: (new Date()).getTime(),
	                error: e
	            })
	        }
	    }
	
	    this.getLineInfo= function(stackIncrease) {
	        var result = new Future
	        stacktracejs.get({sourceCache: sourceCache}).then(function(stackFrames){
	            var frame = stackFrames[3+stackIncrease]
	            result.return({
	                'function': frame.functionName,
	                line: frame.lineNumber,
	                column: frame.columnNumber,
	                file: frame.fileName
	            })
	        }).catch(function(e) {
	            result.throw(e)
	        })
	
	        return result
	    }
	
	    this.getExceptionInfo= function(e) {
	        var result = new Future
	        stacktracejs.fromError(e, {sourceCache: sourceCache}).then(function(stackFrames){
	            result.return(stackFrames.map(function(frame){
	                return {
	                    'function': frame.functionName,
	                    line: frame.lineNumber,
	                    column: frame.columnNumber,
	                    file: frame.fileName
	                }
	            }))
	        }).catch(function(e) {
	            result.throw(e)
	        })
	
	        return result
	    }
	
	    this.throwAsyncException = function(e) {
	        setTimeout(function() {
	            if(e.stack !== undefined) throw e.stack
	            else                      throw e
	        },0)
	    }
	})

/***/ },
/* 20 */
/*!**********************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/process/browser.js ***!
  \**********************************************************/
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser
	
	var process = module.exports = {};
	
	process.nextTick = (function () {
	    var canSetImmediate = typeof window !== 'undefined'
	    && window.setImmediate;
	    var canMutationObserver = typeof window !== 'undefined'
	    && window.MutationObserver;
	    var canPost = typeof window !== 'undefined'
	    && window.postMessage && window.addEventListener
	    ;
	
	    if (canSetImmediate) {
	        return function (f) { return window.setImmediate(f) };
	    }
	
	    var queue = [];
	
	    if (canMutationObserver) {
	        var hiddenDiv = document.createElement("div");
	        var observer = new MutationObserver(function () {
	            var queueList = queue.slice();
	            queue.length = 0;
	            queueList.forEach(function (fn) {
	                fn();
	            });
	        });
	
	        observer.observe(hiddenDiv, { attributes: true });
	
	        return function nextTick(fn) {
	            if (!queue.length) {
	                hiddenDiv.setAttribute('yes', 'no');
	            }
	            queue.push(fn);
	        };
	    }
	
	    if (canPost) {
	        window.addEventListener('message', function (ev) {
	            var source = ev.source;
	            if ((source === window || source === null) && ev.data === 'process-tick') {
	                ev.stopPropagation();
	                if (queue.length > 0) {
	                    var fn = queue.shift();
	                    fn();
	                }
	            }
	        }, true);
	
	        return function nextTick(fn) {
	            queue.push(fn);
	            window.postMessage('process-tick', '*');
	        };
	    }
	
	    return function nextTick(fn) {
	        setTimeout(fn, 0);
	    };
	})();
	
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};


/***/ },
/* 21 */
/*!***********************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/util/support/isBufferBrowser.js ***!
  \***********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 22 */
/*!************************************!*\
  !*** ./~/blocks.js/src/~/utils.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	// utilities needed by the configuration (excludes dependencies the configs don't need so the webpack bundle is lean)
	
	var path = __webpack_require__(/*! path */ 30)
	
	
	// Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
	// any number of objects can be passed into the function and will be merged into the first argument in order
	// returns obj1 (now mutated)
	var merge = exports.merge = function(obj1, obj2/*, moreObjects...*/){
	    return mergeInternal(arrayify(arguments), false)
	}
	
	// like merge, but traverses the whole object tree
	// the result is undefined for objects with circular references
	var deepMerge = exports.deepMerge = function(obj1, obj2/*, moreObjects...*/) {
	    return mergeInternal(arrayify(arguments), true)
	}
	
	// returns a new object where properties of b are merged onto a (a's properties may be overwritten)
	exports.objectConjunction = function(a, b) {
	    var objectCopy = {}
	    merge(objectCopy, a)
	    merge(objectCopy, b)
	    return objectCopy
	}
	
	// turns an array of values into a an object where those values are all keys that point to 'true'
	exports.arrayToMap = function(array) {
	    var result = {}
	    array.forEach(function(v) {
	        result[v] = true
	    })
	    return result
	}
	
	function mergeInternal(objects, deep) {
	    var obj1 = objects[0]
	    var obj2 = objects[1]
	
	    for(var key in obj2){
	       if(Object.hasOwnProperty.call(obj2, key)) {
	            if(deep && obj1[key] instanceof Object && obj2[key] instanceof Object) {
	                mergeInternal([obj1[key], obj2[key]], true)
	            } else {
	                obj1[key] = obj2[key]
	            }
	       }
	    }
	
	    if(objects.length > 2) {
	        var newObjects = [obj1].concat(objects.slice(2))
	        return mergeInternal(newObjects, deep)
	    } else {
	        return obj1
	    }
	}
	
	function arrayify(a) {
	    return Array.prototype.slice.call(a, 0)
	}


/***/ },
/* 23 */
/*!***************************************!*\
  !*** ./~/blocks.js/src/~/domUtils.js ***!
  \***************************************/
/***/ function(module, exports, __webpack_require__) {

	
	// creates a dom element optionally with a class and attributes
	 var node = module.exports.node = function(type, className, options) {
	    var elem = document.createElement(type)
	
	    if(options !== undefined) {
	        if(options.attr !== undefined) {
	            for(var attribute in options.attr) {
	                createAttribute(elem, attribute, options.attr[attribute])
	            }
	        }
	        if(options.textContent !== undefined) {
	            elem.textContent = options.textContent
	        }
	    }
	
	    if(className !== undefined)
	        elem.className = className
	
	    return elem
	}
	
	// convenience function for creating a div
	module.exports.div = function(className, options) {
	    return node('div', className, options)
	}
	
	// adds an attribute to a domNode
	var setAttribute = module.exports.setAttribute = function(/*[domNode,] type, value*/) {
	    if (arguments.length === 2) {
	        var domNode = this.domNode;
	        var type = arguments[0];
	        var value = arguments[1];
	    } else if (arguments.length === 3) {
	        var domNode = arguments[0];
	        var type = arguments[1];
	        var value = arguments[2];
	    } else {
	        throw new Error("This function expects arguments to be: [domNode,] type, value");
	    }
	    var attr = document.createAttribute(type)
	    attr.value = value
	    domNode.setAttributeNode(attr)
	}
	
	
	// sets the selection
	//
	// works for contenteditable elements
	exports.setSelectionRange = function(containerEl, start, end) {
	
	    if(containerEl.nodeName === 'INPUT' || containerEl.nodeName === 'TEXTAREA') {
	        containerEl.setSelectionRange(start, end)
	    } else {
	        var charIndex = 0, range = document.createRange();
	        range.setStart(containerEl, 0);
	        range.collapse(true);
	        var foundStart = false;
	
	        iterateThroughLeafNodes(containerEl, function(node) {
	            var hiddenCharacters = findHiddenCharacters(node, node.length)
	            var nextCharIndex = charIndex + node.length - hiddenCharacters;
	
	            if (!foundStart && start >= charIndex && start <= nextCharIndex) {
	                var nodeIndex = start-charIndex
	                var hiddenCharactersBeforeStart = findHiddenCharacters(node, nodeIndex)
	                range.setStart(node, nodeIndex + hiddenCharactersBeforeStart);
	                foundStart = true;
	            }
	
	            if (foundStart && end >= charIndex && end <= nextCharIndex) {
	                var nodeIndex = end-charIndex
	                var hiddenCharactersBeforeEnd = findHiddenCharacters(node, nodeIndex)
	                range.setEnd(node, nodeIndex + hiddenCharactersBeforeEnd);
	                return true; // stop the iteration - we're done here
	            }
	
	            charIndex = nextCharIndex
	        })
	
	        var sel = window.getSelection();
	        sel.removeAllRanges();
	        sel.addRange(range);
	    }
	}
	
	// gets the character offsets of a selection within a particular dom node
	// returns undefined if there is no selection in the element
	// note: yes this code doesn't work in older versions of IE (or possibly any versions) - if you want it to work in IE, please use http://modernizr.com/ or a polyfill for ranges
	exports.getSelectionRange = function (element) {
	
	    var selection = window.getSelection()
	    var isInputOrArea = element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA'
	
	    for(var n=0; n<selection.rangeCount; n++) {
	        var range = selection.getRangeAt(0)
	        if(isInputOrArea) {
	            if(range.startOffset === range.endOffset && range.startContainer.children[range.startOffset] === element /*|| range.startContainer === element || */) { // I don't think the input or textarea itself will ever be the startContainer
	                return [element.selectionStart, element.selectionEnd]
	            }
	        } else {
	            var startsInElement = element.contains(range.startContainer)
	            if(startsInElement) {
	                var elementToIterateThrough = element
	                var startFound = true
	            } else {
	                var elementToIterateThrough = range.commonAncestorContainer
	                var startFound = false
	                var startContainerFound = false
	            }
	
	            var visibleCharacterOffset = 0, start, end;
	            iterateThroughLeafNodes(elementToIterateThrough, function(leaf) {
	                if(!startFound) {
	                    if(leaf === range.startContainer) {
	                        startContainerFound = true
	                    }
	
	                    if(!element.contains(leaf) || !startContainerFound)
	                        return; // continue
	                    else if(startContainerFound)
	                       startFound = true
	                } else if(!startsInElement && !element.contains(leaf)) {
	                    return true // done!
	                }
	
	                if(leaf === range.startContainer) {
	                    start = visibleCharacterOffset + range.startOffset - findHiddenCharacters(leaf, range.startOffset)
	                }
	                if(leaf === range.endContainer) {
	                    end = visibleCharacterOffset + range.endOffset - findHiddenCharacters(leaf, range.endOffset)
	                    return true // done!
	                }
	
	                visibleCharacterOffset += leaf.length - findHiddenCharacters(leaf, leaf.length)
	            })
	
	            if(start === undefined && !startFound) {
	                return undefined
	            } else {
	                if(start === undefined) {
	                    start = 0 // start is at the beginning
	                }
	                if(end === undefined) {
	                    end = visibleCharacterOffset // end is all the way at the end (the selection may continue in other elements)
	                }
	
	                return [start, end]
	            }
	        }
	    }
	}
	
	
	// iterate through the leaf nodes inside element
	// callback(node) - a function called for each leaf node
	    // returning true from this ends the iteration
	function iterateThroughLeafNodes(element, callback) {
	    var nodeStack = [element], node;
	
	    while (node = nodeStack.pop()) {
	        if (node.nodeType == 3) {
	            if(callback(node) === true)
	                break;
	        } else {
	            var i = node.childNodes.length;
	            while (i--) {
	                nodeStack.push(node.childNodes[i]);
	            }
	        }
	    }
	}
	
	function findHiddenCharacters(node, beforeCaretIndex) {
	    var hiddenCharacters = 0
	    var lastCharWasWhiteSpace=true
	    for(var n=0; n-hiddenCharacters<beforeCaretIndex &&n<node.length; n++) {
	        if([' ','\n','\t','\r'].indexOf(node.textContent[n]) !== -1) {
	            if(lastCharWasWhiteSpace)
	                hiddenCharacters++
	            else
	                lastCharWasWhiteSpace = true
	        } else {
	            lastCharWasWhiteSpace = false
	        }
	    }
	
	    return hiddenCharacters
	}

/***/ },
/* 24 */
/*!**********************************************!*\
  !*** ./~/blocks.js/src/~/blockStyleUtils.js ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	// some functionality that is needed by Block.js but is related to styling (some things are also needed by Style.js)
	
	var HashMap = __webpack_require__(/*! hashmap */ 34)
	
	var Style = __webpack_require__(/*! ./Style */ 14)
	var utils = __webpack_require__(/*! ./utils */ 22)
	
	exports.defaultStyleMap = new HashMap() // maps from a proto class to its computed default style
	
	// propogates a style-set change to a set of components
	    // styleMap should be a *copy* of a Style's componentStyleMap property (because it will be modified)
	var propogateStyleSet = exports.propogateStyleSet = function (components, styleMap) {
	    for(var n=0; n<components.length; n++) {
	        var c = components[n]
	
	        // object inherits style if its in the styleSet and if it doesn't have an explicitly set style
	        if(c._style === undefined) {
	            if(styleMap === undefined) {
	                setCurrentStyle(c, undefined)
	            } else {
	                var styleFromMap = getStyleForComponent(styleMap, c)
	                if(styleFromMap !== undefined) {
	                    setCurrentStyle(c, styleFromMap)
	                }
	            }
	        }
	
	        // set the computed style set
	        var mainStyle; // the style directly given to a component, either its `style` property, or its inherited style
	        if(c._style !== undefined) {
	            mainStyle = c._style.get(c)
	        } else if(styleMap !== undefined) {
	            mainStyle = getStyleForComponent(styleMap, c)
	            if(mainStyle !== undefined) {
	                mainStyle = mainStyle.get(c) // get the specific style (taking into account any label)
	            }
	        }
	
	        if(mainStyle !== undefined) {
	            if(styleMap !== undefined) {
	                c.computedStyleMap = styleMapConjunction(styleMap, mainStyle.componentStyleMap)
	            } else {
	                c.computedStyleMap = mainStyle.componentStyleMap
	            }
	        } else {
	            c.computedStyleMap = styleMap
	        }
	
	        propogateStyleSet(c.children, c.computedStyleMap)
	    }
	}
	
	// gets the right style from the styleMap
	// takes the component's inheritance tree into account (relies on the block.constructor.parent property)
	var getStyleForComponent = exports.getStyleForComponent = function (styleMap, block) {
	    var constructor = block.constructor
	    while(constructor !== undefined) {
	        var style = styleMap[constructor.name]
	        if(style !== undefined) {
	            return style
	        } else {
	            constructor = constructor.parent
	        }
	    }
	}
	
	// returns the conjunction of two style maps
	// gets it from the computedStyles cache if its already in there
	var styleMapConjunction = exports.styleMapConjunction = function (secondaryStyleMap, primaryStyleMap) {
	    var cachedStyleMap = Style.computedStyles.get([secondaryStyleMap, primaryStyleMap])
	    if(cachedStyleMap === undefined) {
	        cachedStyleMap = utils.objectConjunction(secondaryStyleMap, primaryStyleMap)
	        Style.computedStyles.set([secondaryStyleMap, primaryStyleMap], cachedStyleMap)
	    }
	
	    return cachedStyleMap
	}
	
	// takes labels into account
	var setCurrentStyle = exports.setCurrentStyle = function (component, style) {
	    if(style === component.currentStyle) return; // do nothing
	
	    if(style !== undefined)
	        var specificStyle = style.get(component)
	    else
	        var specificStyle = style
	
	    setStyleClass(component, specificStyle)
	    applyStyleKillFunction(component)
	    component.currentStyle = specificStyle
	    applyStyleSetupFunction(component, specificStyle)
	    applyStateHandler(component, specificStyle)
	}
	
	
	exports.createDefaultBlockStyle = function (that) {
	    if(that.defaultStyle !== undefined) {
	        validateDefaultStyle(that.defaultStyle)
	    }
	
	    // get list of default styles
	    var defaultStyles = []
	    var nextConstructor = that.constructor
	    while(nextConstructor !== undefined) {
	        if(nextConstructor.defaultStyle !== undefined) {
	            defaultStyles.push(nextConstructor.defaultStyle)
	        }
	        nextConstructor = nextConstructor.parent
	    }
	
	    // generate merged default style
	    var defaultStyleSet = {}
	    defaultStyles.reverse().forEach(function(style) {
	        for(var k in style.styleDefinitions) {
	            utils.merge(defaultStyleSet, style.styleDefinitions[k])
	            break; // just do first key (shouldn't be more than one key, because only simple stylings are allowed for default styles)
	        }
	
	    })
	
	    if(Object.keys(defaultStyleSet).length > 0)
	        var defaultBlockStyle = Style(defaultStyleSet, {default:true})
	    else
	        var defaultBlockStyle = false // no special default
	
	    exports.defaultStyleMap.set(that.constructor, defaultBlockStyle)
	    return defaultBlockStyle
	}
	
	
	// applies setup appropriately
	function applyStyleSetupFunction(component, style) {
	    if(style !== undefined && style.setup !== undefined) {
	        component._styleSetupObject = style.setup(component) // call setup on the component
	    } else {
	        component._styleSetupObject = undefined
	    }
	}
	// applies kill appropriately
	function applyStyleKillFunction(component) {
	    var currentStyle = component.currentStyle
	    if(currentStyle !== undefined && currentStyle.setup !== undefined) {
	        if(currentStyle.kill === undefined)
	            throw new Error('style has been unset but does not have a "kill" function to undo its "setup" function')
	
	        currentStyle.kill(component, component._styleSetupObject)
	    }
	}
	
	// initializes and sets up state-change handler
	function applyStateHandler(component, style) {
	    if(style !== undefined && style.stateHandler !== undefined) {
	        // todo: using setCurrentStyle is a stopgap until I can implement better style application for $state and pseudoclasses (which probably will require a rewrite of much of the style logic)
	        setCurrentStyle(component, style.stateHandler(component.state.subject))
	        component.state.on('change', function() {
	            setCurrentStyle(component, style.stateHandler(component.state.subject))
	        })
	    }
	}
	
	// sets the style, replacing one if one already exists
	function setStyleClass(component, style) {
	    var currentStyle = component.currentStyle
	    if(currentStyle !== undefined) {
	        component.domNode.className = component.domNode.className.replace(new RegExp(" ?\\b"+currentStyle.className+"\\b"),'') // remove the previous css class
	    }
	    if(style !== undefined) {
	        component.domNode.className = style.className+' '+component.domNode.className.trim() // note that the order of classes doesn't matter
	    }
	}
	
	function validateDefaultStyle(defaultStyle) {
	    if(!(defaultStyle instanceof Style)) {
	        throw new Error("defaultStyle property must be a Style object")
	    } else if(
	        defaultStyle.setup !== undefined || defaultStyle.kill !== undefined || defaultStyle.stateHandler !== undefined ||
	        Object.keys(defaultStyle.componentStyleMap).length > 0 || Object.keys(defaultStyle.labelStyleMap).length > 0 /*||
	        Object.keys(defaultStyle.pseudoClassStyles).length > 0*/
	    ) {
	        throw new Error("A Block's defaultStyle can only contain basic css stylings, no Block, label, or pseudoclass stylings, nor run/kill javascript")
	    }
	}

/***/ },
/* 25 */
/*!*********************************************************!*\
  !*** ./~/async-future/~/trimArguments/trimArguments.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	// resolves varargs variable into more usable form
	// args - should be a function arguments variable
	// returns a javascript Array object of arguments that doesn't count trailing undefined values in the length
	module.exports = function(theArguments) {
	    var args = Array.prototype.slice.call(theArguments, 0)
	
	    var count = 0;
	    for(var n=args.length-1; n>=0; n--) {
	        if(args[n] === undefined)
	            count++
	    }
	    args.splice(-0, count)
	    return args
	}

/***/ },
/* 26 */
/*!*****************************************!*\
  !*** ./~/blocks.js/src/external/jss.js ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	/*
	 * JSS v0.6 - JavaScript Stylesheets
	 * https://github.com/Box9/jss
	 *
	 * Copyright (c) 2011, David Tang
	 * MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
	 */
	var jss = (function() {
	    var adjSelAttrRegex = /((?:\.|#)[^\.\s#]+)((?:\.|#)[^\.\s#]+)/g;
	    var doubleColonPseudoElRegex = /(::)(before|after|first-line|first-letter|selection)/;
	    var singleColonPseudoElRegex = /([^:])(:)(before|after|first-line|first-letter|selection)/;
	    var singleColonForPseudoElements; // flag for older browsers
	
	    function getSelectorsAndRules(sheet) {
	        var rules = sheet.cssRules || sheet.rules || [];
	        var results = {};
	        for (var i = 0; i < rules.length; i++) {
	            // Older browsers and FF report pseudo element selectors in an outdated format
	            var selectorText = toDoubleColonPseudoElements(rules[i].selectorText);
	            if (!results[selectorText]) {
	                results[selectorText] = [];
	            }
	            results[selectorText].push({
	                sheet: sheet,
	                index: i,
	                style: rules[i].style
	            });
	        }
	        return results;
	    }
	
	    function getRules(sheet, selector) {
	        var rules = sheet.cssRules || sheet.rules || [];
	        var results = [];
	        // Browsers report selectors in lowercase
	        selector = selector.toLowerCase();
	        for (var i = 0; i < rules.length; i++) {
	            var selectorText = rules[i].selectorText;
	            // Note - certain rules (e.g. @rules) don't have selectorText
	            if (selectorText && (selectorText == selector || selectorText == swapAdjSelAttr(selector) || selectorText == swapPseudoElSyntax(selector))) {
	                results.push({
	                    sheet: sheet,
	                    index: i,
	                    style: rules[i].style
	                });
	            }
	        }
	        return results;
	    }
	
	    function addRule(sheet, selector) {
	        var rules = sheet.cssRules || sheet.rules || [];
	        var index = rules.length;
	        var pseudoElementRule = addPseudoElementRule(sheet, selector, rules, index);
	
	        if (!pseudoElementRule) {
	            addRuleToSheet(sheet, selector, index);
	        }
	
	        return {
	            sheet: sheet,
	            index: index,
	            style: rules[index].style
	        };
	    };
	
	    function addRuleToSheet(sheet, selector, index) {
	        if (sheet.insertRule) {
	            sheet.insertRule(selector + ' { }', index);
	        } else {
	            sheet.addRule(selector, null, index);
	        }
	    }
	
	    // Handles single colon syntax for older browsers and bugzilla.mozilla.org/show_bug.cgi?id=949651
	    function addPseudoElementRule(sheet, selector, rules, index) {
	        var doubleColonSelector;
	        var singleColonSelector;
	
	        if (doubleColonPseudoElRegex.exec(selector)) {
	            doubleColonSelector = selector;
	            singleColonSelector = toSingleColonPseudoElements(selector);
	        } else if (singleColonPseudoElRegex.exec(selector)) {
	            doubleColonSelector = toDoubleColonPseudoElements(selector);
	            singleColonSelector = selector;
	        } else {
	            return false; // Not dealing with a pseudo element
	        }
	
	        if (!singleColonForPseudoElements) {
	            // Assume modern browser and then check if successful
	            addRuleToSheet(sheet, doubleColonSelector, index);
	            if (rules.length <= index) {
	                singleColonForPseudoElements = true;
	            }
	        }
	        if (singleColonForPseudoElements) {
	            addRuleToSheet(sheet, singleColonSelector, index);
	        }
	
	        return true;
	    }
	
	    function toDoubleColonPseudoElements(selector) {
	        return selector.replace(singleColonPseudoElRegex, function (match, submatch1, submatch2, submatch3) {
	            return submatch1 + '::' + submatch3;
	        });
	    }
	
	    function toSingleColonPseudoElements(selector) {
	        return selector.replace(doubleColonPseudoElRegex, function(match, submatch1, submatch2) {
	            return ':' + submatch2;
	        })
	    }
	
	    function removeRule(rule) {
	        var sheet = rule.sheet;
	        if (sheet.deleteRule) {
	            sheet.deleteRule(rule.index);
	        } else if (sheet.removeRule) {
	            sheet.removeRule(rule.index);
	        }
	    }
	
	    function extend(dest, src) {
	        for (var key in src) {
	            if (!src.hasOwnProperty(key))
	                continue;
	            dest[key] = src[key];
	        }
	        return dest;
	    }
	
	    function aggregateStyles(rules) {
	        var aggregate = {};
	        for (var i = 0; i < rules.length; i++) {
	            extend(aggregate, declaredProperties(rules[i].style));
	        }
	        return aggregate;
	    }
	
	    function declaredProperties(style) {
	        var declared = {};
	        for (var i = 0; i < style.length; i++) {
	            declared[style[i]] = style[toCamelCase(style[i])];
	        }
	        return declared;
	    }
	
	    // IE9 stores rules with attributes (classes or ID's) adjacent in the opposite order as defined
	    // causing them to not be found, so this method swaps [#|.]sel1[#|.]sel2 to become [#|.]sel2[#|.]sel1
	    function swapAdjSelAttr(selector) {
	        var swap = '';
	        var lastIndex = 0;
	
	        while ((match = adjSelAttrRegex.exec(selector)) != null) {
	            if (match[0] === '')
	                break;
	            swap += selector.substring(lastIndex, match.index);
	            swap += selector.substr(match.index + match[1].length, match[2].length);
	            swap += selector.substr(match.index, match[1].length);
	            lastIndex = match.index + match[0].length;
	        }
	        swap += selector.substr(lastIndex);
	
	        return swap;
	    };
	
	    // FF and older browsers store rules with pseudo elements using single-colon syntax
	    function swapPseudoElSyntax(selector) {
	        if (doubleColonPseudoElRegex.exec(selector)) {
	            return toSingleColonPseudoElements(selector);
	        }
	        return selector;
	    }
	
	    function setStyleProperties(rule, properties) {
	        for (var key in properties) {
	            var value = properties[key];
	            var importantIndex = value.indexOf(' !important');
	
	            // Modern browsers seem to handle overrides fine, but IE9 doesn't
	            rule.style.removeProperty(key);
	            if (importantIndex > 0) {
	                rule.style.setProperty(key, value.substr(0, importantIndex), 'important');
	            } else {
	                rule.style.setProperty(key, value);
	            }
	        }
	    }
	
	    function toCamelCase(str) {
	        return str.replace(/-([a-z])/g, function (match, submatch) {
	            return submatch.toUpperCase();
	        });
	    }
	
	    function transformCamelCasedPropertyNames(oldProps) {
	        var newProps = {};
	        for (var key in oldProps) {
	            newProps[unCamelCase(key)] = oldProps[key];
	        }
	        return newProps;
	    }
	
	    function unCamelCase(str) {
	        return str.replace(/([A-Z])/g, function(match, submatch) {
	            return '-' + submatch.toLowerCase();
	        });
	    }
	
	    var Jss = function(doc) {
	        this.doc = doc;
	        this.head = this.doc.head || this.doc.getElementsByTagName('head')[0];
	        this.sheets = this.doc.styleSheets || [];
	    };
	
	    Jss.prototype = {
	        // Returns JSS rules (selector is optional)
	        get: function(selector) {
	            if (!this.defaultSheet) {
	                return {};
	            }
	            if (selector) {
	                return aggregateStyles(getRules(this.defaultSheet, selector));
	            }
	            var rules = getSelectorsAndRules(this.defaultSheet);
	            for (selector in rules) {
	                rules[selector] = aggregateStyles(rules[selector]);
	            }
	            return rules;
	        },
	        // Returns all rules (selector is required)
	        getAll: function(selector) {
	            var properties = {};
	            for (var i = 0; i < this.sheets.length; i++) {
	                extend(properties, aggregateStyles(getRules(this.sheets[i], selector)));
	            }
	            return properties;
	        },
	        // Adds JSS rules for the selector based on the given properties
	        set: function(selector, properties) {
	            if (!this.defaultSheet) {
	                this.defaultSheet = this._createSheet();
	            }
	            properties = transformCamelCasedPropertyNames(properties);
	            var rules = getRules(this.defaultSheet, selector);
	            if (!rules.length) {
	                rules = [addRule(this.defaultSheet, selector)];
	            }
	            for (var i = 0; i < rules.length; i++) {
	                setStyleProperties(rules[i], properties);
	            }
	        },
	        // Removes JSS rules (selector is optional)
	        remove: function(selector) {
	            if (!this.defaultSheet)
	                return;
	            if (!selector) {
	                this._removeSheet(this.defaultSheet);
	                delete this.defaultSheet;
	                return;
	            }
	            var rules = getRules(this.defaultSheet, selector);
	            for (var i = 0; i < rules.length; i++) {
	                removeRule(rules[i]);
	            }
	            return rules.length;
	        },
	        _createSheet: function() {
	            var styleNode = this.doc.createElement('style');
	            styleNode.type = 'text/css';
	            styleNode.rel = 'stylesheet';
	            this.head.appendChild(styleNode);
	            return styleNode.sheet;
	        },
	        _removeSheet: function(sheet) {
	            var node = sheet.ownerNode;
	            node.parentNode.removeChild(node);
	        }
	    };
	
	    var exports = new Jss(document);
	    exports.forDocument = function(doc) {
	        return new Jss(doc);
	    };
	    return exports;
	})();
	
	typeof module !== 'undefined' && module.exports && (module.exports = jss); // CommonJS support

/***/ },
/* 27 */
/*!***********************************************!*\
  !*** ./~/deadunit-core/src/processResults.js ***!
  \***********************************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = function returnResults(unitTestObject) {
	
	    var results;
	    var groups = {}
	    var groupMetadata = {}
	
	    var primaryGroup;
	    var ended = false
	
	    unitTestObject.events({
	        group: function(e) {
	            var g = {
	               parent: e.parent,
	               id: e.id,              // a unique id for the test group
	               type: 'group',         // indicates a test group (either a `Unit.test` call or `this.test`)
	               name: e.name,          // the name of the test
	               results: [],           // An array of test results, which can be of an `UnitTest` Result Types
	               exceptions: [],        // An array of uncaught exceptions thrown in the test,
	               time: e.time,
	               duration: 0            // the duration of the test from its start til the last test action (assert, log, etc)
	               //                       including asynchronous parts and including subtests
	               //syncDuration: _,      // the synchronous duration of the test (not including any asynchronous parts)
	               //totalSyncDuration: _  // syncDuration plus the before and after (if applicable)
	            }
	
	            if(primaryGroup === undefined) primaryGroup = g
	
	            groups[e.id] = g
	            groupMetadata[e.id] = {}
	            if(e.parent === undefined) {
	                results = g
	            } else {
	                groups[e.parent].results.push(g)
	            }
	        },
	        assert: function(e) {
	            e.type = 'assert'
	            groups[e.parent].results.push(e)
	            setGroupDuration(e.parent, e.time)
	        },
	        count: function(e) {
	            e.type = 'assert'
	            setGroupDuration(e.parent, e.time)
	
	            groupMetadata[e.parent].countInfo = e
	        },
	        exception: function(e) {
	            groups[e.parent].exceptions.push(e.error)
	            setGroupDuration(e.parent, e.time)
	        },
	        log: function(e) {
	            e.type = 'log'
	            groups[e.parent].results.push(e)
	            setGroupDuration(e.parent, e.time)
	        },
	        before: function(e) {
	            groups[e.parent].beforeStart = e.time
	        },
	        after: function(e) {
	            groups[e.parent].afterStart = e.time
	        },
	        beforeEnd: function(e) {
	            groups[e.parent].beforeDuration = e.time - groups[e.parent].beforeStart
	        },
	        afterEnd: function(e) {
	            groups[e.parent].afterDuration = e.time - groups[e.parent].afterStart
	        },
	        groupEnd: function(e) {
	            setGroupDuration(e.id, e.time)
	        },
	        end: function(e) {
	            primaryGroup.timeout = e.type === 'timeout'
	            setGroupDuration(primaryGroup.id, e.time)
	
	            // make the count assertions
	            eachTest(primaryGroup, function(subtest, parenttest) {
	                var countInfo = groupMetadata[subtest.id].countInfo
	                if(countInfo !== undefined) {
	                    var info = countInfo
	                    var actualCount = 0
	                    subtest.results.forEach(function(a) {
	                        if(a.type === 'assert' || a.type === 'group')
	                            actualCount++
	                    })
	
	                    subtest.results.splice(0,0,{
	                        parent: subtest.id,
	                        type: 'assert',
	                        success: actualCount === info.expected,
	                        time: info.time,
	                        sourceLines: info.sourceLines,
	                        file: info.file,
	                        line: info.line,
	                        column: info.column,
	                        expected: info.expected,
	                        actual: actualCount
	                    })
	                }
	            })
	
	            ended = true
	        }
	    })
	
	    function setGroupDuration(groupid, time) {
	        var newDuration = time - groups[groupid].time
	        if(newDuration > groups[groupid].duration) {
	            groups[groupid].duration = newDuration
	        }
	
	        if(groups[groupid].parent) {
	            setGroupDuration(groups[groupid].parent, time)
	        }
	    }
	
	    return results
	}
	
	
	// iterates through the tests and subtests leaves first (depth first)
	function eachTest(test, callback, parent) {
	    test.results.forEach(function(result) {
	        if(result.type === 'group') {
	            eachTest(result, callback, test)
	        }
	    })
	
	    callback(test, parent)
	}

/***/ },
/* 28 */
/*!*******************************************!*\
  !*** ./~/deadunit-core/src/isRelative.js ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	var path = __webpack_require__(/*! path */ 30)
	
	module.exports = function isRelative(p) {
	    var normal = path.normalize(p)
	    var absolute = path.resolve(p)
	    return normal != absolute && p.indexOf('://') === -1// second part for urls
	}

/***/ },
/* 29 */
/*!********************************************!*\
  !*** ./~/blocks.js/src/~/EventEmitterB.js ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(/*! events */ 42).EventEmitter
	var proto = __webpack_require__(/*! proto */ 8)
	var utils = __webpack_require__(/*! utils */ 22)
	
	module.exports = proto(EventEmitter, function(superclass) {
	
	    this.init = function() {
	        superclass.apply(this, arguments)
	
	        this.ifonHandlers = {}
	        this.ifoffHandlers = {}
	        this.ifonAllHandlers = []
	        this.ifoffAllHandlers = []
	    }
	
	    // callback will be triggered immediately if there is already a listener attached, or
	    // callback will be triggered when the first listener for the event is added
	    // (regardless of whether its done through on or once)
	    // parameters can be:
	        // event, callback - attach an ifon handler for the passed event
	        // callback - attach an ifon handler for all events
	    this.ifon = function(event, callback) {
	        if(event instanceof Function) {     // event not passed, only a callback
	            callback = event // fix the argument
	            for(var eventName in this._events) {
	                if(this.listeners(eventName).length > 0) {
	                    callback(eventName)
	                }
	            }
	        } else if(this.listeners(event).length > 0) {
	            callback(event)
	        }
	
	        addHandlerToList(this, 'ifonHandlers', event, callback)
	    }
	
	    // removes either:
	        // removeIfon() - all ifon handlers (if no arguments are passed), or
	        // removeIfon(event) - all ifon handlers for the passed event, or
	        // removeIfon(callback) - the passed ifon-all handler (if the first parameter is the callback)
	        // removeIfon(event, callback) - the specific passed callback for the passed event
	    this.removeIfon = function(event, callback) {
	        removeFromHandlerList(this, 'ifonHandlers', event, callback)
	    }
	
	    // callback will be triggered when the last listener for the 'click' event is removed (will not trigger immediately if there is no event listeners on call of ifoff)
	    // (regardless of whether this is done through removeListener or as a result of 'once' being fulfilled)
	    // parameters can be:
	        // event, callback - attach an ifoff handler for the passed event
	        // callback - attach an ifoff handler for all events
	    this.ifoff = function(event, callback) {
	        addHandlerToList(this, 'ifoffHandlers', event, callback)
	    }
	
	    // removes either:
	        // removeIfoff() - all ifoff handlers (if no arguments are passed), or
	        // removeIfoff(event) - all ifoff handlers for the passed event, or
	        // removeIfoff(callback) - the passed ifoff-all handler (if the first parameter is the callback)
	        // removeIfoff(event, callback) - the specific passed callback for the passed event
	    this.removeIfoff = function(event, callback) {
	        removeFromHandlerList(this, 'ifoffHandlers', event, callback)
	    }
	
	    // emitter is the emitter to proxy handler binding to
	    // options can have one of the following properties:
	        // only - an array of events to proxy
	        // except - an array of events to *not* proxy
	    this.proxy = function(emitter, options) {
	        if(options === undefined) options = {}
	        if(options.except !== undefined) {
	            var except = utils.arrayToMap(options.except)
	            var handleIt = function(event){return !(event in except)}
	        } else if(options.only !== undefined) {
	            var only = utils.arrayToMap(options.only)
	            var handleIt = function(event){return event in only}
	        } else {
	            var handleIt = function(){return true}
	        }
	
	        var that = this, handler;
	        this.ifon(function(event) {
	            if(handleIt(event)) {
	                emitter.on(event, handler = function() {
	                    that.emit.apply(that, [event].concat(Array.prototype.slice.call(arguments)))
	                })
	            }
	        })
	        this.ifoff(function(event) {
	            if(handleIt(event))
	                emitter.off(event, handler)
	        })
	    }
	
	    /*override*/ this.on = this.addListener = function(event, callback) {
	        var triggerIfOn = this.listeners(event).length === 0
	        superclass.prototype.on.apply(this,arguments)
	        if(triggerIfOn) triggerIfHandlers(this, 'ifonHandlers', event)
	    }
	
	    /*override*/ this.off = this.removeListener = function(event, callback) {
	        var triggerIfOff = this.listeners(event).length === 1
	        superclass.prototype.removeListener.apply(this,arguments)
	        if(triggerIfOff) triggerIfHandlers(this, 'ifoffHandlers', event)
	    }
	    /*override*/ this.removeAllListeners = function(event) {
	        var triggerIfOffForEvents = []
	        if(event !== undefined) {
	            if(this.listeners(event).length > 0) {
	                triggerIfOffForEvents.push(event)
	            }
	        } else {
	            for(var event in this._events) {
	                if(this.listeners(event).length > 0) {
	                    triggerIfOffForEvents.push(event)
	                }
	            }
	        }
	
	        superclass.prototype.removeAllListeners.apply(this,arguments)
	
	        for(var n=0; n<triggerIfOffForEvents.length; n++) {
	            triggerIfHandlers(this, 'ifoffHandlers', triggerIfOffForEvents[n])
	        }
	    }
	
	})
	
	
	// triggers the if handlers from the normal list and the "all" list
	function triggerIfHandlers(that, handlerListName, event) {
	    triggerIfHandlerList(that[handlerListName][event], event)
	    triggerIfHandlerList(that[normalHandlerToAllHandlerProperty(handlerListName)], event)
	}
	
	
	// triggers the if handlers from a specific list
	// ya these names are confusing, sorry : (
	function triggerIfHandlerList(handlerList, event) {
	    if(handlerList !== undefined) {
	        for(var n=0; n<handlerList.length; n++) {
	            handlerList[n](event)
	        }
	    }
	}
	
	function addHandlerToList(that, handlerListName, event, callback) {
	    if(event instanceof Function) {
	        // correct arguments
	        callback = event
	        event = undefined
	    }
	
	    if(event !== undefined && callback !== undefined) {
	        var handlerList = that[handlerListName][event]
	        if(handlerList === undefined) {
	            handlerList = that[handlerListName][event] = []
	        }
	
	        handlerList.push(callback)
	    } else {
	        that[normalHandlerToAllHandlerProperty(handlerListName)].push(callback)
	    }
	}
	
	function removeFromHandlerList(that, handlerListName, event, callback) {
	    if(event instanceof Function) {
	        // correct arguments
	        callback = event
	        event = undefined
	    }
	
	    if(event !== undefined && callback !== undefined) {
	        removeCallbackFromList(that[handlerListName][event], callback)
	    } else if(event !== undefined) {
	        delete that[handlerListName][event]
	    } else if(callback !== undefined) {
	        var allHandlerListName = normalHandlerToAllHandlerProperty(handlerListName)
	        removeCallbackFromList(that[allHandlerListName], callback)
	    } else {
	        var allHandlerListName = normalHandlerToAllHandlerProperty(handlerListName)
	        that[handlerListName] = {}
	        that[allHandlerListName] = []
	    }
	}
	
	function normalHandlerToAllHandlerProperty(handlerListName) {
	    if(handlerListName === 'ifonHandlers')
	        return 'ifonAllHandlers'
	    if(handlerListName === 'ifoffHandlers')
	        return 'ifoffAllHandlers'
	}
	
	function removeCallbackFromList(list, callback) {
	    var index = list.indexOf(callback)
	    list.splice(index,1)
	}

/***/ },
/* 30 */
/*!****************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/path-browserify/index.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }
	
	  return parts;
	}
	
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};
	
	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;
	
	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();
	
	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }
	
	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }
	
	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)
	
	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');
	
	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};
	
	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';
	
	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');
	
	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }
	
	  return (isAbsolute ? '/' : '') + path;
	};
	
	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};
	
	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};
	
	
	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);
	
	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }
	
	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }
	
	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }
	
	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));
	
	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }
	
	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }
	
	  outputParts = outputParts.concat(toParts.slice(samePartsLength));
	
	  return outputParts.join('/');
	};
	
	exports.sep = '/';
	exports.delimiter = ':';
	
	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];
	
	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }
	
	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }
	
	  return root + dir;
	};
	
	
	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};
	
	
	exports.extname = function(path) {
	  return splitPath(path)[3];
	};
	
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}
	
	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! (webpack)/~/node-libs-browser/~/process/browser.js */ 20)))

/***/ },
/* 31 */
/*!**************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/url/url.js ***!
  \**************************************************/
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var punycode = __webpack_require__(/*! punycode */ 47);
	
	exports.parse = urlParse;
	exports.resolve = urlResolve;
	exports.resolveObject = urlResolveObject;
	exports.format = urlFormat;
	
	exports.Url = Url;
	
	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}
	
	// Reference: RFC 3986, RFC 1808, RFC 2396
	
	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,
	
	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
	
	    // RFC 2396: characters not allowed for various reasons.
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
	
	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = ['\''].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    },
	    querystring = __webpack_require__(/*! querystring */ 48);
	
	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && isObject(url) && url instanceof Url) return url;
	
	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}
	
	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }
	
	  var rest = url;
	
	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();
	
	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }
	
	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }
	
	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {
	
	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c
	
	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.
	
	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	
	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }
	
	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }
	
	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;
	
	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);
	
	    // pull out port.
	    this.parseHost();
	
	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';
	
	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';
	
	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }
	
	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      this.hostname = this.hostname.toLowerCase();
	    }
	
	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a puny coded representation of "domain".
	      // It only converts the part of the domain name that
	      // has non ASCII characters. I.e. it dosent matter if
	      // you call it with a domain that already is in ASCII.
	      var domainArray = this.hostname.split('.');
	      var newOut = [];
	      for (var i = 0; i < domainArray.length; ++i) {
	        var s = domainArray[i];
	        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
	            'xn--' + punycode.encode(s) : s);
	      }
	      this.hostname = newOut.join('.');
	    }
	
	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;
	
	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }
	
	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {
	
	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }
	
	
	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) this.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }
	
	  //to support http.request
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }
	
	  // finally, reconstruct the href based on what has been validated.
	  this.href = this.format();
	  return this;
	};
	
	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (isString(obj)) obj = urlParse(obj);
	  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
	  return obj.format();
	}
	
	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }
	
	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';
	
	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }
	
	  if (this.query &&
	      isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }
	
	  var search = this.search || (query && ('?' + query)) || '';
	
	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';
	
	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }
	
	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;
	
	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');
	
	  return protocol + host + pathname + search + hash;
	};
	
	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}
	
	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};
	
	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}
	
	Url.prototype.resolveObject = function(relative) {
	  if (isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }
	
	  var result = new Url();
	  Object.keys(this).forEach(function(k) {
	    result[k] = this[k];
	  }, this);
	
	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;
	
	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }
	
	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    Object.keys(relative).forEach(function(k) {
	      if (k !== 'protocol')
	        result[k] = relative[k];
	    });
	
	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }
	
	    result.href = result.format();
	    return result;
	  }
	
	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      Object.keys(relative).forEach(function(k) {
	        result[k] = relative[k];
	      });
	      result.href = result.format();
	      return result;
	    }
	
	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }
	
	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];
	
	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }
	
	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especialy happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!isNull(result.pathname) || !isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }
	
	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }
	
	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host) && (last === '.' || last === '..') ||
	      last === '');
	
	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last == '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }
	
	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }
	
	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }
	
	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');
	
	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especialy happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }
	
	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);
	
	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }
	
	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }
	
	  //to support request.http
	  if (!isNull(result.pathname) || !isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};
	
	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) this.hostname = host;
	};
	
	function isString(arg) {
	  return typeof arg === "string";
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isNull(arg) {
	  return arg === null;
	}
	function isNullOrUndefined(arg) {
	  return  arg == null;
	}


/***/ },
/* 32 */
/*!***************************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/util/~/inherits/inherits_browser.js ***!
  \***************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 33 */
/*!******************************************************!*\
  !*** ./~/blocks.js/~/trimArguments/trimArguments.js ***!
  \******************************************************/
/***/ function(module, exports, __webpack_require__) {

	// resolves varargs variable into more usable form
	// args - should be a function arguments variable
	// returns a javascript Array object of arguments that doesn't count trailing undefined values in the length
	module.exports = function(theArguments) {
	    var args = Array.prototype.slice.call(theArguments, 0)
	
	    var count = 0;
	    for(var n=args.length-1; n>=0; n--) {
	        if(args[n] === undefined)
	            count++
	        else
	            break
	    }
	    args.splice(args.length-count, count)
	    return args
	}

/***/ },
/* 34 */
/*!******************************************!*\
  !*** ./~/blocks.js/~/hashmap/hashmap.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * HashMap - HashMap Class for JavaScript
	 * @author Ariel Flesler <aflesler@gmail.com>
	 * @version 2.0.1
	 * Homepage: https://github.com/flesler/hashmap
	 */
	
	(function(factory) {
		if (true) {
			// AMD. Register as an anonymous module.
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (typeof module === 'object') {
			// Node js environment
			var HashMap = module.exports = factory();
			// Keep it backwards compatible
			HashMap.HashMap = HashMap;
		} else {
			// Browser globals (this is window)
			this.HashMap = factory();
		}
	}(function() {
	
		function HashMap(other) {
			this.clear();
			switch (arguments.length) {
				case 0: break;
				case 1: this.copy(other); break;
				default: multi(this, arguments); break;
			}
		}
	
		var proto = HashMap.prototype = {
			constructor:HashMap,
	
			get:function(key) {
				var data = this._data[this.hash(key)];
				return data && data[1];
			},
	
			set:function(key, value) {
				// Store original key as well (for iteration)
				this._data[this.hash(key)] = [key, value];
			},
	
			multi:function() {
				multi(this, arguments);
			},
	
			copy:function(other) {
				for (var key in other._data) {
					this._data[key] = other._data[key];
				}
			},
	
			has:function(key) {
				return this.hash(key) in this._data;
			},
	
			search:function(value) {
				for (var key in this._data) {
					if (this._data[key][1] === value) {
						return this._data[key][0];
					}
				}
	
				return null;
			},
	
			remove:function(key) {
				delete this._data[this.hash(key)];
			},
	
			type:function(key) {
				var str = Object.prototype.toString.call(key);
				var type = str.slice(8, -1).toLowerCase();
				// Some browsers yield DOMWindow for null and undefined, works fine on Node
				if (type === 'domwindow' && !key) {
					return key + '';
				}
				return type;
			},
	
			keys:function() {
				var keys = [];
				this.forEach(function(value, key) { keys.push(key); });
				return keys;
			},
	
			values:function() {
				var values = [];
				this.forEach(function(value) { values.push(value); });
				return values;
			},
	
			count:function() {
				return this.keys().length;
			},
	
			clear:function() {
				// TODO: Would Object.create(null) make any difference
				this._data = {};
			},
	
			clone:function() {
				return new HashMap(this);
			},
	
			hash:function(key) {
				switch (this.type(key)) {
					case 'undefined':
					case 'null':
					case 'boolean':
					case 'number':
					case 'regexp':
						return key + '';
	
					case 'date':
						return ':' + key.getTime();
	
					case 'string':
						return '"' + key;
	
					case 'array':
						var hashes = [];
						for (var i = 0; i < key.length; i++) {
							hashes[i] = this.hash(key[i]);
						}
						return '[' + hashes.join('|');
	
					default:
						// TODO: Don't use expandos when Object.defineProperty is not available?
						if (!key._hmuid_) {
							key._hmuid_ = ++HashMap.uid;
							hide(key, '_hmuid_');
						}
	
						return '{' + key._hmuid_;
				}
			},
	
			forEach:function(func) {
				for (var key in this._data) {
					var data = this._data[key];
					func.call(this, data[1], data[0]);
				}
			}
		};
	
		HashMap.uid = 0;
	
		//- Automatically add chaining to some methods
	
		for (var method in proto) {
			// Skip constructor, valueOf, toString and any other built-in method
			if (method === 'constructor' || !proto.hasOwnProperty(method)) {
				continue;
			}
			var fn = proto[method];
			if (fn.toString().indexOf('return ') === -1) {
				proto[method] = chain(fn);
			}
		}
	
		//- Utils
	
		function multi(map, args) {
			for (var i = 0; i < args.length; i += 2) {
				map.set(args[i], args[i+1]);
			}
		}
	
		function chain(fn) {
			return function() {
				fn.apply(this, arguments);
				return this;
			};
		}
	
		function hide(obj, prop) {
			// Make non iterable if supported
			if (Object.defineProperty) {
				Object.defineProperty(obj, prop, {enumerable:false});
			}
		}
	
		return HashMap;
	}));


/***/ },
/* 35 */
/*!******************************************!*\
  !*** ./~/blocks.js/~/observe/observe.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	var proto = __webpack_require__(/*! proto */ 50)
	var EventEmitter = __webpack_require__(/*! events */ 42).EventEmitter
	var utils = __webpack_require__(/*! ./utils */ 43)
	
	
	// emits the event:
	    // change - the event data is an object of one of the following forms:
	        // {id:_, type: 'set', property: propertyList}
	        // {id:_, type: 'added', property: propertyList, index:_, count: numberOfElementsAdded}
	        // {id:_, type: 'removed', property: propertyList, index:_, values: removedValues}
	var Observe = module.exports = proto(EventEmitter, function() {
	
	    // static members
	
	    this.init = function(obj) {
	        this.subject = obj
	
	        this.setMaxListeners(1000)
	    }
	
	    // instance members
	
	    // gets an element or member of the subject and returns another Observee
	    // changes to the returned Observee will be emitted by its parent as well
	    this.get = function(property) {
	        return ObserveeChild(this, parsePropertyList(property))
	    }
	
	    // sets a value on the subject
	    // property - either an array of members to select, or a string where properties to select are separated by dots
	    // value - the value to set
	    this.set = function(property, value) {
	        setInternal(this, parsePropertyList(property), value, {})
	    }
	
	    // pushes a value onto a list
	    this.push = function(/*value...*/) {
	        pushInternal(this, [], arguments, {})
	    }
	
	
	    // index is the index to remove/insert at
	    // countToRemove is the number to remove
	    // elementsToAdd is a list of elements to add
	    this.splice = function(/*index, countToRemove[, elementsToAdd]*/) {
	        return spliceInternal(this, [], arguments, {})
	    }
	
	    // use this instead of concat for mutation behavior
	    this.append = function(arrayToAppend) {
	        appendInternal(this, [], arguments, {})
	    }
	
	    this.id = function(id) {
	        return ObserveeChild(this, [], {id: id})
	        //return idFunction(this, [], id)
	    }
	
	    // For the returned object, any property added via set, push, splice, or append joins an internal observee together with this observee, so that
	    //      the internal observee and the containing observee will both send 'change' events appropriately
	    // collapse - (default: false) if true, any property added will be set to the subject of the value added (so that value won't be an observee anymore
	        // note: only use collapse:true if the observees you're unioning isn't actually an object that inherits from an observee - any instance methods on the observee that come from child classes won't be accessible anymore
	        // e.g. var x = observe({a:5})
	        //      var b = observe({})
	        //      x.subject.a === 5    ;; true
	        //      b.union(true).set('x', x)
	        //      b.subject.x.a === 5            ;; true
	        //      b.subject.x.subject.a === 5    ;; false
	    this.union = function(collapse) {
	        if(collapse === undefined) collapse = false
	        return ObserveeChild(this, [], {union: collapse})
	    }
	
	
	    /* pause and unpause may cause weird affects in certain cases (e.g. if you remove an element at index 4 and *then* add an element at index 2)
	    // pause sending events (for when you want to do a lot of things to an object)
	    this.pause = function() {
	        this.paused = true
	    }
	    this.unpause = function() {
	        this.paused = undefined
	        sendEvent(this)
	    }*/
	})
	
	
	function parsePropertyList(property) {
	    if(!(property instanceof Array)) {
	        property = property.toString().split('.')
	    }
	
	    return property
	}
	
	function getPropertyPointer(subject, propertyList) {
	    var current = subject
	    for(var n=0; n<propertyList.length-1; n++) {
	        current = current[propertyList[n]]
	    }
	
	    return {obj: current, key:propertyList[n]}
	}
	
	var getPropertyValue = module.exports.getPropertyValue = function(subject, property) {
	    var pointer = getPropertyPointer(subject, property)
	    if(pointer.key !== undefined) {
	        return pointer.obj[pointer.key]
	    } else {
	        return pointer.obj
	    }
	}
	
	// private
	
	// options can have the properties:
	    // union - if true, any value set, pushed, appended, or spliced onto the observee is unioned
	var ObserveeChild = proto(EventEmitter, function() {
	
	    this.init = function(parent, propertyList, options) {
	        if(options === undefined) this.options = {}
	        else                      this.options = options
	
	        if(parent._observeeParent !== undefined)
	            this._observeeParent = parent._observeeParent
	        else
	            this._observeeParent = parent
	
	        this.property = propertyList
	        this.subject = getPropertyValue(parent.subject, propertyList)
	
	        var that = this
	        parent.on('change', function(change) {
	            var answers = changeQuestions(that.property, change)
	
	            if(answers.isWithin ) {
	                that.emit('change', {type:change.type, property: change.property.slice(that.property.length), index:change.index, count:change.count, removed: change.removed})
	            } else if(answers.couldRelocate) {
	                if(change.type === 'removed') {
	                    var relevantIndex = that.property[change.property.length]
	                    var removedIndexesAreBeforeIndexOfObserveeChild = change.index + change.removed.length - 1 < relevantIndex
	
	                    if(removedIndexesAreBeforeIndexOfObserveeChild) {
	                        that.property[change.property.length] = relevantIndex - change.removed.length // change the propertyList to match the new index
	                    }
	                } else if(change.type === 'added') {
	                    var relevantIndex = that.property[change.property.length]
	                    if(change.index < relevantIndex) {
	                        that.property[change.property.length] = relevantIndex + change.count // change the propertyList to match the new index
	                    }
	                }
	            }
	        })
	    }
	
	    this.get = function(property) {
	        return this._observeeParent.get(this.property.concat(parsePropertyList(property)))
	    }
	
	    this.set = function(property, value) {
	        setInternal(this._observeeParent, this.property.concat(parsePropertyList(property)), value, this.options)
	    }
	
	    this.push = function(/*values...*/) {
	        pushInternal(this._observeeParent, this.property, arguments, this.options)
	    }
	
	    this.splice = function(index, countToRemove/*[, elementsToAdd....]*/) {
	        spliceInternal(this._observeeParent, this.property, arguments, this.options)
	    }
	
	    this.append = function(/*[property,] arrayToAppend*/) {
	        appendInternal(this._observeeParent, this.property, arguments, this.options)
	    }
	
	    this.id = function(id) {
	        return ObserveeChild(this, this.property, utils.merge({}, this.options, {id: id}))
	        //return idFunction(this._observeeParent, this.property, id)
	    }
	
	    this.union = function(collapse) {
	        if(collapse === undefined) collapse = false
	        return ObserveeChild(this, [], utils.merge({}, this.options, {union: collapse}))
	    }
	
	})
	
	     /*
	function idFunction(that, propertyList, id) {
	    var result = {
	        set: function(property, value) {
	            var fullPropertyList = propertyList.concat(parsePropertyList(property))
	            setInternal(that, fullPropertyList, value, id)
	        },
	        push: function() {
	            pushInternal(that, propertyList, arguments, id)
	        },
	        splice: function() {
	            spliceInternal(that, propertyList, arguments, id)
	        },
	        append: function() {
	            appendInternal(that, propertyList, arguments, id)
	        },
	        get: function() {
	
	        }
	    }
	}
	*/
	
	// that - the Observee object
	function setInternal(that, propertyList, value, options) {
	    var pointer = getPropertyPointer(that.subject, propertyList)
	
	    var internalObservee = value
	    if(options.union === true) {
	        value = value.subject
	    }
	
	    pointer.obj[pointer.key] = value
	
	    var event = {type: 'set', property: propertyList}
	    if(options.id !== undefined) event.id = options.id
	    that.emit('change',event)
	
	    if(options.union !== undefined)
	        unionizeEvents(that, internalObservee, propertyList, options.union)
	}
	
	function pushInternal(that, propertyList, args, options) {
	    var array = getPropertyValue(that.subject, propertyList)
	    var originalLength = array.length
	    array.push.apply(array, args)
	
	    var internalObservees = unionizeList(array, originalLength, args.length, options.union)
	
	    var event = {type: 'added', property: propertyList, index: originalLength, count: 1}
	    if(options.id !== undefined) event.id = options.id
	    that.emit('change', event)
	
	    unionizeListEvents(that, internalObservees, propertyList, options.union)
	}
	
	function spliceInternal(that, propertyList, args, options) {
	    var index = args[0]
	    var countToRemove = args[1]
	
	    var array = getPropertyValue(that.subject, propertyList)
	    var result = array.splice.apply(array, args)
	
	    if(countToRemove > 0) {
	        var event = {type: 'removed', property: propertyList, index: index, removed: result}
	        if(options.id !== undefined) event.id = options.id
	        that.emit('change', event)
	    }
	    if(args.length > 2) {
	        var event = {type: 'added', property: propertyList, index: index, count: args.length-2}
	
	        var internalObservees = unionizeList(array, index, event.count, options.union)
	
	        if(options.id !== undefined) event.id = options.id
	        that.emit('change', event)
	
	        unionizeListEvents(that, internalObservees, propertyList, options.union)
	    }
	
	    return result
	}
	
	// note: I'm not using splice to do this as an optimization (because otherwise the property list would have to be parsed twice and the value gotten twice) - maybe this optimization wasn't worth it but its already done
	function appendInternal(that, propertyList, args, options) {
	    var arrayToAppend = args[0]
	    if(arrayToAppend.length === 0) return; //nothing to do
	
	    var array = getPropertyValue(that.subject, propertyList)
	    var originalLength = array.length
	
	    var spliceArgs = [originalLength, 0]
	    spliceArgs = spliceArgs.concat(arrayToAppend)
	    var oldLength = array.length
	    array.splice.apply(array, spliceArgs)
	
	    var internalObservees = unionizeList(array, oldLength, array.length, options.union)
	
	    var event = {type: 'added', property: propertyList, index: originalLength, count: arrayToAppend.length}
	    if(options.id !== undefined) event.id = options.id
	    that.emit('change', event)
	
	    unionizeListEvents(that, internalObservees, propertyList, options.union)
	}
	
	// sets a slice of elements to their subjects and
	// returns the original observee objects along with their indexes
	function unionizeList(array, start, count, union) {
	    var internalObservees = [] // list of observees and their property path
	    if(union !== undefined) {
	        var afterEnd = start+count
	        for(var n=start; n<afterEnd; n++) {
	            internalObservees.push({obj: array[n], index: n})
	            if(union === true)
	                array[n] = array[n].subject
	        }
	    }
	
	    return internalObservees
	}
	
	// runs unionizeEvents for elements in a list
	// internalObservees should be the result from `unionizeList`
	function unionizeListEvents(that, internalObservees, propertyList, collapse) {
	    for(var n=0; n<internalObservees.length; n++) {
	        unionizeEvents(that, internalObservees[n].obj, propertyList.concat(internalObservees[n].index), collapse)
	    }
	}
	
	
	// sets up the union change events for an observee with one of its inner properties
	// parameters:
	    // that - the container observee
	    // innerObservee - the contained observee
	    // propertyList - the propertyList to unionize
	    // collapse - the union option (true for collapse)
	function unionizeEvents(that, innerObservee, propertyList, collapse) {
	    var propertyListDepth = propertyList.length
	
	    if(innerObservee.on === undefined || innerObservee.emit === undefined || innerObservee.removeListener === undefined || innerObservee.set === undefined) {
	        throw new Error("Attempting to union a value that isn't an observee")
	    }
	
	    var innerChangeHandler, containerChangeHandler
	    var ignorableContainerEvents = [], ignorableInnerEvents = []
	    innerObservee.on('change', innerChangeHandler = function(change) {
	        if(ignorableInnerEvents.indexOf(change) === -1) {        // don't run this for events generated by the union event handlers
	            if(collapse) {
	                var property = propertyList.concat(change.property)
	            } else {
	                var property = propertyList.concat(['subject']).concat(change.property)
	            }
	
	            var containerChange = utils.merge({}, change, {property: property})
	            ignorableContainerEvents.push(containerChange)
	            that.emit('change', containerChange)
	        }
	    })
	    that.on('change', containerChangeHandler = function(change) {
	        var changedPropertyDepth = change.property.length
	
	        var answers = changeQuestions(propertyList, change)
	        var changeIsWithinInnerProperty = answers.isWithin
	        var changeCouldRelocateInnerProperty = answers.couldRelocate
	
	        if(changeIsWithinInnerProperty && ignorableContainerEvents.indexOf(change) === -1) {   // don't run this for events generated by the union event handlers
	            if(collapse) {
	                var property = change.property.slice(propertyListDepth)
	            } else {
	                var property = change.property.slice(propertyListDepth+1) // +1 for the 'subject'
	            }
	
	            var innerObserveeEvent = utils.merge({}, change, {property: property})
	            ignorableInnerEvents.push(innerObserveeEvent)
	            innerObservee.emit('change', innerObserveeEvent)
	        } else if(changeCouldRelocateInnerProperty) {
	            if(change.type === 'set' /*&& changedPropertyDepth <= propertyListDepth  - this part already done above*/) {
	                removeUnion()
	            } else if(change.type === 'removed') {
	                var relevantIndex = propertyList[change.property.length]
	                var removedIndexesContainsIndexOfInnerObservee = change.index <= relevantIndex && relevantIndex <= change.index + change.removed.length - 1
	                var removedIndexesAreBeforeIndexOfInnerObservee = change.index + change.removed.length - 1 < relevantIndex && relevantIndex
	
	                if(removedIndexesContainsIndexOfInnerObservee && changedPropertyDepth <= propertyListDepth+1) {
	                    removeUnion()
	                } else if(removedIndexesAreBeforeIndexOfInnerObservee) {
	                    propertyList[change.property.length] = relevantIndex - change.removed.length // change the propertyList to match the new index
	                }
	            } else if(change.type === 'added') {
	                var relevantIndex = propertyList[change.property.length]
	                if(change.index < relevantIndex) {
	                    propertyList[change.property.length] = relevantIndex + change.count // change the propertyList to match the new index
	                }
	            }
	        }
	    })
	
	    var removeUnion = function() {
	        innerObservee.removeListener('change', innerChangeHandler)
	        that.removeListener('change', containerChangeHandler)
	    }
	}
	
	
	// answers certain questions about a change compared to a property list
	// returns an object like: {
	    // isWithin: _,           // true if changeIsWithinInnerProperty
	    // couldRelocate: _       // true if changeCouldRelocateInnerProperty or if innerProperty might be removed
	// }
	function changeQuestions(propertyList, change) {
	    var propertyListDepth = propertyList.length
	
	    var changeIsWithinInnerProperty = true // assume true until proven otherwise
	    var changeCouldRelocateInnerProperty = true // assume true until prove otherwise
	    for(var n=0; n<propertyListDepth; n++) {
	        if(change.property[n] !== propertyList[n]) {
	            changeIsWithinInnerProperty = false
	            if(n<change.property.length) {
	                changeCouldRelocateInnerProperty = false
	            }
	        }
	    }
	
	    if(change.property.length <= propertyListDepth) {
	        changeIsWithinInnerProperty = false
	    } else {
	        changeCouldRelocateInnerProperty = false
	    }
	
	    return {couldRelocate: changeCouldRelocateInnerProperty, isWithin: changeIsWithinInnerProperty}
	}

/***/ },
/* 36 */
/*!******************************************!*\
  !*** ./~/deadunit-core/~/proto/proto.js ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var noop = function() {}
	
	var prototypeName='prototype', undefined, protoUndefined='undefined', init='init', ownProperty=({}).hasOwnProperty; // minifiable variables
	function proto() {
	    var args = arguments // minifiable variables
	
	    if(args.length == 1) {
	        var parent = {init: noop}
	        var prototypeBuilder = args[0]
	
	    } else { // length == 2
	        var parent = args[0]
	        var prototypeBuilder = args[1]
	    }
	
	    // special handling for Error objects
	    var namePointer = {}    // name used only for Error Objects
	    if([Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError].indexOf(parent) !== -1) {
	        parent = normalizeErrorObject(parent, namePointer)
	    }
	
	    // set up the parent into the prototype chain if a parent is passed
	    var parentIsFunction = typeof(parent) === "function"
	    if(parentIsFunction) {
	        prototypeBuilder[prototypeName] = parent[prototypeName]
	    } else {
	        prototypeBuilder[prototypeName] = parent
	    }
	
	    // the prototype that will be used to make instances
	    var prototype = new prototypeBuilder(parent)
	    namePointer.name = prototype.name
	
	    // if there's no init, assume its inheriting a non-proto class, so default to applying the superclass's constructor.
	    if(!prototype[init] && parentIsFunction) {
	        prototype[init] = function() {
	            parent.apply(this, arguments)
	        }
	    }
	
	    // constructor for empty object which will be populated via the constructor
	    var F = function() {}
	        F[prototypeName] = prototype    // set the prototype for created instances
	
	    var constructorName = prototype.name?prototype.name:''
	    if(prototype[init] === undefined || prototype[init] === noop) {
	        var ProtoObjectFactory = new Function('F',
	            "return function " + constructorName + "(){" +
	                "return new F()" +
	            "}"
	        )(F)
	    } else {
	        // dynamically creating this function cause there's no other way to dynamically name a function
	        var ProtoObjectFactory = new Function('F','i','u','n', // shitty variables cause minifiers aren't gonna minify my function string here
	            "return function " + constructorName + "(){ " +
	                "var x=new F(),r=i.apply(x,arguments)\n" +    // populate object via the constructor
	                "if(r===n)\n" +
	                    "return x\n" +
	                "else if(r===u)\n" +
	                    "return n\n" +
	                "else\n" +
	                    "return r\n" +
	            "}"
	        )(F, prototype[init], proto[protoUndefined]) // note that n is undefined
	    }
	
	    prototype.constructor = ProtoObjectFactory;    // set the constructor property on the prototype
	
	    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
	    for(var n in prototype) {
	        addProperty(ProtoObjectFactory, prototype, n)
	    }
	
	    // add properties from parent that don't exist in the static class object yet
	    for(var n in parent) {
	        if(ownProperty.call(parent, n) && ProtoObjectFactory[n] === undefined) {
	            addProperty(ProtoObjectFactory, parent, n)
	        }
	    }
	
	    ProtoObjectFactory.parent = parent;            // special parent property only available on the returned proto class
	    ProtoObjectFactory[prototypeName] = prototype  // set the prototype on the object factory
	
	    return ProtoObjectFactory;
	}
	
	proto[protoUndefined] = {} // a special marker for when you want to return undefined from a constructor
	
	module.exports = proto
	
	function normalizeErrorObject(ErrorObject, namePointer) {
	    function NormalizedError() {
	        var tmp = new ErrorObject(arguments[0])
	        tmp.name = namePointer.name
	
	        this.message = tmp.message
	        if(Object.defineProperty) {
	            /*this.stack = */Object.defineProperty(this, 'stack', { // getter for more optimizy goodness
	                get: function() {
	                    return tmp.stack
	                },
	                configurable: true // so you can change it if you want
	            })
	        } else {
	            this.stack = tmp.stack
	        }
	
	        return this
	    }
	
	    var IntermediateInheritor = function() {}
	        IntermediateInheritor.prototype = ErrorObject.prototype
	    NormalizedError.prototype = new IntermediateInheritor()
	
	    return NormalizedError
	}
	
	function addProperty(factoryObject, prototype, property) {
	    try {
	        var info = Object.getOwnPropertyDescriptor(prototype, property)
	        if(info.get !== undefined || info.get !== undefined && Object.defineProperty !== undefined) {
	            Object.defineProperty(factoryObject, property, info)
	        } else {
	            factoryObject[property] = prototype[property]
	        }
	    } catch(e) {
	        // do nothing, if a property (like `name`) can't be set, just ignore it
	    }
	}

/***/ },
/* 37 */
/*!*******************************************************!*\
  !*** ./~/deadunit-core/~/async-future/asyncFuture.js ***!
  \*******************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var trimArgs = __webpack_require__(/*! trimArguments */ 51)
	
	
	module.exports = Future
	
	Future.debug = false // switch this to true if you want ids and long stack traces
	
	var curId = 0         // for ids\
	function Future(value) {
		if(arguments.length > 0) {
			var f = new Future()
	        f.return(value)
	        return f
		} else {
	        this.isResolved = false
	        this.queue = []
	        this.n = 1 // future depth (for preventing "too much recursion" RangeErrors)
	        if(Future.debug) {
	            curId++
	            this.id = curId
	        }
	    }
	}
	
	// static methods
	
	// has one parameter: either a bunch of futures, or a single array of futures
	// returns a promise that resolves when one of them errors, or when all of them succeeds
	Future.all = function() {
	    if(arguments[0] instanceof Array) {
	        var futures = arguments[0]
	    } else {
	        var futures = trimArgs(arguments)
	    }
	
	    var f = new Future()
	    var results = []
	
	    if(futures.length > 0) {
	        var current = futures[0]
	        futures.forEach(function(future, index) {
	            current = current.then(function(v) {
	                results[index] = v
	                return futures[index+1]
	            })
	        })
	
	        //if
	        current.catch(function(e) {
	            f.throw(e)
	        })
	        // else
	        current.then(function() {
	            f.return(results)
	        })
	
	
	    } else {
	        f.return(results)
	    }
	
	    return f
	}
	
	// either used like futureWrap(function(){ ... })(arg1,arg2,etc) or
	//  futureWrap(object, 'methodName')(arg1,arg2,etc)
	Future.wrap = function() {
	    // function
	    if(arguments.length === 1) {
	        var fn = arguments[0]
	        var object = undefined
	
	
	    // object, function
	    } else {
	        var object = arguments[0]
	        var fn = object[arguments[1]]
	    }
	
	    return function() {
	        var args = Array.prototype.slice.call(arguments)
	        var future = new Future
	        args.push(future.resolver())
	        var me = this
	        if(object) me = object
	        fn.apply(me, args)
	        return future
	    }
	}
	
	// future wraps a function who's callback only takes one parameter - the return value (no error is available)
	// eg: function(result) {}
	Future.wrapSingleParameter = function() {
	    if(arguments.length === 1) {
	        var fn = arguments[0]
	    } else {
	        var object = arguments[0]
	        var method = arguments[1]
	        var fn = object[method]
	    }
	
	    return function() {
	        var args = Array.prototype.slice.call(arguments)
			var future = new Future
			args.push(function(result) {
			    future.return(result)
			})
			var me = this
	        if(object) me = object
	        fn.apply(me, args)
			return future
	    }
	}
	
	
	// default
	var unhandledErrorHandler = function(e) {
	    setTimeout(function() {
	        throw e
	    },0)
	}
	
	// setup unhandled error handler
	// unhandled errors happen when done is called, and  then an exception is thrown from the future
	Future.error = function(handler) {
	    unhandledErrorHandler = handler
	}
	
	// instance methods
	
	// returns a value for the future (can only be executed once)
	// if there are callbacks waiting on this value, they are run in the next tick
	    // (ie they aren't run immediately, allowing the current thread of execution to complete)
	Future.prototype.return = function(v) {
	    resolve(this, 'return', v)
	}
	Future.prototype.throw = function(e) {
	    if(this.location !== undefined) {
	        e.stack += '\n    ---------------------------\n'+this.location.stack.split('\n').slice(4).join('\n')
	    }
	    resolve(this, 'error', e)
	    return this
	}
	
	function setNext(that, future) {
	    resolve(that, 'next', future)
	}
	
	function wait(that, cb) {
	    if(that.isResolved) {
	        executeCallbacks(that, [cb])
	    } else {
	        that.queue.push(cb)
	    }
	}
	
	// duck typing to determine if something is or isn't a future
	var isLikeAFuture = Future.isLikeAFuture = function(x) {
	    return x.isResolved !== undefined && x.queue !== undefined && x.then !== undefined
	}
	
	function waitOnResult(f, result, cb) {
	    wait(result, function() {
	        if(this.hasError) {
	            f.throw(this.error)
	        } else if(this.hasNext) {
	            waitOnResult(f, this.next, cb)
	        } else {
	            try {
	                setNext(f, executeCallback(cb,this.result))
	            } catch(e) {
	                f.throw(e)
	            }
	        }
	    })
	}
	
	
	// cb takes one parameter - the value returned
	// cb can return a Future, in which case the result of that Future is passed to next-in-chain
	Future.prototype.then = function(cb) {
	    var f = createChainFuture(this)
	    wait(this, function() {
	        if(this.hasError)
	            f.throw(this.error)
	        else if(this.hasNext)
	            waitOnResult(f, this.next, cb)
	        else {
	            try {
	                setNext(f, executeCallback(cb,this.result))
	            } catch(e) {
	                f.throw(e)
	            }
	        }
	    })
	    return f
	}
	// cb takes one parameter - the error caught
	// cb can return a Future, in which case the result of that Future is passed to next-in-chain
	Future.prototype.catch = function(cb) {
	    var f = createChainFuture(this)
	    wait(this, function() {
	        if(this.hasError) {
	            try {
	                setNext(f, executeCallback(cb,this.error))
	            } catch(e) {
	                f.throw(e)
	            }
	        } else if(this.hasNext) {
	            this.next.then(function(v) {
	                f.return(v)
	            }).catch(function(e) {
	                try {
	                    setNext(f, executeCallback(cb,e))
	                } catch(e) {
	                    f.throw(e)
	                }
	            })
	        } else {
	            f.return(this.result)
	        }
	    })
	    return f
	}
	// cb takes no parameters
	// callback's return value is ignored, but thrown exceptions propogate normally
	Future.prototype.finally = function(cb) {
	    var f = createChainFuture(this)
	    wait(this, function() {
	        try {
	            var that = this
	            if(this.hasNext) {
	                this.next.then(function(v) {
	                    var x = executeCallback(cb)
	                    f.return(v)
	                    return x
	                }).catch(function(e) {
	                    var x = executeCallback(cb)
	                    f.throw(e)
	                    return x
	                }).done()
	            } else if(this.hasError) {
	                Future(true).then(function() {
	                    return executeCallback(cb)
	                }).then(function() {
	                    f.throw(that.error)
	                }).catch(function(e) {
	                    f.throw(e)
	                }).done()
	
	            } else  {
	                Future(true).then(function() {
	                    return executeCallback(cb)
	                }).then(function() {
	                    f.return(that.result)
	                }).catch(function(e) {
	                    f.throw(e)
	                }).done()
	            }
	        } catch(e) {
	            f.throw(e)
	        }
	    })
	    return f
	}
	
	// a future created for the chain functions (then, catch, and finally)
	function createChainFuture(that) {
	    var f = new Future
	    f.n = that.n + 1
	    if(Future.debug) {
	        f.location = createException()  // used for long traces
	    }
	    return f
	}
	
	// all unused futures should end with this (e.g. most then-chains)
	// detatches the future so any propogated exception is thrown (so the exception isn't silently lost)
	Future.prototype.done = function() {
	    wait(this, function() {
	        if(this.hasError) {
	            unhandledErrorHandler(this.error)
	        } else if(this.hasNext) {
	            this.next.catch(function(e) {
	                unhandledErrorHandler(e)
	            })
	        }
	    })
	}
	
	
	
	Future.prototype.resolver = function() {
	    var me = this
	
	    return function(e,v) {
	        if(e) { // error argument
	            me.throw(e)
	        } else {
	            me.return(v)
	        }
	    }
	}
	
	Future.prototype.resolved = function() {
	    return this.isResolved
	}
	
	
	function resolve(that, type, value) {
	    if(that.isResolved)
	        throw Error("Future resolved more than once! Resolution: "+value)
	
	    that.isResolved = true
	    that.hasError = type === 'error'
	    that.hasNext = type === 'next' && value !== undefined
	
	    if(that.hasError)
	        that.error = value
	    else if(that.hasNext)
	        that.next = value
	    else
	        that.result = value
	
	    // 100 is a pretty arbitrary number - it should be set significantly lower than common maximum stack depths, and high enough to make sure performance isn't significantly affected
	    // in using this for deadunit, firefox was getting a recursion error at 150, but not at 100. This doesn't mean that it can't happen at 100 too, but it'll certainly make it less likely
	    // if you're getting recursion errors even with this mechanism, you probably need to figure that out in your own code
	    if(that.n % 100 !== 0) {
	        executeCallbacks(that, that.queue)
	    } else {
	        setTimeout(function() { // this prevents too much recursion errors
	            executeCallbacks(that, that.queue)
	        }, 0)
	    }
	}
	
	function executeCallbacks(that, callbacks) {
	    if(callbacks.length > 0) {
	        try {
	            callbacks.forEach(function(cb) {
	                cb.apply(that)
	            })
	        } catch(e) {
	            unhandledErrorHandler(e)
	        }
	    }
	}
	
	// executes a callback and ensures that it returns a future
	function executeCallback(cb, arg) {
	    var r = cb(arg)
	    if(r !== undefined && !isLikeAFuture(r) )
	        throw Error("Value returned from then or catch ("+r+") is *not* a Future. Callback: "+cb.toString())
	
	    return r
	}
	
	function createException() {
	    try {
	        throw new Error()
	    } catch(e) {
	        return e
	    }
	}

/***/ },
/* 38 */
/*!********************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map.js ***!
  \********************************************************/
[104, 44, 45, 46],
/* 39 */
/*!*******************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/stacktrace.js ***!
  \*******************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! error-stack-parser */ 52), __webpack_require__(/*! stack-generator */ 53), __webpack_require__(/*! stacktrace-gps */ 55), __webpack_require__(/*! es6-promise */ 54)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('error-stack-parser'), require('stack-generator'), require('stacktrace-gps'), require('es6-promise'));
	    } else {
	        root.StackTrace = factory(root.ErrorStackParser, root.StackGenerator, root.StackTraceGPS, root.ES6Promise);
	    }
	}(this, function StackTrace(ErrorStackParser, StackGenerator, StackTraceGPS, ES6Promise) {
	    ES6Promise.polyfill();
	    var Promise = ES6Promise.Promise;
	
	    var _options = {
	        filter: function (stackframe) {
	            // Filter out stackframes for this library by default
	            return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
	                (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
	                (stackframe.functionName || '').indexOf('StackTraceGPS$$') === -1 &&
	                (stackframe.functionName || '').indexOf('StackGenerator$$') === -1;
	        }
	    };
	
	    /**
	     * Merge 2 given Objects. If a conflict occurs the second object wins.
	     * Does not do deep merges.
	     * @param first Object
	     * @param second Object
	     * @returns new Object merged first and second
	     * @private
	     */
	    function _merge(first, second) {
	        var target = {};
	
	        [first, second].forEach(function (obj) {
	            for (var prop in obj) {
	                if (obj.hasOwnProperty(prop)) {
	                    target[prop] = obj[prop];
	                }
	            }
	            return target;
	        });
	
	        return target;
	    }
	
	    function _isShapedLikeParsableError(err) {
	        return err.stack || err['opera#sourceloc'];
	    }
	
	    return {
	        /**
	         * Get a backtrace from invocation point.
	         * @param opts Options Object
	         * @return Array[StackFrame]
	         */
	        get: function StackTrace$$get(opts) {
	            try {
	                // Error must be thrown to get stack in IE
	                throw new Error();
	            } catch (err) {
	                if (_isShapedLikeParsableError(err)) {
	                    return this.fromError(err, opts);
	                } else {
	                    return this.generateArtificially(opts);
	                }
	            }
	        },
	
	        /**
	         * Given an error object, parse it.
	         * @param error Error object
	         * @param opts Object for options
	         * @return Array[StackFrame]
	         */
	        fromError: function StackTrace$$fromError(error, opts) {
	            opts = _merge(_options, opts);
	            return new Promise(function (resolve) {
	                var stackframes = ErrorStackParser.parse(error);
	                if (typeof opts.filter === 'function') {
	                    stackframes = stackframes.filter(opts.filter);
	                }
	                resolve(Promise.all(stackframes.map(function (sf) {
	                    return new Promise(function (resolve) {
	                        function resolveOriginal(_) {
	                            resolve(sf);
	                        }
	
	                        new StackTraceGPS(opts).pinpoint(sf)
	                            .then(resolve, resolveOriginal)['catch'](resolveOriginal);
	                    });
	                })));
	            }.bind(this));
	        },
	
	        /**
	         * Use StackGenerator to generate a backtrace.
	         * @param opts Object options
	         * @returns Array[StackFrame]
	         */
	        generateArtificially: function StackTrace$$generateArtificially(opts) {
	            opts = _merge(_options, opts);
	            var stackFrames = StackGenerator.backtrace(opts);
	            if (typeof opts.filter === 'function') {
	                stackFrames = stackFrames.filter(opts.filter);
	            }
	            return Promise.resolve(stackFrames);
	        },
	
	        /**
	         * Given a function, wrap it such that invocations trigger a callback that
	         * is called with a stack trace.
	         *
	         * @param {Function} fn to be instrumented
	         * @param {Function} callback function to call with a stack trace on invocation
	         * @param {Function} errback optional function to call with error if unable to get stack trace.
	         * @param {Object} thisArg optional context object (e.g. window)
	         */
	        instrument: function StackTrace$$instrument(fn, callback, errback, thisArg) {
	            if (typeof fn !== 'function') {
	                throw new Error('Cannot instrument non-function object');
	            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
	                // Already instrumented, return given Function
	                return fn;
	            }
	
	            var instrumented = function StackTrace$$instrumented() {
	                try {
	                    this.get().then(callback, errback)['catch'](errback);
	                    fn.apply(thisArg || this, arguments);
	                } catch (e) {
	                    if (_isShapedLikeParsableError(e)) {
	                        this.fromError(e).then(callback, errback)['catch'](errback);
	                    }
	                    throw e;
	                }
	            }.bind(this);
	            instrumented.__stacktraceOriginalFn = fn;
	
	            return instrumented;
	        },
	
	        /**
	         * Given a function that has been instrumented,
	         * revert the function to it's original (non-instrumented) state.
	         *
	         * @param fn {Function}
	         */
	        deinstrument: function StackTrace$$deinstrument(fn) {
	            if (typeof fn !== 'function') {
	                throw new Error('Cannot de-instrument non-function object');
	            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
	                return fn.__stacktraceOriginalFn;
	            } else {
	                // Function not instrumented, return original
	                return fn;
	            }
	        }
	    };
	}));


/***/ },
/* 40 */
/*!****************************************!*\
  !*** ./~/deadunit-core/~/ajax/ajax.js ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	var Future = __webpack_require__(/*! async-future */ 56)
	
	// returns the XHR function or equivalent for use with ajax
	// memoizes the function for faster repeated use
	var createXMLHTTPObject = function() {
	    var versions = ["Msxml2.XMLHTTP",
	                    "Msxml3.XMLHTTP",
	                    "Microsoft.XMLHTTP",
	                    "MSXML2.XmlHttp.6.0",
	                    "MSXML2.XmlHttp.5.0",
	                    "MSXML2.XmlHttp.4.0",
	                    "MSXML2.XmlHttp.3.0",
	                    "MSXML2.XmlHttp.2.0"
	    ]
	
	    if(XMLHttpRequest !== undefined) {  // For non-IE browsers
	        createXMLHTTPObject = function() {  // Use memoization to cache the factory
	            return new XMLHttpRequest()
	        }
	        return createXMLHTTPObject()
	
	    } else { // IE
	        for(var i=0, n=versions.length; i<n; i++) {
	            try {
	                var version = versions[i]
	                var fn = function() {
	                    return new ActiveXObject(version)
	                }
	                createXMLHTTPObject = fn   // Use memoization to cache the factory
	                return createXMLHTTPObject()
	
	            } catch(e) {   }
	        }
	    }
	
	    throw new Error('Cant get XmlHttpRequest object')
	}
	
	
	
	var HEADER = "([^\\s]+): (.*)"
	
	// returns the contents and headers from a given URL
	exports = module.exports = function(url) {
	    if(getFromCache(url))
	        return getFromCache(url)
	
	    var futureResult = new Future
	    setOnCache(url, futureResult)
	
	    var req = createXMLHTTPObject()
	    req.onreadystatechange = function() {
	        if( req.readyState === 4 ) {
	            if( req.status === 200 ) {
	                var headers = {}
	                req.getAllResponseHeaders().split('\n').forEach(function(line) {
	                    var match = line.match(HEADER)
	                    if(match !== null) {
	                        var name = match[1]
	                        var value = match[2]
	
	                        headers[name] = value
	                    }
	                })
	
	                futureResult.return({text: req.responseText, headers: headers})
	
	            } else {
	                var error = new Error('Error in request: Status '+req.status)
	                error.status = req.status
	                futureResult.throw(error)
	            }
	        }
	    }
	
	    req.onerror = function(e) {
	        futureResult.throw(e)
	    }
	
	
	    req.open('GET', url, asynchronous)
	    try {
	        req.send()
	    } catch(e) {
	        futureResult.throw(e)
	    }
	
	    return futureResult
	}
	
	var cache = {}
	var getFromCache = function(url) {
	    return cache[url]
	}
	var setOnCache = function(url, futureResponse) {
	    cache[url] = futureResponse
	}
	
	var asynchronous = true
	exports.setSynchronous = function(synchronous) { // this is here so I can work around this bug in chrome: https://code.google.com/p/chromium/issues/detail?id=368444
	    asynchronous = !synchronous
	}
	
	exports.cacheGet = function(fn) {
	    getFromCache = fn
	}
	exports.cacheSet = function(fn) {
	    setOnCache = fn
	}

/***/ },
/* 41 */
/*!********************************************************************!*\
  !*** ./~/deadunit-core/~/source-map-resolve/source-map-resolve.js ***!
  \********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(setImmediate) {// Copyright 2014 Simon Lydell
	// X11 (“MIT”) Licensed. (See LICENSE.)
	
	// Note: source-map-resolve.js is generated from source-map-resolve-node.js and
	// source-map-resolve-template.js. Only edit the two latter files, _not_
	// source-map-resolve.js!
	
	void (function(root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! source-map-url */ 57), __webpack_require__(/*! resolve-url */ 58)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else if (typeof exports === "object") {
	    var sourceMappingURL = require("source-map-url")
	    var resolveUrl = require("resolve-url")
	    module.exports = factory(sourceMappingURL, resolveUrl)
	  } else {
	    root.sourceMapResolve = factory(root.sourceMappingURL, root.resolveUrl)
	  }
	}(this, function(sourceMappingURL, resolveUrl) {
	
	  function callbackAsync(callback, error, result) {
	    setImmediate(function() { callback(error, result) })
	  }
	
	  function sig(name, codeOrMap, url, read, callback) {
	    var type = (name.indexOf("Sources") >= 0 ? "map" : "code")
	
	    var throwError = function(num, what, got) {
	      throw new Error(
	        name + " requires argument " + num + " to be " + what + ". Got:\n" + got
	      )
	    }
	
	    if (type === "map") {
	      if (typeof codeOrMap !== "object" || codeOrMap === null) {
	        throwError(1, "a source map", codeOrMap)
	      }
	    } else {
	      if (typeof codeOrMap !== "string") {
	        throwError(1, "some code", codeOrMap)
	      }
	    }
	    if (typeof url !== "string") {
	      throwError(2, "the " + type + " url", url)
	    }
	    if (typeof read !== "function") {
	      throwError(3, "a reading function", read)
	    }
	    if (arguments.length === 1 + 4 && typeof callback !== "function") {
	      throwError(4, "a callback function", callback)
	    }
	  }
	
	  function parseMapToJSON(string) {
	    return JSON.parse(string.replace(/^\)\]\}'/, ""))
	  }
	
	
	
	  function resolveSourceMap(code, codeUrl, read, callback) {
	    sig("resolveSourceMap", code, codeUrl, read, callback)
	    var mapData
	    try {
	      mapData = resolveSourceMapHelper(code, codeUrl)
	    } catch (error) {
	      return callbackAsync(callback, error)
	    }
	    if (!mapData || mapData.map) {
	      return callbackAsync(callback, null, mapData)
	    }
	    read(mapData.url, function(error, result) {
	      if (error) {
	        return callback(error)
	      }
	      try {
	        mapData.map = parseMapToJSON(String(result))
	      } catch (error) {
	        return callback(error)
	      }
	      callback(null, mapData)
	    })
	  }
	
	  function resolveSourceMapSync(code, codeUrl, read) {
	    sig("resolveSourceMapSync", code, codeUrl, read)
	    var mapData = resolveSourceMapHelper(code, codeUrl)
	    if (!mapData || mapData.map) {
	      return mapData
	    }
	    mapData.map = parseMapToJSON(String(read(mapData.url)))
	    return mapData
	  }
	
	  var dataUriRegex = /^data:([^,;]*)(;[^,;]*)*(?:,(.*))?$/
	  var jsonMimeTypeRegex = /^(?:application|text)\/json$/
	
	  function resolveSourceMapHelper(code, codeUrl) {
	    var url = sourceMappingURL.get(code)
	    if (!url) {
	      return null
	    }
	
	    var dataUri = url.match(dataUriRegex)
	    if (dataUri) {
	      var mimeType = dataUri[1]
	      var lastParameter = dataUri[2]
	      var encoded = dataUri[3]
	      if (!jsonMimeTypeRegex.test(mimeType)) {
	        throw new Error("Unuseful data uri mime type: " + (mimeType || "text/plain"))
	      }
	      return {
	        sourceMappingURL: url,
	        url: null,
	        sourcesRelativeTo: codeUrl,
	        map: parseMapToJSON(lastParameter === ";base64" ? atob(encoded) : decodeURIComponent(encoded))
	      }
	    }
	
	    var mapUrl = resolveUrl(codeUrl, url)
	    return {
	      sourceMappingURL: url,
	      url: mapUrl,
	      sourcesRelativeTo: mapUrl,
	      map: null
	    }
	  }
	
	
	
	  function resolveSources(map, mapUrl, read, callback) {
	    sig("resolveSources", map, mapUrl, read, callback)
	    var pending = map.sources.length
	    var errored = false
	    var sources = []
	
	    var done = function(error) {
	      if (errored) {
	        return
	      }
	      if (error) {
	        errored = true
	        return callback(error)
	      }
	      pending--
	      if (pending === 0) {
	        callback(null, sources)
	      }
	    }
	
	    resolveSourcesHelper(map, mapUrl, function(fullUrl, sourceContent, index) {
	      if (typeof sourceContent === "string") {
	        sources[index] = sourceContent
	        callbackAsync(done, null)
	      } else {
	        read(fullUrl, function(error, result) {
	          sources[index] = String(result)
	          done(error)
	        })
	      }
	    })
	  }
	
	  function resolveSourcesSync(map, mapUrl, read) {
	    sig("resolveSourcesSync", map, mapUrl, read)
	    var sources = []
	    resolveSourcesHelper(map, mapUrl, function(fullUrl, sourceContent, index) {
	      if (typeof sourceContent === "string") {
	        sources[index] = sourceContent
	      } else {
	        sources[index] = String(read(fullUrl))
	      }
	    })
	    return sources
	  }
	
	  var endingSlash = /\/?$/
	
	  function resolveSourcesHelper(map, mapUrl, fn) {
	    var fullUrl
	    var sourceContent
	    for (var index = 0, len = map.sources.length; index < len; index++) {
	      if (map.sourceRoot) {
	        // Make sure that the sourceRoot ends with a slash, so that `/scripts/subdir` becomes
	        // `/scripts/subdir/<source>`, not `/scripts/<source>`. Pointing to a file as source root
	        // does not make sense.
	        fullUrl = resolveUrl(mapUrl, map.sourceRoot.replace(endingSlash, "/"), map.sources[index])
	      } else {
	        fullUrl = resolveUrl(mapUrl, map.sources[index])
	      }
	      sourceContent = (map.sourceContents || [])[index]
	      fn(fullUrl, sourceContent, index)
	    }
	  }
	
	
	
	  function resolve(code, codeUrl, read, callback) {
	    sig("resolve", code, codeUrl, read, callback)
	    resolveSourceMap(code, codeUrl, read, function(error, mapData) {
	      if (error) {
	        return callback(error)
	      }
	      if (!mapData) {
	        return callback(null, null)
	      }
	      resolveSources(mapData.map, mapData.sourcesRelativeTo, read, function(error, sources) {
	        if (error) {
	          return callback(error)
	        }
	        mapData.sources = sources
	        callback(null, mapData)
	      })
	    })
	  }
	
	  function resolveSync(code, codeUrl, read) {
	    sig("resolveSync", code, codeUrl, read)
	    var mapData = resolveSourceMapSync(code, codeUrl, read)
	    if (!mapData) {
	      return null
	    }
	    mapData.sources = resolveSourcesSync(mapData.map, mapData.sourcesRelativeTo, read)
	    return mapData
	  }
	
	
	
	  return {
	    resolveSourceMap:     resolveSourceMap,
	    resolveSourceMapSync: resolveSourceMapSync,
	    resolveSources:       resolveSources,
	    resolveSourcesSync:   resolveSourcesSync,
	    resolve:              resolve,
	    resolveSync:          resolveSync
	  }
	
	}));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! (webpack)/~/node-libs-browser/~/timers-browserify/main.js */ 49).setImmediate))

/***/ },
/* 42 */
/*!********************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/events/events.js ***!
  \********************************************************/
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];
	
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 43 */
/*!****************************************!*\
  !*** ./~/blocks.js/~/observe/utils.js ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	// utilities needed by the configuration (excludes dependencies the configs don't need so the webpack bundle is lean)
	
	var path = __webpack_require__(/*! path */ 30)
	
	
	// Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
	// any number of objects can be passed into the function and will be merged into the first argument in order
	// returns obj1 (now mutated)
	var merge = exports.merge = function(obj1, obj2/*, moreObjects...*/){
	    return mergeInternal(arrayify(arguments), false)
	}
	
	// like merge, but traverses the whole object tree
	// the result is undefined for objects with circular references
	var deepMerge = exports.deepMerge = function(obj1, obj2/*, moreObjects...*/) {
	    return mergeInternal(arrayify(arguments), true)
	}
	
	function mergeInternal(objects, deep) {
	    var obj1 = objects[0]
	    var obj2 = objects[1]
	
	    for(var key in obj2){
	       if(Object.hasOwnProperty.call(obj2, key)) {
	            if(deep && obj1[key] instanceof Object && obj2[key] instanceof Object) {
	                mergeInternal([obj1[key], obj2[key]], true)
	            } else {
	                obj1[key] = obj2[key]
	            }
	       }
	    }
	
	    if(objects.length > 2) {
	        var newObjects = [obj1].concat(objects.slice(2))
	        return mergeInternal(newObjects, deep)
	    } else {
	        return obj1
	    }
	}
	
	function arrayify(a) {
	    return Array.prototype.slice.call(a, 0)
	}


/***/ },
/* 44 */
/*!*****************************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/source-map-generator.js ***!
  \*****************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var base64VLQ = __webpack_require__(/*! ./base64-vlq */ 59);
	  var util = __webpack_require__(/*! ./util */ 60);
	  var ArraySet = __webpack_require__(/*! ./array-set */ 61).ArraySet;
	
	  /**
	   * An instance of the SourceMapGenerator represents a source map which is
	   * being built incrementally. You may pass an object with the following
	   * properties:
	   *
	   *   - file: The filename of the generated source.
	   *   - sourceRoot: A root for all relative URLs in this source map.
	   */
	  function SourceMapGenerator(aArgs) {
	    if (!aArgs) {
	      aArgs = {};
	    }
	    this._file = util.getArg(aArgs, 'file', null);
	    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
	    this._sources = new ArraySet();
	    this._names = new ArraySet();
	    this._mappings = [];
	    this._sourcesContents = null;
	  }
	
	  SourceMapGenerator.prototype._version = 3;
	
	  /**
	   * Creates a new SourceMapGenerator based on a SourceMapConsumer
	   *
	   * @param aSourceMapConsumer The SourceMap.
	   */
	  SourceMapGenerator.fromSourceMap =
	    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
	      var sourceRoot = aSourceMapConsumer.sourceRoot;
	      var generator = new SourceMapGenerator({
	        file: aSourceMapConsumer.file,
	        sourceRoot: sourceRoot
	      });
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        var newMapping = {
	          generated: {
	            line: mapping.generatedLine,
	            column: mapping.generatedColumn
	          }
	        };
	
	        if (mapping.source) {
	          newMapping.source = mapping.source;
	          if (sourceRoot) {
	            newMapping.source = util.relative(sourceRoot, newMapping.source);
	          }
	
	          newMapping.original = {
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          };
	
	          if (mapping.name) {
	            newMapping.name = mapping.name;
	          }
	        }
	
	        generator.addMapping(newMapping);
	      });
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content) {
	          generator.setSourceContent(sourceFile, content);
	        }
	      });
	      return generator;
	    };
	
	  /**
	   * Add a single mapping from original source line and column to the generated
	   * source's line and column for this source map being created. The mapping
	   * object should have the following properties:
	   *
	   *   - generated: An object with the generated line and column positions.
	   *   - original: An object with the original line and column positions.
	   *   - source: The original source file (relative to the sourceRoot).
	   *   - name: An optional original token name for this mapping.
	   */
	  SourceMapGenerator.prototype.addMapping =
	    function SourceMapGenerator_addMapping(aArgs) {
	      var generated = util.getArg(aArgs, 'generated');
	      var original = util.getArg(aArgs, 'original', null);
	      var source = util.getArg(aArgs, 'source', null);
	      var name = util.getArg(aArgs, 'name', null);
	
	      this._validateMapping(generated, original, source, name);
	
	      if (source && !this._sources.has(source)) {
	        this._sources.add(source);
	      }
	
	      if (name && !this._names.has(name)) {
	        this._names.add(name);
	      }
	
	      this._mappings.push({
	        generatedLine: generated.line,
	        generatedColumn: generated.column,
	        originalLine: original != null && original.line,
	        originalColumn: original != null && original.column,
	        source: source,
	        name: name
	      });
	    };
	
	  /**
	   * Set the source content for a source file.
	   */
	  SourceMapGenerator.prototype.setSourceContent =
	    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
	      var source = aSourceFile;
	      if (this._sourceRoot) {
	        source = util.relative(this._sourceRoot, source);
	      }
	
	      if (aSourceContent !== null) {
	        // Add the source content to the _sourcesContents map.
	        // Create a new _sourcesContents map if the property is null.
	        if (!this._sourcesContents) {
	          this._sourcesContents = {};
	        }
	        this._sourcesContents[util.toSetString(source)] = aSourceContent;
	      } else {
	        // Remove the source file from the _sourcesContents map.
	        // If the _sourcesContents map is empty, set the property to null.
	        delete this._sourcesContents[util.toSetString(source)];
	        if (Object.keys(this._sourcesContents).length === 0) {
	          this._sourcesContents = null;
	        }
	      }
	    };
	
	  /**
	   * Applies the mappings of a sub-source-map for a specific source file to the
	   * source map being generated. Each mapping to the supplied source file is
	   * rewritten using the supplied source map. Note: The resolution for the
	   * resulting mappings is the minimium of this map and the supplied map.
	   *
	   * @param aSourceMapConsumer The source map to be applied.
	   * @param aSourceFile Optional. The filename of the source file.
	   *        If omitted, SourceMapConsumer's file property will be used.
	   * @param aSourceMapPath Optional. The dirname of the path to the source map
	   *        to be applied. If relative, it is relative to the SourceMapConsumer.
	   *        This parameter is needed when the two source maps aren't in the same
	   *        directory, and the source map to be applied contains relative source
	   *        paths. If so, those relative source paths need to be rewritten
	   *        relative to the SourceMapGenerator.
	   */
	  SourceMapGenerator.prototype.applySourceMap =
	    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
	      // If aSourceFile is omitted, we will use the file property of the SourceMap
	      if (!aSourceFile) {
	        if (!aSourceMapConsumer.file) {
	          throw new Error(
	            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
	            'or the source map\'s "file" property. Both were omitted.'
	          );
	        }
	        aSourceFile = aSourceMapConsumer.file;
	      }
	      var sourceRoot = this._sourceRoot;
	      // Make "aSourceFile" relative if an absolute Url is passed.
	      if (sourceRoot) {
	        aSourceFile = util.relative(sourceRoot, aSourceFile);
	      }
	      // Applying the SourceMap can add and remove items from the sources and
	      // the names array.
	      var newSources = new ArraySet();
	      var newNames = new ArraySet();
	
	      // Find mappings for the "aSourceFile"
	      this._mappings.forEach(function (mapping) {
	        if (mapping.source === aSourceFile && mapping.originalLine) {
	          // Check if it can be mapped by the source map, then update the mapping.
	          var original = aSourceMapConsumer.originalPositionFor({
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          });
	          if (original.source !== null) {
	            // Copy mapping
	            mapping.source = original.source;
	            if (aSourceMapPath) {
	              mapping.source = util.join(aSourceMapPath, mapping.source)
	            }
	            if (sourceRoot) {
	              mapping.source = util.relative(sourceRoot, mapping.source);
	            }
	            mapping.originalLine = original.line;
	            mapping.originalColumn = original.column;
	            if (original.name !== null && mapping.name !== null) {
	              // Only use the identifier name if it's an identifier
	              // in both SourceMaps
	              mapping.name = original.name;
	            }
	          }
	        }
	
	        var source = mapping.source;
	        if (source && !newSources.has(source)) {
	          newSources.add(source);
	        }
	
	        var name = mapping.name;
	        if (name && !newNames.has(name)) {
	          newNames.add(name);
	        }
	
	      }, this);
	      this._sources = newSources;
	      this._names = newNames;
	
	      // Copy sourcesContents of applied map.
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content) {
	          if (sourceRoot) {
	            sourceFile = util.relative(sourceRoot, sourceFile);
	          }
	          this.setSourceContent(sourceFile, content);
	        }
	      }, this);
	    };
	
	  /**
	   * A mapping can have one of the three levels of data:
	   *
	   *   1. Just the generated position.
	   *   2. The Generated position, original position, and original source.
	   *   3. Generated and original position, original source, as well as a name
	   *      token.
	   *
	   * To maintain consistency, we validate that any new mapping being added falls
	   * in to one of these categories.
	   */
	  SourceMapGenerator.prototype._validateMapping =
	    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
	                                                aName) {
	      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	          && aGenerated.line > 0 && aGenerated.column >= 0
	          && !aOriginal && !aSource && !aName) {
	        // Case 1.
	        return;
	      }
	      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
	               && aGenerated.line > 0 && aGenerated.column >= 0
	               && aOriginal.line > 0 && aOriginal.column >= 0
	               && aSource) {
	        // Cases 2 and 3.
	        return;
	      }
	      else {
	        throw new Error('Invalid mapping: ' + JSON.stringify({
	          generated: aGenerated,
	          source: aSource,
	          original: aOriginal,
	          name: aName
	        }));
	      }
	    };
	
	  /**
	   * Serialize the accumulated mappings in to the stream of base 64 VLQs
	   * specified by the source map format.
	   */
	  SourceMapGenerator.prototype._serializeMappings =
	    function SourceMapGenerator_serializeMappings() {
	      var previousGeneratedColumn = 0;
	      var previousGeneratedLine = 1;
	      var previousOriginalColumn = 0;
	      var previousOriginalLine = 0;
	      var previousName = 0;
	      var previousSource = 0;
	      var result = '';
	      var mapping;
	
	      // The mappings must be guaranteed to be in sorted order before we start
	      // serializing them or else the generated line numbers (which are defined
	      // via the ';' separators) will be all messed up. Note: it might be more
	      // performant to maintain the sorting as we insert them, rather than as we
	      // serialize them, but the big O is the same either way.
	      this._mappings.sort(util.compareByGeneratedPositions);
	
	      for (var i = 0, len = this._mappings.length; i < len; i++) {
	        mapping = this._mappings[i];
	
	        if (mapping.generatedLine !== previousGeneratedLine) {
	          previousGeneratedColumn = 0;
	          while (mapping.generatedLine !== previousGeneratedLine) {
	            result += ';';
	            previousGeneratedLine++;
	          }
	        }
	        else {
	          if (i > 0) {
	            if (!util.compareByGeneratedPositions(mapping, this._mappings[i - 1])) {
	              continue;
	            }
	            result += ',';
	          }
	        }
	
	        result += base64VLQ.encode(mapping.generatedColumn
	                                   - previousGeneratedColumn);
	        previousGeneratedColumn = mapping.generatedColumn;
	
	        if (mapping.source) {
	          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
	                                     - previousSource);
	          previousSource = this._sources.indexOf(mapping.source);
	
	          // lines are stored 0-based in SourceMap spec version 3
	          result += base64VLQ.encode(mapping.originalLine - 1
	                                     - previousOriginalLine);
	          previousOriginalLine = mapping.originalLine - 1;
	
	          result += base64VLQ.encode(mapping.originalColumn
	                                     - previousOriginalColumn);
	          previousOriginalColumn = mapping.originalColumn;
	
	          if (mapping.name) {
	            result += base64VLQ.encode(this._names.indexOf(mapping.name)
	                                       - previousName);
	            previousName = this._names.indexOf(mapping.name);
	          }
	        }
	      }
	
	      return result;
	    };
	
	  SourceMapGenerator.prototype._generateSourcesContent =
	    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
	      return aSources.map(function (source) {
	        if (!this._sourcesContents) {
	          return null;
	        }
	        if (aSourceRoot) {
	          source = util.relative(aSourceRoot, source);
	        }
	        var key = util.toSetString(source);
	        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
	                                                    key)
	          ? this._sourcesContents[key]
	          : null;
	      }, this);
	    };
	
	  /**
	   * Externalize the source map.
	   */
	  SourceMapGenerator.prototype.toJSON =
	    function SourceMapGenerator_toJSON() {
	      var map = {
	        version: this._version,
	        file: this._file,
	        sources: this._sources.toArray(),
	        names: this._names.toArray(),
	        mappings: this._serializeMappings()
	      };
	      if (this._sourceRoot) {
	        map.sourceRoot = this._sourceRoot;
	      }
	      if (this._sourcesContents) {
	        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
	      }
	
	      return map;
	    };
	
	  /**
	   * Render the source map being generated to a string.
	   */
	  SourceMapGenerator.prototype.toString =
	    function SourceMapGenerator_toString() {
	      return JSON.stringify(this);
	    };
	
	  exports.SourceMapGenerator = SourceMapGenerator;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 45 */
/*!****************************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/source-map-consumer.js ***!
  \****************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(/*! ./util */ 60);
	  var binarySearch = __webpack_require__(/*! ./binary-search */ 62);
	  var ArraySet = __webpack_require__(/*! ./array-set */ 61).ArraySet;
	  var base64VLQ = __webpack_require__(/*! ./base64-vlq */ 59);
	
	  /**
	   * A SourceMapConsumer instance represents a parsed source map which we can
	   * query for information about the original file positions by giving it a file
	   * position in the generated source.
	   *
	   * The only parameter is the raw source map (either as a JSON string, or
	   * already parsed to an object). According to the spec, source maps have the
	   * following attributes:
	   *
	   *   - version: Which version of the source map spec this map is following.
	   *   - sources: An array of URLs to the original source files.
	   *   - names: An array of identifiers which can be referrenced by individual mappings.
	   *   - sourceRoot: Optional. The URL root from which all sources are relative.
	   *   - sourcesContent: Optional. An array of contents of the original source files.
	   *   - mappings: A string of base64 VLQs which contain the actual mappings.
	   *   - file: Optional. The generated file this source map is associated with.
	   *
	   * Here is an example source map, taken from the source map spec[0]:
	   *
	   *     {
	   *       version : 3,
	   *       file: "out.js",
	   *       sourceRoot : "",
	   *       sources: ["foo.js", "bar.js"],
	   *       names: ["src", "maps", "are", "fun"],
	   *       mappings: "AA,AB;;ABCDE;"
	   *     }
	   *
	   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
	   */
	  function SourceMapConsumer(aSourceMap) {
	    var sourceMap = aSourceMap;
	    if (typeof aSourceMap === 'string') {
	      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
	    }
	
	    var version = util.getArg(sourceMap, 'version');
	    var sources = util.getArg(sourceMap, 'sources');
	    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
	    // requires the array) to play nice here.
	    var names = util.getArg(sourceMap, 'names', []);
	    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
	    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
	    var mappings = util.getArg(sourceMap, 'mappings');
	    var file = util.getArg(sourceMap, 'file', null);
	
	    // Once again, Sass deviates from the spec and supplies the version as a
	    // string rather than a number, so we use loose equality checking here.
	    if (version != this._version) {
	      throw new Error('Unsupported version: ' + version);
	    }
	
	    // Pass `true` below to allow duplicate names and sources. While source maps
	    // are intended to be compressed and deduplicated, the TypeScript compiler
	    // sometimes generates source maps with duplicates in them. See Github issue
	    // #72 and bugzil.la/889492.
	    this._names = ArraySet.fromArray(names, true);
	    this._sources = ArraySet.fromArray(sources, true);
	
	    this.sourceRoot = sourceRoot;
	    this.sourcesContent = sourcesContent;
	    this._mappings = mappings;
	    this.file = file;
	  }
	
	  /**
	   * Create a SourceMapConsumer from a SourceMapGenerator.
	   *
	   * @param SourceMapGenerator aSourceMap
	   *        The source map that will be consumed.
	   * @returns SourceMapConsumer
	   */
	  SourceMapConsumer.fromSourceMap =
	    function SourceMapConsumer_fromSourceMap(aSourceMap) {
	      var smc = Object.create(SourceMapConsumer.prototype);
	
	      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
	      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
	      smc.sourceRoot = aSourceMap._sourceRoot;
	      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
	                                                              smc.sourceRoot);
	      smc.file = aSourceMap._file;
	
	      smc.__generatedMappings = aSourceMap._mappings.slice()
	        .sort(util.compareByGeneratedPositions);
	      smc.__originalMappings = aSourceMap._mappings.slice()
	        .sort(util.compareByOriginalPositions);
	
	      return smc;
	    };
	
	  /**
	   * The version of the source mapping spec that we are consuming.
	   */
	  SourceMapConsumer.prototype._version = 3;
	
	  /**
	   * The list of original sources.
	   */
	  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
	    get: function () {
	      return this._sources.toArray().map(function (s) {
	        return this.sourceRoot ? util.join(this.sourceRoot, s) : s;
	      }, this);
	    }
	  });
	
	  // `__generatedMappings` and `__originalMappings` are arrays that hold the
	  // parsed mapping coordinates from the source map's "mappings" attribute. They
	  // are lazily instantiated, accessed via the `_generatedMappings` and
	  // `_originalMappings` getters respectively, and we only parse the mappings
	  // and create these arrays once queried for a source location. We jump through
	  // these hoops because there can be many thousands of mappings, and parsing
	  // them is expensive, so we only want to do it if we must.
	  //
	  // Each object in the arrays is of the form:
	  //
	  //     {
	  //       generatedLine: The line number in the generated code,
	  //       generatedColumn: The column number in the generated code,
	  //       source: The path to the original source file that generated this
	  //               chunk of code,
	  //       originalLine: The line number in the original source that
	  //                     corresponds to this chunk of generated code,
	  //       originalColumn: The column number in the original source that
	  //                       corresponds to this chunk of generated code,
	  //       name: The name of the original symbol which generated this chunk of
	  //             code.
	  //     }
	  //
	  // All properties except for `generatedLine` and `generatedColumn` can be
	  // `null`.
	  //
	  // `_generatedMappings` is ordered by the generated positions.
	  //
	  // `_originalMappings` is ordered by the original positions.
	
	  SourceMapConsumer.prototype.__generatedMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
	    get: function () {
	      if (!this.__generatedMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }
	
	      return this.__generatedMappings;
	    }
	  });
	
	  SourceMapConsumer.prototype.__originalMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
	    get: function () {
	      if (!this.__originalMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }
	
	      return this.__originalMappings;
	    }
	  });
	
	  /**
	   * Parse the mappings in a string in to a data structure which we can easily
	   * query (the ordered arrays in the `this.__generatedMappings` and
	   * `this.__originalMappings` properties).
	   */
	  SourceMapConsumer.prototype._parseMappings =
	    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
	      var generatedLine = 1;
	      var previousGeneratedColumn = 0;
	      var previousOriginalLine = 0;
	      var previousOriginalColumn = 0;
	      var previousSource = 0;
	      var previousName = 0;
	      var mappingSeparator = /^[,;]/;
	      var str = aStr;
	      var mapping;
	      var temp;
	
	      while (str.length > 0) {
	        if (str.charAt(0) === ';') {
	          generatedLine++;
	          str = str.slice(1);
	          previousGeneratedColumn = 0;
	        }
	        else if (str.charAt(0) === ',') {
	          str = str.slice(1);
	        }
	        else {
	          mapping = {};
	          mapping.generatedLine = generatedLine;
	
	          // Generated column.
	          temp = base64VLQ.decode(str);
	          mapping.generatedColumn = previousGeneratedColumn + temp.value;
	          previousGeneratedColumn = mapping.generatedColumn;
	          str = temp.rest;
	
	          if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
	            // Original source.
	            temp = base64VLQ.decode(str);
	            mapping.source = this._sources.at(previousSource + temp.value);
	            previousSource += temp.value;
	            str = temp.rest;
	            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
	              throw new Error('Found a source, but no line and column');
	            }
	
	            // Original line.
	            temp = base64VLQ.decode(str);
	            mapping.originalLine = previousOriginalLine + temp.value;
	            previousOriginalLine = mapping.originalLine;
	            // Lines are stored 0-based
	            mapping.originalLine += 1;
	            str = temp.rest;
	            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
	              throw new Error('Found a source and line, but no column');
	            }
	
	            // Original column.
	            temp = base64VLQ.decode(str);
	            mapping.originalColumn = previousOriginalColumn + temp.value;
	            previousOriginalColumn = mapping.originalColumn;
	            str = temp.rest;
	
	            if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
	              // Original name.
	              temp = base64VLQ.decode(str);
	              mapping.name = this._names.at(previousName + temp.value);
	              previousName += temp.value;
	              str = temp.rest;
	            }
	          }
	
	          this.__generatedMappings.push(mapping);
	          if (typeof mapping.originalLine === 'number') {
	            this.__originalMappings.push(mapping);
	          }
	        }
	      }
	
	      this.__generatedMappings.sort(util.compareByGeneratedPositions);
	      this.__originalMappings.sort(util.compareByOriginalPositions);
	    };
	
	  /**
	   * Find the mapping that best matches the hypothetical "needle" mapping that
	   * we are searching for in the given "haystack" of mappings.
	   */
	  SourceMapConsumer.prototype._findMapping =
	    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
	                                           aColumnName, aComparator) {
	      // To return the position we are searching for, we must first find the
	      // mapping for the given position and then return the opposite position it
	      // points to. Because the mappings are sorted, we can use binary search to
	      // find the best mapping.
	
	      if (aNeedle[aLineName] <= 0) {
	        throw new TypeError('Line must be greater than or equal to 1, got '
	                            + aNeedle[aLineName]);
	      }
	      if (aNeedle[aColumnName] < 0) {
	        throw new TypeError('Column must be greater than or equal to 0, got '
	                            + aNeedle[aColumnName]);
	      }
	
	      return binarySearch.search(aNeedle, aMappings, aComparator);
	    };
	
	  /**
	   * Returns the original source, line, and column information for the generated
	   * source's line and column positions provided. The only argument is an object
	   * with the following properties:
	   *
	   *   - line: The line number in the generated source.
	   *   - column: The column number in the generated source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - source: The original source file, or null.
	   *   - line: The line number in the original source, or null.
	   *   - column: The column number in the original source, or null.
	   *   - name: The original identifier, or null.
	   */
	  SourceMapConsumer.prototype.originalPositionFor =
	    function SourceMapConsumer_originalPositionFor(aArgs) {
	      var needle = {
	        generatedLine: util.getArg(aArgs, 'line'),
	        generatedColumn: util.getArg(aArgs, 'column')
	      };
	
	      var mapping = this._findMapping(needle,
	                                      this._generatedMappings,
	                                      "generatedLine",
	                                      "generatedColumn",
	                                      util.compareByGeneratedPositions);
	
	      if (mapping && mapping.generatedLine === needle.generatedLine) {
	        var source = util.getArg(mapping, 'source', null);
	        if (source && this.sourceRoot) {
	          source = util.join(this.sourceRoot, source);
	        }
	        return {
	          source: source,
	          line: util.getArg(mapping, 'originalLine', null),
	          column: util.getArg(mapping, 'originalColumn', null),
	          name: util.getArg(mapping, 'name', null)
	        };
	      }
	
	      return {
	        source: null,
	        line: null,
	        column: null,
	        name: null
	      };
	    };
	
	  /**
	   * Returns the original source content. The only argument is the url of the
	   * original source file. Returns null if no original source content is
	   * availible.
	   */
	  SourceMapConsumer.prototype.sourceContentFor =
	    function SourceMapConsumer_sourceContentFor(aSource) {
	      if (!this.sourcesContent) {
	        return null;
	      }
	
	      if (this.sourceRoot) {
	        aSource = util.relative(this.sourceRoot, aSource);
	      }
	
	      if (this._sources.has(aSource)) {
	        return this.sourcesContent[this._sources.indexOf(aSource)];
	      }
	
	      var url;
	      if (this.sourceRoot
	          && (url = util.urlParse(this.sourceRoot))) {
	        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
	        // many users. We can help them out when they expect file:// URIs to
	        // behave like it would if they were running a local HTTP server. See
	        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
	        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
	        if (url.scheme == "file"
	            && this._sources.has(fileUriAbsPath)) {
	          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
	        }
	
	        if ((!url.path || url.path == "/")
	            && this._sources.has("/" + aSource)) {
	          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
	        }
	      }
	
	      throw new Error('"' + aSource + '" is not in the SourceMap.');
	    };
	
	  /**
	   * Returns the generated line and column information for the original source,
	   * line, and column positions provided. The only argument is an object with
	   * the following properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *   - column: The column number in the original source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.generatedPositionFor =
	    function SourceMapConsumer_generatedPositionFor(aArgs) {
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: util.getArg(aArgs, 'column')
	      };
	
	      if (this.sourceRoot) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }
	
	      var mapping = this._findMapping(needle,
	                                      this._originalMappings,
	                                      "originalLine",
	                                      "originalColumn",
	                                      util.compareByOriginalPositions);
	
	      if (mapping) {
	        return {
	          line: util.getArg(mapping, 'generatedLine', null),
	          column: util.getArg(mapping, 'generatedColumn', null)
	        };
	      }
	
	      return {
	        line: null,
	        column: null
	      };
	    };
	
	  SourceMapConsumer.GENERATED_ORDER = 1;
	  SourceMapConsumer.ORIGINAL_ORDER = 2;
	
	  /**
	   * Iterate over each mapping between an original source/line/column and a
	   * generated line/column in this source map.
	   *
	   * @param Function aCallback
	   *        The function that is called with each mapping.
	   * @param Object aContext
	   *        Optional. If specified, this object will be the value of `this` every
	   *        time that `aCallback` is called.
	   * @param aOrder
	   *        Either `SourceMapConsumer.GENERATED_ORDER` or
	   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
	   *        iterate over the mappings sorted by the generated file's line/column
	   *        order or the original's source/line/column order, respectively. Defaults to
	   *        `SourceMapConsumer.GENERATED_ORDER`.
	   */
	  SourceMapConsumer.prototype.eachMapping =
	    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
	      var context = aContext || null;
	      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
	
	      var mappings;
	      switch (order) {
	      case SourceMapConsumer.GENERATED_ORDER:
	        mappings = this._generatedMappings;
	        break;
	      case SourceMapConsumer.ORIGINAL_ORDER:
	        mappings = this._originalMappings;
	        break;
	      default:
	        throw new Error("Unknown order of iteration.");
	      }
	
	      var sourceRoot = this.sourceRoot;
	      mappings.map(function (mapping) {
	        var source = mapping.source;
	        if (source && sourceRoot) {
	          source = util.join(sourceRoot, source);
	        }
	        return {
	          source: source,
	          generatedLine: mapping.generatedLine,
	          generatedColumn: mapping.generatedColumn,
	          originalLine: mapping.originalLine,
	          originalColumn: mapping.originalColumn,
	          name: mapping.name
	        };
	      }).forEach(aCallback, context);
	    };
	
	  exports.SourceMapConsumer = SourceMapConsumer;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 46 */
/*!********************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/source-node.js ***!
  \********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var SourceMapGenerator = __webpack_require__(/*! ./source-map-generator */ 44).SourceMapGenerator;
	  var util = __webpack_require__(/*! ./util */ 60);
	
	  /**
	   * SourceNodes provide a way to abstract over interpolating/concatenating
	   * snippets of generated JavaScript source code while maintaining the line and
	   * column information associated with the original source code.
	   *
	   * @param aLine The original line number.
	   * @param aColumn The original column number.
	   * @param aSource The original source's filename.
	   * @param aChunks Optional. An array of strings which are snippets of
	   *        generated JS, or other SourceNodes.
	   * @param aName The original identifier.
	   */
	  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
	    this.children = [];
	    this.sourceContents = {};
	    this.line = aLine === undefined ? null : aLine;
	    this.column = aColumn === undefined ? null : aColumn;
	    this.source = aSource === undefined ? null : aSource;
	    this.name = aName === undefined ? null : aName;
	    if (aChunks != null) this.add(aChunks);
	  }
	
	  /**
	   * Creates a SourceNode from generated code and a SourceMapConsumer.
	   *
	   * @param aGeneratedCode The generated code
	   * @param aSourceMapConsumer The SourceMap for the generated code
	   */
	  SourceNode.fromStringWithSourceMap =
	    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer) {
	      // The SourceNode we want to fill with the generated code
	      // and the SourceMap
	      var node = new SourceNode();
	
	      // The generated code
	      // Processed fragments are removed from this array.
	      var remainingLines = aGeneratedCode.split('\n');
	
	      // We need to remember the position of "remainingLines"
	      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
	
	      // The generate SourceNodes we need a code range.
	      // To extract it current and last mapping is used.
	      // Here we store the last mapping.
	      var lastMapping = null;
	
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        if (lastMapping !== null) {
	          // We add the code from "lastMapping" to "mapping":
	          // First check if there is a new line in between.
	          if (lastGeneratedLine < mapping.generatedLine) {
	            var code = "";
	            // Associate first line with "lastMapping"
	            addMappingWithCode(lastMapping, remainingLines.shift() + "\n");
	            lastGeneratedLine++;
	            lastGeneratedColumn = 0;
	            // The remaining code is added without mapping
	          } else {
	            // There is no new line in between.
	            // Associate the code between "lastGeneratedColumn" and
	            // "mapping.generatedColumn" with "lastMapping"
	            var nextLine = remainingLines[0];
	            var code = nextLine.substr(0, mapping.generatedColumn -
	                                          lastGeneratedColumn);
	            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
	                                                lastGeneratedColumn);
	            lastGeneratedColumn = mapping.generatedColumn;
	            addMappingWithCode(lastMapping, code);
	            // No more remaining code, continue
	            lastMapping = mapping;
	            return;
	          }
	        }
	        // We add the generated code until the first mapping
	        // to the SourceNode without any mapping.
	        // Each line is added as separate string.
	        while (lastGeneratedLine < mapping.generatedLine) {
	          node.add(remainingLines.shift() + "\n");
	          lastGeneratedLine++;
	        }
	        if (lastGeneratedColumn < mapping.generatedColumn) {
	          var nextLine = remainingLines[0];
	          node.add(nextLine.substr(0, mapping.generatedColumn));
	          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
	          lastGeneratedColumn = mapping.generatedColumn;
	        }
	        lastMapping = mapping;
	      }, this);
	      // We have processed all mappings.
	      if (remainingLines.length > 0) {
	        if (lastMapping) {
	          // Associate the remaining code in the current line with "lastMapping"
	          var lastLine = remainingLines.shift();
	          if (remainingLines.length > 0) lastLine += "\n";
	          addMappingWithCode(lastMapping, lastLine);
	        }
	        // and add the remaining lines without any mapping
	        node.add(remainingLines.join("\n"));
	      }
	
	      // Copy sourcesContent into SourceNode
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content) {
	          node.setSourceContent(sourceFile, content);
	        }
	      });
	
	      return node;
	
	      function addMappingWithCode(mapping, code) {
	        if (mapping === null || mapping.source === undefined) {
	          node.add(code);
	        } else {
	          node.add(new SourceNode(mapping.originalLine,
	                                  mapping.originalColumn,
	                                  mapping.source,
	                                  code,
	                                  mapping.name));
	        }
	      }
	    };
	
	  /**
	   * Add a chunk of generated JS to this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.add = function SourceNode_add(aChunk) {
	    if (Array.isArray(aChunk)) {
	      aChunk.forEach(function (chunk) {
	        this.add(chunk);
	      }, this);
	    }
	    else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
	      if (aChunk) {
	        this.children.push(aChunk);
	      }
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };
	
	  /**
	   * Add a chunk of generated JS to the beginning of this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
	    if (Array.isArray(aChunk)) {
	      for (var i = aChunk.length-1; i >= 0; i--) {
	        this.prepend(aChunk[i]);
	      }
	    }
	    else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
	      this.children.unshift(aChunk);
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };
	
	  /**
	   * Walk over the tree of JS snippets in this node and its children. The
	   * walking function is called once for each snippet of JS and is passed that
	   * snippet and the its original associated source's line/column location.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
	    var chunk;
	    for (var i = 0, len = this.children.length; i < len; i++) {
	      chunk = this.children[i];
	      if (chunk instanceof SourceNode) {
	        chunk.walk(aFn);
	      }
	      else {
	        if (chunk !== '') {
	          aFn(chunk, { source: this.source,
	                       line: this.line,
	                       column: this.column,
	                       name: this.name });
	        }
	      }
	    }
	  };
	
	  /**
	   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
	   * each of `this.children`.
	   *
	   * @param aSep The separator.
	   */
	  SourceNode.prototype.join = function SourceNode_join(aSep) {
	    var newChildren;
	    var i;
	    var len = this.children.length;
	    if (len > 0) {
	      newChildren = [];
	      for (i = 0; i < len-1; i++) {
	        newChildren.push(this.children[i]);
	        newChildren.push(aSep);
	      }
	      newChildren.push(this.children[i]);
	      this.children = newChildren;
	    }
	    return this;
	  };
	
	  /**
	   * Call String.prototype.replace on the very right-most source snippet. Useful
	   * for trimming whitespace from the end of a source node, etc.
	   *
	   * @param aPattern The pattern to replace.
	   * @param aReplacement The thing to replace the pattern with.
	   */
	  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
	    var lastChild = this.children[this.children.length - 1];
	    if (lastChild instanceof SourceNode) {
	      lastChild.replaceRight(aPattern, aReplacement);
	    }
	    else if (typeof lastChild === 'string') {
	      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
	    }
	    else {
	      this.children.push(''.replace(aPattern, aReplacement));
	    }
	    return this;
	  };
	
	  /**
	   * Set the source content for a source file. This will be added to the SourceMapGenerator
	   * in the sourcesContent field.
	   *
	   * @param aSourceFile The filename of the source file
	   * @param aSourceContent The content of the source file
	   */
	  SourceNode.prototype.setSourceContent =
	    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
	      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
	    };
	
	  /**
	   * Walk over the tree of SourceNodes. The walking function is called for each
	   * source file content and is passed the filename and source content.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walkSourceContents =
	    function SourceNode_walkSourceContents(aFn) {
	      for (var i = 0, len = this.children.length; i < len; i++) {
	        if (this.children[i] instanceof SourceNode) {
	          this.children[i].walkSourceContents(aFn);
	        }
	      }
	
	      var sources = Object.keys(this.sourceContents);
	      for (var i = 0, len = sources.length; i < len; i++) {
	        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
	      }
	    };
	
	  /**
	   * Return the string representation of this source node. Walks over the tree
	   * and concatenates all the various snippets together to one string.
	   */
	  SourceNode.prototype.toString = function SourceNode_toString() {
	    var str = "";
	    this.walk(function (chunk) {
	      str += chunk;
	    });
	    return str;
	  };
	
	  /**
	   * Returns the string representation of this source node along with a source
	   * map.
	   */
	  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
	    var generated = {
	      code: "",
	      line: 1,
	      column: 0
	    };
	    var map = new SourceMapGenerator(aArgs);
	    var sourceMappingActive = false;
	    var lastOriginalSource = null;
	    var lastOriginalLine = null;
	    var lastOriginalColumn = null;
	    var lastOriginalName = null;
	    this.walk(function (chunk, original) {
	      generated.code += chunk;
	      if (original.source !== null
	          && original.line !== null
	          && original.column !== null) {
	        if(lastOriginalSource !== original.source
	           || lastOriginalLine !== original.line
	           || lastOriginalColumn !== original.column
	           || lastOriginalName !== original.name) {
	          map.addMapping({
	            source: original.source,
	            original: {
	              line: original.line,
	              column: original.column
	            },
	            generated: {
	              line: generated.line,
	              column: generated.column
	            },
	            name: original.name
	          });
	        }
	        lastOriginalSource = original.source;
	        lastOriginalLine = original.line;
	        lastOriginalColumn = original.column;
	        lastOriginalName = original.name;
	        sourceMappingActive = true;
	      } else if (sourceMappingActive) {
	        map.addMapping({
	          generated: {
	            line: generated.line,
	            column: generated.column
	          }
	        });
	        lastOriginalSource = null;
	        sourceMappingActive = false;
	      }
	      chunk.split('').forEach(function (ch, idx, array) {
	        if (ch === '\n') {
	          generated.line++;
	          generated.column = 0;
	          // Mappings end at eol
	          if (idx + 1 === array.length) {
	            lastOriginalSource = null;
	            sourceMappingActive = false;
	          } else if (sourceMappingActive) {
	            map.addMapping({
	              source: original.source,
	              original: {
	                line: original.line,
	                column: original.column
	              },
	              generated: {
	                line: generated.line,
	                column: generated.column
	              },
	              name: original.name
	            });
	          }
	        } else {
	          generated.column++;
	        }
	      });
	    });
	    this.walkSourceContents(function (sourceFile, sourceContent) {
	      map.setSourceContent(sourceFile, sourceContent);
	    });
	
	    return { code: generated.code, map: map };
	  };
	
	  exports.SourceNode = SourceNode;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 47 */
/*!************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/punycode/punycode.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.3.2 by @mathias */
	;(function(root) {
	
		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}
	
		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,
	
		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1
	
		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'
	
		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators
	
		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},
	
		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,
	
		/** Temporary variable */
		key;
	
		/*--------------------------------------------------------------------------*/
	
		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}
	
		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}
	
		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}
	
		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}
	
		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}
	
		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}
	
		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}
	
		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}
	
		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;
	
			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.
	
			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}
	
			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}
	
			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.
	
			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {
	
				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {
	
					if (index >= inputLength) {
						error('invalid-input');
					}
	
					digit = basicToDigit(input.charCodeAt(index++));
	
					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}
	
					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
	
					if (digit < t) {
						break;
					}
	
					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}
	
					w *= baseMinusT;
	
				}
	
				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);
	
				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}
	
				n += floor(i / out);
				i %= out;
	
				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);
	
			}
	
			return ucs2encode(output);
		}
	
		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;
	
			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);
	
			// Cache the length
			inputLength = input.length;
	
			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;
	
			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}
	
			handledCPCount = basicLength = output.length;
	
			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.
	
			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}
	
			// Main encoding loop:
			while (handledCPCount < inputLength) {
	
				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}
	
				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}
	
				delta += (m - n) * handledCPCountPlusOne;
				n = m;
	
				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];
	
					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}
	
					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}
	
						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}
	
				++delta;
				++n;
	
			}
			return output.join('');
		}
	
		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}
	
		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}
	
		/*--------------------------------------------------------------------------*/
	
		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.3.2',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};
	
		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}
	
	}(this));
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! (webpack)/buildin/module.js */ 65)(module), (function() { return this; }())))

/***/ },
/* 48 */
/*!****************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/querystring-es3/index.js ***!
  \****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.decode = exports.parse = __webpack_require__(/*! ./decode */ 63);
	exports.encode = exports.stringify = __webpack_require__(/*! ./encode */ 64);


/***/ },
/* 49 */
/*!*****************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/timers-browserify/main.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(/*! process/browser.js */ 68).nextTick;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;
	
	// DOM APIs, for completeness
	
	if (typeof setTimeout !== 'undefined') exports.setTimeout = function() { return setTimeout.apply(window, arguments); };
	if (typeof clearTimeout !== 'undefined') exports.clearTimeout = function() { clearTimeout.apply(window, arguments); };
	if (typeof setInterval !== 'undefined') exports.setInterval = function() { return setInterval.apply(window, arguments); };
	if (typeof clearInterval !== 'undefined') exports.clearInterval = function() { clearInterval.apply(window, arguments); };
	
	// TODO: Change to more efficient list approach used in Node.js
	// For now, we just implement the APIs using the primitives above.
	
	exports.enroll = function(item, delay) {
	  item._timeoutID = setTimeout(item._onTimeout, delay);
	};
	
	exports.unenroll = function(item) {
	  clearTimeout(item._timeoutID);
	};
	
	exports.active = function(item) {
	  // our naive impl doesn't care (correctness is still preserved)
	};
	
	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);
	
	  immediateIds[id] = true;
	
	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });
	
	  return id;
	};
	
	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! (webpack)/~/node-libs-browser/~/timers-browserify/main.js */ 49).setImmediate, __webpack_require__(/*! (webpack)/~/node-libs-browser/~/timers-browserify/main.js */ 49).clearImmediate))

/***/ },
/* 50 */
/*!************************************************!*\
  !*** ./~/blocks.js/~/observe/~/proto/proto.js ***!
  \************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var prototypeName='prototype', undefined, protoUndefined='undefined', init='init', ownProperty=({}).hasOwnProperty; // minifiable variables
	function proto() {
	    var args = arguments // minifiable variables
	
	    if(args.length == 1) {
	        var parent = {}
	        var prototypeBuilder = args[0]
	
	    } else { // length == 2
	        var parent = args[0]
	        var prototypeBuilder = args[1]
	    }
	
	    // special handling for Error objects
	    var namePointer = {}
	    if([Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError].indexOf(parent) !== -1) {
	        parent = normalizeErrorObject(parent, namePointer)
	    }
	
	    // set up the parent into the prototype chain if a parent is passed
	    var parentIsFunction = typeof(parent) === "function"
	    if(parentIsFunction) {
	        prototypeBuilder[prototypeName] = parent[prototypeName]
	    } else {
	        prototypeBuilder[prototypeName] = parent
	    }
	
	    // the prototype that will be used to make instances
	    var prototype = new prototypeBuilder(parent)
	    prototype.constructor = ProtoObjectFactory;    // set the constructor property on the prototype
	    namePointer.name = prototype.name
	
	    // if there's no init, assume its inheriting a non-proto class, so default to applying the superclass's constructor.
	    if(!prototype[init] && parentIsFunction) {
	        prototype[init] = function() {
	            parent.apply(this, arguments)
	        }
	    }
	
	    // constructor for empty object which will be populated via the constructor
	    var F = function() {}
	        F[prototypeName] = prototype    // set the prototype for created instances
	
	    function ProtoObjectFactory() {     // result object factory
	        var x = new F()                 // empty object
	
	        if(prototype[init]) {
	            var result = prototype[init].apply(x, arguments)    // populate object via the constructor
	            if(result === proto[protoUndefined])
	                return undefined
	            else if(result !== undefined)
	                return result
	            else
	                return x
	        } else {
	            return x
	        }
	    }
	
	    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
	    for(var n in prototype) {
	        addProperty(ProtoObjectFactory, prototype, n)
	    }
	
	    // add properties from parent that don't exist in the static class object yet (to get thing in like
	    for(var n in parent) {
	        if(Object.hasOwnProperty.call(parent, n) && ProtoObjectFactory[n] === undefined) {
	            addProperty(ProtoObjectFactory, parent, n)
	        }
	    }
	
	    ProtoObjectFactory[prototypeName] = prototype  // set the prototype on the object factory
	
	    return ProtoObjectFactory;
	}
	
	proto[protoUndefined] = {} // a special marker for when you want to return undefined from a constructor
	
	module.exports = proto
	
	function normalizeErrorObject(ErrorObject, namePointer) {
	    function NormalizedError() {
	        var tmp = new ErrorObject(arguments[0])
	        tmp.name = namePointer.name
	
	        this.message = tmp.message
	        if(Object.defineProperty) {
	            /*this.stack = */Object.defineProperty(this, 'stack', { // getter for more optimizy goodness
	                get: function() {
	                    return tmp.stack
	                }
	            })
	        } else {
	            this.stack = tmp.stack
	        }
	
	        return this
	    }
	        var IntermediateInheritor = function() {}
	            IntermediateInheritor.prototype = ErrorObject.prototype
	        NormalizedError.prototype = new IntermediateInheritor()
	    return NormalizedError
	}
	
	function addProperty(factoryObject, prototype, property) {
	    try {
	        var info = Object.getOwnPropertyDescriptor(prototype, property)
	        if(info.get !== undefined || info.get !== undefined && Object.defineProperty !== undefined) {
	            Object.defineProperty(factoryObject, property, info)
	        } else {
	            factoryObject[property] = prototype[property]
	        }
	    } catch(e) {
	        // do nothing, if a property (like `name`) can't be set, just ignore it
	    }
	}

/***/ },
/* 51 */
/*!*************************************************************************!*\
  !*** ./~/deadunit-core/~/async-future/~/trimArguments/trimArguments.js ***!
  \*************************************************************************/
25,
/* 52 */
/*!************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/error-stack-parser/error-stack-parser.js ***!
  \************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! stackframe */ 69)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('stackframe'));
	    } else {
	        root.ErrorStackParser = factory(root.StackFrame);
	    }
	}(this, function ErrorStackParser(StackFrame) {
	    'use strict';
	
	    var FIREFOX_SAFARI_STACK_REGEXP = /\S+\:\d+/;
	    var CHROME_IE_STACK_REGEXP = /\s+at /;
	
	    return {
	        /**
	         * Given an Error object, extract the most information from it.
	         * @param error {Error}
	         * @return Array[StackFrame]
	         */
	        parse: function ErrorStackParser$$parse(error) {
	            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
	                return this.parseOpera(error);
	            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
	                return this.parseV8OrIE(error);
	            } else if (error.stack && error.stack.match(FIREFOX_SAFARI_STACK_REGEXP)) {
	                return this.parseFFOrSafari(error);
	            } else {
	                throw new Error('Cannot parse given Error object');
	            }
	        },
	
	        /**
	         * Separate line and column numbers from a URL-like string.
	         * @param urlLike String
	         * @return Array[String]
	         */
	        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
	            // Guard against strings like "(native)"
	            if (urlLike.indexOf(':') === -1) {
	                return [];
	            }
	
	            var locationParts = urlLike.split(':');
	            var lastNumber = locationParts.pop();
	            var possibleNumber = locationParts[locationParts.length - 1];
	            if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
	                var lineNumber = locationParts.pop();
	                return [locationParts.join(':'), lineNumber, lastNumber];
	            } else {
	                return [locationParts.join(':'), lastNumber, undefined];
	            }
	        },
	
	        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
	            return error.stack.split('\n').slice(1).map(function (line) {
	                var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);
	                var locationParts = this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, ''));
	                var functionName = (!tokens[0] || tokens[0] === 'Anonymous') ? undefined : tokens[0];
	                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2]);
	            }, this);
	        },
	
	        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
	            return error.stack.split('\n').filter(function (line) {
	                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP);
	            }, this).map(function (line) {
	                var tokens = line.split('@');
	                var locationParts = this.extractLocation(tokens.pop());
	                var functionName = tokens.shift() || undefined;
	                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2]);
	            }, this);
	        },
	
	        parseOpera: function ErrorStackParser$$parseOpera(e) {
	            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
	                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
	                return this.parseOpera9(e);
	            } else if (!e.stack) {
	                return this.parseOpera10(e);
	            } else {
	                return this.parseOpera11(e);
	            }
	        },
	
	        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
	            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
	            var lines = e.message.split('\n');
	            var result = [];
	
	            for (var i = 2, len = lines.length; i < len; i += 2) {
	                var match = lineRE.exec(lines[i]);
	                if (match) {
	                    result.push(new StackFrame(undefined, undefined, match[2], match[1]));
	                }
	            }
	
	            return result;
	        },
	
	        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
	            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
	            var lines = e.stacktrace.split('\n');
	            var result = [];
	
	            for (var i = 0, len = lines.length; i < len; i += 2) {
	                var match = lineRE.exec(lines[i]);
	                if (match) {
	                    result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1]));
	                }
	            }
	
	            return result;
	        },
	
	        // Opera 10.65+ Error.stack very similar to FF/Safari
	        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
	            return error.stack.split('\n').filter(function (line) {
	                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
	                    !line.match(/^Error created at/);
	            }, this).map(function (line) {
	                var tokens = line.split('@');
	                var locationParts = this.extractLocation(tokens.pop());
	                var functionCall = (tokens.shift() || '');
	                var functionName = functionCall
	                        .replace(/<anonymous function(: (\w+))?>/, '$2')
	                        .replace(/\([^\)]*\)/g, '') || undefined;
	                var argsRaw;
	                if (functionCall.match(/\(([^\)]*)\)/)) {
	                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
	                }
	                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
	                return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2]);
	            }, this);
	        }
	    };
	}));
	


/***/ },
/* 53 */
/*!******************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stack-generator/stack-generator.js ***!
  \******************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! stackframe */ 70)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('stackframe'));
	    } else {
	        root.StackGenerator = factory(root.StackFrame);
	    }
	}(this, function (StackFrame) {
	    return {
	        backtrace: function StackGenerator$$backtrace(opts) {
	            var stack = [];
	            var maxStackSize = 10;
	
	            if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
	                maxStackSize = opts.maxStackSize;
	            }
	
	            var curr = arguments.callee;
	            while (curr && stack.length < maxStackSize) {
	                var args = [].slice.call(curr['arguments']);
	                if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
	                    stack.push(new StackFrame(RegExp.$1 || undefined, args));
	                } else {
	                    stack.push(new StackFrame(undefined, args));
	                }
	
	                try {
	                    curr = curr.caller;
	                } catch (e) {
	                    break;
	                }
	            }
	            return stack;
	        }
	    };
	}));


/***/ },
/* 54 */
/*!***************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/es6-promise/dist/es6-promise.js ***!
  \***************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process, global, module) {/*!
	 * @overview es6-promise - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
	 * @version   2.0.1
	 */
	
	(function() {
	    "use strict";
	
	    function $$utils$$objectOrFunction(x) {
	      return typeof x === 'function' || (typeof x === 'object' && x !== null);
	    }
	
	    function $$utils$$isFunction(x) {
	      return typeof x === 'function';
	    }
	
	    function $$utils$$isMaybeThenable(x) {
	      return typeof x === 'object' && x !== null;
	    }
	
	    var $$utils$$_isArray;
	
	    if (!Array.isArray) {
	      $$utils$$_isArray = function (x) {
	        return Object.prototype.toString.call(x) === '[object Array]';
	      };
	    } else {
	      $$utils$$_isArray = Array.isArray;
	    }
	
	    var $$utils$$isArray = $$utils$$_isArray;
	    var $$utils$$now = Date.now || function() { return new Date().getTime(); };
	    function $$utils$$F() { }
	
	    var $$utils$$o_create = (Object.create || function (o) {
	      if (arguments.length > 1) {
	        throw new Error('Second argument not supported');
	      }
	      if (typeof o !== 'object') {
	        throw new TypeError('Argument must be an object');
	      }
	      $$utils$$F.prototype = o;
	      return new $$utils$$F();
	    });
	
	    var $$asap$$len = 0;
	
	    var $$asap$$default = function asap(callback, arg) {
	      $$asap$$queue[$$asap$$len] = callback;
	      $$asap$$queue[$$asap$$len + 1] = arg;
	      $$asap$$len += 2;
	      if ($$asap$$len === 2) {
	        // If len is 1, that means that we need to schedule an async flush.
	        // If additional callbacks are queued before the queue is flushed, they
	        // will be processed by this flush that we are scheduling.
	        $$asap$$scheduleFlush();
	      }
	    };
	
	    var $$asap$$browserGlobal = (typeof window !== 'undefined') ? window : {};
	    var $$asap$$BrowserMutationObserver = $$asap$$browserGlobal.MutationObserver || $$asap$$browserGlobal.WebKitMutationObserver;
	
	    // test for web worker but not in IE10
	    var $$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
	      typeof importScripts !== 'undefined' &&
	      typeof MessageChannel !== 'undefined';
	
	    // node
	    function $$asap$$useNextTick() {
	      return function() {
	        process.nextTick($$asap$$flush);
	      };
	    }
	
	    function $$asap$$useMutationObserver() {
	      var iterations = 0;
	      var observer = new $$asap$$BrowserMutationObserver($$asap$$flush);
	      var node = document.createTextNode('');
	      observer.observe(node, { characterData: true });
	
	      return function() {
	        node.data = (iterations = ++iterations % 2);
	      };
	    }
	
	    // web worker
	    function $$asap$$useMessageChannel() {
	      var channel = new MessageChannel();
	      channel.port1.onmessage = $$asap$$flush;
	      return function () {
	        channel.port2.postMessage(0);
	      };
	    }
	
	    function $$asap$$useSetTimeout() {
	      return function() {
	        setTimeout($$asap$$flush, 1);
	      };
	    }
	
	    var $$asap$$queue = new Array(1000);
	
	    function $$asap$$flush() {
	      for (var i = 0; i < $$asap$$len; i+=2) {
	        var callback = $$asap$$queue[i];
	        var arg = $$asap$$queue[i+1];
	
	        callback(arg);
	
	        $$asap$$queue[i] = undefined;
	        $$asap$$queue[i+1] = undefined;
	      }
	
	      $$asap$$len = 0;
	    }
	
	    var $$asap$$scheduleFlush;
	
	    // Decide what async method to use to triggering processing of queued callbacks:
	    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
	      $$asap$$scheduleFlush = $$asap$$useNextTick();
	    } else if ($$asap$$BrowserMutationObserver) {
	      $$asap$$scheduleFlush = $$asap$$useMutationObserver();
	    } else if ($$asap$$isWorker) {
	      $$asap$$scheduleFlush = $$asap$$useMessageChannel();
	    } else {
	      $$asap$$scheduleFlush = $$asap$$useSetTimeout();
	    }
	
	    function $$$internal$$noop() {}
	    var $$$internal$$PENDING   = void 0;
	    var $$$internal$$FULFILLED = 1;
	    var $$$internal$$REJECTED  = 2;
	    var $$$internal$$GET_THEN_ERROR = new $$$internal$$ErrorObject();
	
	    function $$$internal$$selfFullfillment() {
	      return new TypeError("You cannot resolve a promise with itself");
	    }
	
	    function $$$internal$$cannotReturnOwn() {
	      return new TypeError('A promises callback cannot return that same promise.')
	    }
	
	    function $$$internal$$getThen(promise) {
	      try {
	        return promise.then;
	      } catch(error) {
	        $$$internal$$GET_THEN_ERROR.error = error;
	        return $$$internal$$GET_THEN_ERROR;
	      }
	    }
	
	    function $$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	      try {
	        then.call(value, fulfillmentHandler, rejectionHandler);
	      } catch(e) {
	        return e;
	      }
	    }
	
	    function $$$internal$$handleForeignThenable(promise, thenable, then) {
	       $$asap$$default(function(promise) {
	        var sealed = false;
	        var error = $$$internal$$tryThen(then, thenable, function(value) {
	          if (sealed) { return; }
	          sealed = true;
	          if (thenable !== value) {
	            $$$internal$$resolve(promise, value);
	          } else {
	            $$$internal$$fulfill(promise, value);
	          }
	        }, function(reason) {
	          if (sealed) { return; }
	          sealed = true;
	
	          $$$internal$$reject(promise, reason);
	        }, 'Settle: ' + (promise._label || ' unknown promise'));
	
	        if (!sealed && error) {
	          sealed = true;
	          $$$internal$$reject(promise, error);
	        }
	      }, promise);
	    }
	
	    function $$$internal$$handleOwnThenable(promise, thenable) {
	      if (thenable._state === $$$internal$$FULFILLED) {
	        $$$internal$$fulfill(promise, thenable._result);
	      } else if (promise._state === $$$internal$$REJECTED) {
	        $$$internal$$reject(promise, thenable._result);
	      } else {
	        $$$internal$$subscribe(thenable, undefined, function(value) {
	          $$$internal$$resolve(promise, value);
	        }, function(reason) {
	          $$$internal$$reject(promise, reason);
	        });
	      }
	    }
	
	    function $$$internal$$handleMaybeThenable(promise, maybeThenable) {
	      if (maybeThenable.constructor === promise.constructor) {
	        $$$internal$$handleOwnThenable(promise, maybeThenable);
	      } else {
	        var then = $$$internal$$getThen(maybeThenable);
	
	        if (then === $$$internal$$GET_THEN_ERROR) {
	          $$$internal$$reject(promise, $$$internal$$GET_THEN_ERROR.error);
	        } else if (then === undefined) {
	          $$$internal$$fulfill(promise, maybeThenable);
	        } else if ($$utils$$isFunction(then)) {
	          $$$internal$$handleForeignThenable(promise, maybeThenable, then);
	        } else {
	          $$$internal$$fulfill(promise, maybeThenable);
	        }
	      }
	    }
	
	    function $$$internal$$resolve(promise, value) {
	      if (promise === value) {
	        $$$internal$$reject(promise, $$$internal$$selfFullfillment());
	      } else if ($$utils$$objectOrFunction(value)) {
	        $$$internal$$handleMaybeThenable(promise, value);
	      } else {
	        $$$internal$$fulfill(promise, value);
	      }
	    }
	
	    function $$$internal$$publishRejection(promise) {
	      if (promise._onerror) {
	        promise._onerror(promise._result);
	      }
	
	      $$$internal$$publish(promise);
	    }
	
	    function $$$internal$$fulfill(promise, value) {
	      if (promise._state !== $$$internal$$PENDING) { return; }
	
	      promise._result = value;
	      promise._state = $$$internal$$FULFILLED;
	
	      if (promise._subscribers.length === 0) {
	      } else {
	        $$asap$$default($$$internal$$publish, promise);
	      }
	    }
	
	    function $$$internal$$reject(promise, reason) {
	      if (promise._state !== $$$internal$$PENDING) { return; }
	      promise._state = $$$internal$$REJECTED;
	      promise._result = reason;
	
	      $$asap$$default($$$internal$$publishRejection, promise);
	    }
	
	    function $$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
	      var subscribers = parent._subscribers;
	      var length = subscribers.length;
	
	      parent._onerror = null;
	
	      subscribers[length] = child;
	      subscribers[length + $$$internal$$FULFILLED] = onFulfillment;
	      subscribers[length + $$$internal$$REJECTED]  = onRejection;
	
	      if (length === 0 && parent._state) {
	        $$asap$$default($$$internal$$publish, parent);
	      }
	    }
	
	    function $$$internal$$publish(promise) {
	      var subscribers = promise._subscribers;
	      var settled = promise._state;
	
	      if (subscribers.length === 0) { return; }
	
	      var child, callback, detail = promise._result;
	
	      for (var i = 0; i < subscribers.length; i += 3) {
	        child = subscribers[i];
	        callback = subscribers[i + settled];
	
	        if (child) {
	          $$$internal$$invokeCallback(settled, child, callback, detail);
	        } else {
	          callback(detail);
	        }
	      }
	
	      promise._subscribers.length = 0;
	    }
	
	    function $$$internal$$ErrorObject() {
	      this.error = null;
	    }
	
	    var $$$internal$$TRY_CATCH_ERROR = new $$$internal$$ErrorObject();
	
	    function $$$internal$$tryCatch(callback, detail) {
	      try {
	        return callback(detail);
	      } catch(e) {
	        $$$internal$$TRY_CATCH_ERROR.error = e;
	        return $$$internal$$TRY_CATCH_ERROR;
	      }
	    }
	
	    function $$$internal$$invokeCallback(settled, promise, callback, detail) {
	      var hasCallback = $$utils$$isFunction(callback),
	          value, error, succeeded, failed;
	
	      if (hasCallback) {
	        value = $$$internal$$tryCatch(callback, detail);
	
	        if (value === $$$internal$$TRY_CATCH_ERROR) {
	          failed = true;
	          error = value.error;
	          value = null;
	        } else {
	          succeeded = true;
	        }
	
	        if (promise === value) {
	          $$$internal$$reject(promise, $$$internal$$cannotReturnOwn());
	          return;
	        }
	
	      } else {
	        value = detail;
	        succeeded = true;
	      }
	
	      if (promise._state !== $$$internal$$PENDING) {
	        // noop
	      } else if (hasCallback && succeeded) {
	        $$$internal$$resolve(promise, value);
	      } else if (failed) {
	        $$$internal$$reject(promise, error);
	      } else if (settled === $$$internal$$FULFILLED) {
	        $$$internal$$fulfill(promise, value);
	      } else if (settled === $$$internal$$REJECTED) {
	        $$$internal$$reject(promise, value);
	      }
	    }
	
	    function $$$internal$$initializePromise(promise, resolver) {
	      try {
	        resolver(function resolvePromise(value){
	          $$$internal$$resolve(promise, value);
	        }, function rejectPromise(reason) {
	          $$$internal$$reject(promise, reason);
	        });
	      } catch(e) {
	        $$$internal$$reject(promise, e);
	      }
	    }
	
	    function $$$enumerator$$makeSettledResult(state, position, value) {
	      if (state === $$$internal$$FULFILLED) {
	        return {
	          state: 'fulfilled',
	          value: value
	        };
	      } else {
	        return {
	          state: 'rejected',
	          reason: value
	        };
	      }
	    }
	
	    function $$$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
	      this._instanceConstructor = Constructor;
	      this.promise = new Constructor($$$internal$$noop, label);
	      this._abortOnReject = abortOnReject;
	
	      if (this._validateInput(input)) {
	        this._input     = input;
	        this.length     = input.length;
	        this._remaining = input.length;
	
	        this._init();
	
	        if (this.length === 0) {
	          $$$internal$$fulfill(this.promise, this._result);
	        } else {
	          this.length = this.length || 0;
	          this._enumerate();
	          if (this._remaining === 0) {
	            $$$internal$$fulfill(this.promise, this._result);
	          }
	        }
	      } else {
	        $$$internal$$reject(this.promise, this._validationError());
	      }
	    }
	
	    $$$enumerator$$Enumerator.prototype._validateInput = function(input) {
	      return $$utils$$isArray(input);
	    };
	
	    $$$enumerator$$Enumerator.prototype._validationError = function() {
	      return new Error('Array Methods must be provided an Array');
	    };
	
	    $$$enumerator$$Enumerator.prototype._init = function() {
	      this._result = new Array(this.length);
	    };
	
	    var $$$enumerator$$default = $$$enumerator$$Enumerator;
	
	    $$$enumerator$$Enumerator.prototype._enumerate = function() {
	      var length  = this.length;
	      var promise = this.promise;
	      var input   = this._input;
	
	      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
	        this._eachEntry(input[i], i);
	      }
	    };
	
	    $$$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
	      var c = this._instanceConstructor;
	      if ($$utils$$isMaybeThenable(entry)) {
	        if (entry.constructor === c && entry._state !== $$$internal$$PENDING) {
	          entry._onerror = null;
	          this._settledAt(entry._state, i, entry._result);
	        } else {
	          this._willSettleAt(c.resolve(entry), i);
	        }
	      } else {
	        this._remaining--;
	        this._result[i] = this._makeResult($$$internal$$FULFILLED, i, entry);
	      }
	    };
	
	    $$$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
	      var promise = this.promise;
	
	      if (promise._state === $$$internal$$PENDING) {
	        this._remaining--;
	
	        if (this._abortOnReject && state === $$$internal$$REJECTED) {
	          $$$internal$$reject(promise, value);
	        } else {
	          this._result[i] = this._makeResult(state, i, value);
	        }
	      }
	
	      if (this._remaining === 0) {
	        $$$internal$$fulfill(promise, this._result);
	      }
	    };
	
	    $$$enumerator$$Enumerator.prototype._makeResult = function(state, i, value) {
	      return value;
	    };
	
	    $$$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
	      var enumerator = this;
	
	      $$$internal$$subscribe(promise, undefined, function(value) {
	        enumerator._settledAt($$$internal$$FULFILLED, i, value);
	      }, function(reason) {
	        enumerator._settledAt($$$internal$$REJECTED, i, reason);
	      });
	    };
	
	    var $$promise$all$$default = function all(entries, label) {
	      return new $$$enumerator$$default(this, entries, true /* abort on reject */, label).promise;
	    };
	
	    var $$promise$race$$default = function race(entries, label) {
	      /*jshint validthis:true */
	      var Constructor = this;
	
	      var promise = new Constructor($$$internal$$noop, label);
	
	      if (!$$utils$$isArray(entries)) {
	        $$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
	        return promise;
	      }
	
	      var length = entries.length;
	
	      function onFulfillment(value) {
	        $$$internal$$resolve(promise, value);
	      }
	
	      function onRejection(reason) {
	        $$$internal$$reject(promise, reason);
	      }
	
	      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
	        $$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
	      }
	
	      return promise;
	    };
	
	    var $$promise$resolve$$default = function resolve(object, label) {
	      /*jshint validthis:true */
	      var Constructor = this;
	
	      if (object && typeof object === 'object' && object.constructor === Constructor) {
	        return object;
	      }
	
	      var promise = new Constructor($$$internal$$noop, label);
	      $$$internal$$resolve(promise, object);
	      return promise;
	    };
	
	    var $$promise$reject$$default = function reject(reason, label) {
	      /*jshint validthis:true */
	      var Constructor = this;
	      var promise = new Constructor($$$internal$$noop, label);
	      $$$internal$$reject(promise, reason);
	      return promise;
	    };
	
	    var $$es6$promise$promise$$counter = 0;
	
	    function $$es6$promise$promise$$needsResolver() {
	      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	    }
	
	    function $$es6$promise$promise$$needsNew() {
	      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	    }
	
	    var $$es6$promise$promise$$default = $$es6$promise$promise$$Promise;
	
	    /**
	      Promise objects represent the eventual result of an asynchronous operation. The
	      primary way of interacting with a promise is through its `then` method, which
	      registers callbacks to receive either a promise’s eventual value or the reason
	      why the promise cannot be fulfilled.
	
	      Terminology
	      -----------
	
	      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
	      - `thenable` is an object or function that defines a `then` method.
	      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
	      - `exception` is a value that is thrown using the throw statement.
	      - `reason` is a value that indicates why a promise was rejected.
	      - `settled` the final resting state of a promise, fulfilled or rejected.
	
	      A promise can be in one of three states: pending, fulfilled, or rejected.
	
	      Promises that are fulfilled have a fulfillment value and are in the fulfilled
	      state.  Promises that are rejected have a rejection reason and are in the
	      rejected state.  A fulfillment value is never a thenable.
	
	      Promises can also be said to *resolve* a value.  If this value is also a
	      promise, then the original promise's settled state will match the value's
	      settled state.  So a promise that *resolves* a promise that rejects will
	      itself reject, and a promise that *resolves* a promise that fulfills will
	      itself fulfill.
	
	
	      Basic Usage:
	      ------------
	
	      ```js
	      var promise = new Promise(function(resolve, reject) {
	        // on success
	        resolve(value);
	
	        // on failure
	        reject(reason);
	      });
	
	      promise.then(function(value) {
	        // on fulfillment
	      }, function(reason) {
	        // on rejection
	      });
	      ```
	
	      Advanced Usage:
	      ---------------
	
	      Promises shine when abstracting away asynchronous interactions such as
	      `XMLHttpRequest`s.
	
	      ```js
	      function getJSON(url) {
	        return new Promise(function(resolve, reject){
	          var xhr = new XMLHttpRequest();
	
	          xhr.open('GET', url);
	          xhr.onreadystatechange = handler;
	          xhr.responseType = 'json';
	          xhr.setRequestHeader('Accept', 'application/json');
	          xhr.send();
	
	          function handler() {
	            if (this.readyState === this.DONE) {
	              if (this.status === 200) {
	                resolve(this.response);
	              } else {
	                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
	              }
	            }
	          };
	        });
	      }
	
	      getJSON('/posts.json').then(function(json) {
	        // on fulfillment
	      }, function(reason) {
	        // on rejection
	      });
	      ```
	
	      Unlike callbacks, promises are great composable primitives.
	
	      ```js
	      Promise.all([
	        getJSON('/posts'),
	        getJSON('/comments')
	      ]).then(function(values){
	        values[0] // => postsJSON
	        values[1] // => commentsJSON
	
	        return values;
	      });
	      ```
	
	      @class Promise
	      @param {function} resolver
	      Useful for tooling.
	      @constructor
	    */
	    function $$es6$promise$promise$$Promise(resolver) {
	      this._id = $$es6$promise$promise$$counter++;
	      this._state = undefined;
	      this._result = undefined;
	      this._subscribers = [];
	
	      if ($$$internal$$noop !== resolver) {
	        if (!$$utils$$isFunction(resolver)) {
	          $$es6$promise$promise$$needsResolver();
	        }
	
	        if (!(this instanceof $$es6$promise$promise$$Promise)) {
	          $$es6$promise$promise$$needsNew();
	        }
	
	        $$$internal$$initializePromise(this, resolver);
	      }
	    }
	
	    $$es6$promise$promise$$Promise.all = $$promise$all$$default;
	    $$es6$promise$promise$$Promise.race = $$promise$race$$default;
	    $$es6$promise$promise$$Promise.resolve = $$promise$resolve$$default;
	    $$es6$promise$promise$$Promise.reject = $$promise$reject$$default;
	
	    $$es6$promise$promise$$Promise.prototype = {
	      constructor: $$es6$promise$promise$$Promise,
	
	    /**
	      The primary way of interacting with a promise is through its `then` method,
	      which registers callbacks to receive either a promise's eventual value or the
	      reason why the promise cannot be fulfilled.
	
	      ```js
	      findUser().then(function(user){
	        // user is available
	      }, function(reason){
	        // user is unavailable, and you are given the reason why
	      });
	      ```
	
	      Chaining
	      --------
	
	      The return value of `then` is itself a promise.  This second, 'downstream'
	      promise is resolved with the return value of the first promise's fulfillment
	      or rejection handler, or rejected if the handler throws an exception.
	
	      ```js
	      findUser().then(function (user) {
	        return user.name;
	      }, function (reason) {
	        return 'default name';
	      }).then(function (userName) {
	        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	        // will be `'default name'`
	      });
	
	      findUser().then(function (user) {
	        throw new Error('Found user, but still unhappy');
	      }, function (reason) {
	        throw new Error('`findUser` rejected and we're unhappy');
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	      });
	      ```
	      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
	
	      ```js
	      findUser().then(function (user) {
	        throw new PedagogicalException('Upstream error');
	      }).then(function (value) {
	        // never reached
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // The `PedgagocialException` is propagated all the way down to here
	      });
	      ```
	
	      Assimilation
	      ------------
	
	      Sometimes the value you want to propagate to a downstream promise can only be
	      retrieved asynchronously. This can be achieved by returning a promise in the
	      fulfillment or rejection handler. The downstream promise will then be pending
	      until the returned promise is settled. This is called *assimilation*.
	
	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // The user's comments are now available
	      });
	      ```
	
	      If the assimliated promise rejects, then the downstream promise will also reject.
	
	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // If `findCommentsByAuthor` fulfills, we'll have the value here
	      }, function (reason) {
	        // If `findCommentsByAuthor` rejects, we'll have the reason here
	      });
	      ```
	
	      Simple Example
	      --------------
	
	      Synchronous Example
	
	      ```javascript
	      var result;
	
	      try {
	        result = findResult();
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```
	
	      Errback Example
	
	      ```js
	      findResult(function(result, err){
	        if (err) {
	          // failure
	        } else {
	          // success
	        }
	      });
	      ```
	
	      Promise Example;
	
	      ```javascript
	      findResult().then(function(result){
	        // success
	      }, function(reason){
	        // failure
	      });
	      ```
	
	      Advanced Example
	      --------------
	
	      Synchronous Example
	
	      ```javascript
	      var author, books;
	
	      try {
	        author = findAuthor();
	        books  = findBooksByAuthor(author);
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```
	
	      Errback Example
	
	      ```js
	
	      function foundBooks(books) {
	
	      }
	
	      function failure(reason) {
	
	      }
	
	      findAuthor(function(author, err){
	        if (err) {
	          failure(err);
	          // failure
	        } else {
	          try {
	            findBoooksByAuthor(author, function(books, err) {
	              if (err) {
	                failure(err);
	              } else {
	                try {
	                  foundBooks(books);
	                } catch(reason) {
	                  failure(reason);
	                }
	              }
	            });
	          } catch(error) {
	            failure(err);
	          }
	          // success
	        }
	      });
	      ```
	
	      Promise Example;
	
	      ```javascript
	      findAuthor().
	        then(findBooksByAuthor).
	        then(function(books){
	          // found books
	      }).catch(function(reason){
	        // something went wrong
	      });
	      ```
	
	      @method then
	      @param {Function} onFulfilled
	      @param {Function} onRejected
	      Useful for tooling.
	      @return {Promise}
	    */
	      then: function(onFulfillment, onRejection) {
	        var parent = this;
	        var state = parent._state;
	
	        if (state === $$$internal$$FULFILLED && !onFulfillment || state === $$$internal$$REJECTED && !onRejection) {
	          return this;
	        }
	
	        var child = new this.constructor($$$internal$$noop);
	        var result = parent._result;
	
	        if (state) {
	          var callback = arguments[state - 1];
	          $$asap$$default(function(){
	            $$$internal$$invokeCallback(state, child, callback, result);
	          });
	        } else {
	          $$$internal$$subscribe(parent, child, onFulfillment, onRejection);
	        }
	
	        return child;
	      },
	
	    /**
	      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	      as the catch block of a try/catch statement.
	
	      ```js
	      function findAuthor(){
	        throw new Error('couldn't find that author');
	      }
	
	      // synchronous
	      try {
	        findAuthor();
	      } catch(reason) {
	        // something went wrong
	      }
	
	      // async with promises
	      findAuthor().catch(function(reason){
	        // something went wrong
	      });
	      ```
	
	      @method catch
	      @param {Function} onRejection
	      Useful for tooling.
	      @return {Promise}
	    */
	      'catch': function(onRejection) {
	        return this.then(null, onRejection);
	      }
	    };
	
	    var $$es6$promise$polyfill$$default = function polyfill() {
	      var local;
	
	      if (typeof global !== 'undefined') {
	        local = global;
	      } else if (typeof window !== 'undefined' && window.document) {
	        local = window;
	      } else {
	        local = self;
	      }
	
	      var es6PromiseSupport =
	        "Promise" in local &&
	        // Some of these methods are missing from
	        // Firefox/Chrome experimental implementations
	        "resolve" in local.Promise &&
	        "reject" in local.Promise &&
	        "all" in local.Promise &&
	        "race" in local.Promise &&
	        // Older version of the spec had a resolver object
	        // as the arg rather than a function
	        (function() {
	          var resolve;
	          new local.Promise(function(r) { resolve = r; });
	          return $$utils$$isFunction(resolve);
	        }());
	
	      if (!es6PromiseSupport) {
	        local.Promise = $$es6$promise$promise$$default;
	      }
	    };
	
	    var es6$promise$umd$$ES6Promise = {
	      'Promise': $$es6$promise$promise$$default,
	      'polyfill': $$es6$promise$polyfill$$default
	    };
	
	    /* global define:true module:true window: true */
	    if ("function" === 'function' && __webpack_require__(/*! !webpack amd define */ 66)['amd']) {
	      !(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return es6$promise$umd$$ES6Promise; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module !== 'undefined' && module['exports']) {
	      module['exports'] = es6$promise$umd$$ES6Promise;
	    } else if (typeof this !== 'undefined') {
	      this['ES6Promise'] = es6$promise$umd$$ES6Promise;
	    }
	}).call(this);
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! (webpack)/~/node-libs-browser/~/process/browser.js */ 20), (function() { return this; }()), __webpack_require__(/*! (webpack)/buildin/module.js */ 65)(module)))

/***/ },
/* 55 */
/*!****************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/stacktrace-gps.js ***!
  \****************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! source-map */ 71), __webpack_require__(/*! es6-promise */ 54), __webpack_require__(/*! stackframe */ 72)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('source-map/lib/source-map/source-map-consumer'), require('es6-promise'), require('stackframe'));
	    } else {
	        root.StackTraceGPS = factory(root.SourceMap, root.ES6Promise, root.StackFrame);
	    }
	}(this, function (SourceMap, ES6Promise, StackFrame) {
	    'use strict';
	    ES6Promise.polyfill();
	    var Promise = ES6Promise.Promise;
	
	    /**
	     * Create XHR or equivalent object for this environment.
	     * @returns XMLHttpRequest, XDomainRequest or ActiveXObject
	     * @private
	     */
	    function _createXMLHTTPObject() {
	        var xmlhttp;
	        var XMLHttpFactories = [
	            function () {
	                return new XMLHttpRequest();
	            }, function () {
	                return new ActiveXObject('Microsoft.XMLHTTP');
	            }
	        ];
	        for (var i = 0; i < XMLHttpFactories.length; i++) {
	            try {
	                xmlhttp = XMLHttpFactories[i]();
	                // Use memoization to cache the factory
	                _createXMLHTTPObject = XMLHttpFactories[i]; // jshint ignore:line
	                return xmlhttp;
	            } catch (e) {
	            }
	        }
	    }
	
	    /**
	     * Make a X-Domain request to url and callback.
	     *
	     * @param url [String]
	     * @param callback [Function] to callback on completion
	     * @param errback [Function] to callback on error
	     */
	    function _xdr(url, callback, errback) {
	        var req = _createXMLHTTPObject();
	        req.open('get', url);
	        req.onerror = errback;
	        req.onreadystatechange = function onreadystatechange() {
	            if (req.readyState === 4) {
	                if (req.status >= 200 && req.status < 400) {
	                    return callback(req.responseText);
	                } else {
	                    errback(new Error('Unable to retrieve ' + url));
	                }
	            }
	        };
	        req.send();
	    }
	
	    function _findFunctionName(source, lineNumber, columnNumber) {
	        // function {name}({args}) m[1]=name m[2]=args
	        var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
	        // {name} = function ({args}) TODO args capture
	        var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
	        // {name} = eval()
	        var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
	        var lines = source.split("\n");
	
	        // Walk backwards in the source lines until we find the line which matches one of the patterns above
	        var code = '', line, maxLines = Math.min(lineNumber, 20), m, commentPos;
	        for (var i = 0; i < maxLines; ++i) {
	            // lineNo is 1-based, source[] is 0-based
	            line = lines[lineNumber - i - 1];
	            commentPos = line.indexOf('//');
	            if (commentPos >= 0) {
	                line = line.substr(0, commentPos);
	            }
	
	            if (line) {
	                code = line + code;
	                m = reFunctionExpression.exec(code);
	                if (m && m[1]) {
	                    return m[1];
	                }
	                m = reFunctionDeclaration.exec(code);
	                if (m && m[1]) {
	                    //return m[1] + "(" + (m[2] || "") + ")";
	                    return m[1];
	                }
	                m = reFunctionEvaluation.exec(code);
	                if (m && m[1]) {
	                    return m[1];
	                }
	            }
	        }
	        return undefined;
	    }
	
	    function _ensureSupportedEnvironment() {
	        if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
	            throw new Error('Unable to consume source maps in older browsers');
	        }
	    }
	
	    function _ensureStackFrameIsLegit(stackframe) {
	        if (typeof stackframe !== 'object') {
	            throw new TypeError('Given StackFrame is not an object');
	        } else if (typeof stackframe.fileName !== 'string') {
	            throw new TypeError('Given file name is not a String');
	        } else if (typeof stackframe.lineNumber !== 'number' || stackframe.lineNumber % 1 !== 0 || stackframe.lineNumber < 1) {
	            throw new TypeError('Given line number must be a positive integer');
	        } else if (typeof stackframe.columnNumber !== 'number' || stackframe.columnNumber % 1 !== 0 || stackframe.columnNumber < 0) {
	            throw new TypeError('Given column number must be a non-negative integer');
	        }
	        return true;
	    }
	
	    function _findSourceMappingURL(source) {
	        var m = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)$/.exec(source);
	        if (m && m[1]) {
	            return m[1];
	        } else {
	            throw new Error('sourceMappingURL not found');
	        }
	    }
	
	    function _newLocationInfoFromSourceMap(rawSourceMap, args, lineNumber, columnNumber) {
	        var loc = new SourceMap.SourceMapConsumer(rawSourceMap)
	            .originalPositionFor({line: lineNumber, column: columnNumber});
	        return new StackFrame(loc.name, args, loc.source, loc.line, loc.column);
	    }
	
	    /**
	     * @param opts: [Object] options.
	     *      opts.sourceCache = {url: "Source String"} => preload source cache
	     *      opts.offline = True to prevent network requests.
	     *              Best effort without sources or source maps.
	     */
	    return function StackTraceGPS(opts) {
	        if (!(this instanceof StackTraceGPS)) {
	            return new StackTraceGPS(opts);
	        }
	        opts = opts || {};
	
	        this.sourceCache = opts.sourceCache || {};
	
	        this._get = function _get(location) {
	            return new Promise(function (resolve, reject) {
	                if (this.sourceCache[location]) {
	                    resolve(this.sourceCache[location]);
	                } else if (opts.offline) {
	                    reject(new Error('Cannot make network requests in offline mode'));
	                } else {
	                    _xdr(location, function (source) {
	                        this.sourceCache[location] = source;
	                        resolve(source);
	                    }.bind(this), reject);
	                }
	            }.bind(this));
	        };
	
	        /**
	         * Given a StackFrame, enhance function name and use source maps for a
	         * better StackFrame.
	         *
	         * @param stackframe - {StackFrame}-like object
	         *      {fileName: 'path/to/file.js', lineNumber: 100, columnNumber: 5}
	         * @return StackFrame with source-mapped location
	         */
	        this.pinpoint = function StackTraceGPS$$pinpoint(stackframe) {
	            return new Promise(function (resolve, reject) {
	                this.getMappedLocation(stackframe).then(function (mappedStackFrame) {
	                    function resolveMappedStackFrame() {
	                        resolve(mappedStackFrame);
	                    }
	
	                    this.findFunctionName(mappedStackFrame)
	                        .then(resolve, resolveMappedStackFrame)
	                        ['catch'](resolveMappedStackFrame);
	                }.bind(this), reject);
	            }.bind(this));
	        };
	
	        /**
	         * Given a StackFrame, guess function name from location information.
	         *
	         * @param stackframe - {StackFrame}-like object
	         *      {fileName: 'path/to/file.js', lineNumber: 100, columnNumber: 5}
	         * @return StackFrame with guessed function name
	         */
	        this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe) {
	            return new Promise(function (resolve, reject) {
	                _ensureStackFrameIsLegit(stackframe);
	                this._get(stackframe.fileName).then(function getSourceCallback(source) {
	                    var guessedFunctionName = _findFunctionName(source, stackframe.lineNumber, stackframe.columnNumber);
	                    resolve(new StackFrame(guessedFunctionName, stackframe.args, stackframe.fileName, stackframe.lineNumber, stackframe.columnNumber));
	                }, reject);
	            }.bind(this));
	        };
	
	        /**
	         * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
	         *
	         * @param stackframe - {StackFrame}-like object
	         *      {fileName: 'path/to/file.js', lineNumber: 100, columnNumber: 5}
	         * @return StackFrame with source-mapped location
	         */
	        this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe) {
	            return new Promise(function (resolve, reject) {
	                _ensureSupportedEnvironment();
	                _ensureStackFrameIsLegit(stackframe);
	
	                this._get(stackframe.fileName).then(function (source) {
	                    this._get(_findSourceMappingURL(source)).then(function (map) {
	                        var lineNumber = stackframe.lineNumber;
	                        var columnNumber = stackframe.columnNumber;
	                        resolve(_newLocationInfoFromSourceMap(map, stackframe.args, lineNumber, columnNumber));
	                    }, reject)['catch'](reject);
	                }.bind(this), reject)['catch'](reject);
	            }.bind(this));
	        };
	    };
	}));


/***/ },
/* 56 */
/*!**************************************************************!*\
  !*** ./~/deadunit-core/~/ajax/~/async-future/asyncFuture.js ***!
  \**************************************************************/
[103, 73],
/* 57 */
/*!*********************************************************************************!*\
  !*** ./~/deadunit-core/~/source-map-resolve/~/source-map-url/source-map-url.js ***!
  \*********************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// Copyright 2014 Simon Lydell
	
	void (function(root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else if (typeof exports === "object") {
	    module.exports = factory()
	  } else {
	    root.sourceMappingURL = factory()
	  }
	}(this, function(undefined) {
	
	  var innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/
	  var newlineRegex = /\r\n?|\n/
	
	  var regex = RegExp(
	    "(^|(?:" + newlineRegex.source + "))" +
	    "(?:" +
	      "/\\*" +
	      "(?:\\s*(?:" + newlineRegex.source + ")(?://)?)?" +
	      "(?:" + innerRegex.source + ")" +
	      "\\s*" +
	      "\\*/" +
	      "|" +
	      "//(?:" + innerRegex.source + ")" +
	    ")" +
	    "\\s*$"
	  )
	
	  function SourceMappingURL(commentSyntax) {
	    this._commentSyntax = commentSyntax
	  }
	
	  SourceMappingURL.prototype.regex = regex
	  SourceMappingURL.prototype._innerRegex = innerRegex
	  SourceMappingURL.prototype._newlineRegex = newlineRegex
	
	  SourceMappingURL.prototype.get = function(code) {
	    var match = code.match(this.regex)
	    if (!match) {
	      return null
	    }
	    return match[2] || match[3] || ""
	  }
	
	  SourceMappingURL.prototype.set = function(code, url, commentSyntax) {
	    if (!commentSyntax) {
	      commentSyntax = this._commentSyntax
	    }
	    // Use a newline present in the code, or fall back to '\n'.
	    var newline = String(code.match(this._newlineRegex) || "\n")
	    var open = commentSyntax[0], close = commentSyntax[1] || ""
	    code = this.remove(code)
	    return code + newline + open + "# sourceMappingURL=" + url + close
	  }
	
	  SourceMappingURL.prototype.remove = function(code) {
	    return code.replace(this.regex, "")
	  }
	
	  SourceMappingURL.prototype.insertBefore = function(code, string) {
	    var match = code.match(this.regex)
	    if (match) {
	      var hasNewline = Boolean(match[1])
	      return code.slice(0, match.index) +
	        string +
	        (hasNewline ? "" : "\n") +
	        code.slice(match.index)
	    } else {
	      return code + string
	    }
	  }
	
	  SourceMappingURL.prototype.SourceMappingURL = SourceMappingURL
	
	  return new SourceMappingURL(["/*", " */"])
	
	}));


/***/ },
/* 58 */
/*!***************************************************************************!*\
  !*** ./~/deadunit-core/~/source-map-resolve/~/resolve-url/resolve-url.js ***!
  \***************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// Copyright 2014 Simon Lydell
	// X11 (“MIT”) Licensed. (See LICENSE.)
	
	void (function(root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else if (typeof exports === "object") {
	    module.exports = factory()
	  } else {
	    root.resolveUrl = factory()
	  }
	}(this, function() {
	
	  function resolveUrl(/* ...urls */) {
	    var numUrls = arguments.length
	
	    if (numUrls === 0) {
	      throw new Error("resolveUrl requires at least one argument; got none.")
	    }
	
	    var base = document.createElement("base")
	    base.href = arguments[0]
	
	    if (numUrls === 1) {
	      return base.href
	    }
	
	    var head = document.getElementsByTagName("head")[0]
	    head.insertBefore(base, head.firstChild)
	
	    var a = document.createElement("a")
	    var resolved
	
	    for (var index = 1; index < numUrls; index++) {
	      a.href = arguments[index]
	      resolved = a.href
	      base.href = resolved
	    }
	
	    head.removeChild(base)
	
	    return resolved
	  }
	
	  return resolveUrl
	
	}));


/***/ },
/* 59 */
/*!*******************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/base64-vlq.js ***!
  \*******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 *
	 * Based on the Base 64 VLQ implementation in Closure Compiler:
	 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
	 *
	 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *  * Redistributions of source code must retain the above copyright
	 *    notice, this list of conditions and the following disclaimer.
	 *  * Redistributions in binary form must reproduce the above
	 *    copyright notice, this list of conditions and the following
	 *    disclaimer in the documentation and/or other materials provided
	 *    with the distribution.
	 *  * Neither the name of Google Inc. nor the names of its
	 *    contributors may be used to endorse or promote products derived
	 *    from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var base64 = __webpack_require__(/*! ./base64 */ 67);
	
	  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
	  // length quantities we use in the source map spec, the first bit is the sign,
	  // the next four bits are the actual value, and the 6th bit is the
	  // continuation bit. The continuation bit tells us whether there are more
	  // digits in this value following this digit.
	  //
	  //   Continuation
	  //   |    Sign
	  //   |    |
	  //   V    V
	  //   101011
	
	  var VLQ_BASE_SHIFT = 5;
	
	  // binary: 100000
	  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
	
	  // binary: 011111
	  var VLQ_BASE_MASK = VLQ_BASE - 1;
	
	  // binary: 100000
	  var VLQ_CONTINUATION_BIT = VLQ_BASE;
	
	  /**
	   * Converts from a two-complement value to a value where the sign bit is
	   * is placed in the least significant bit.  For example, as decimals:
	   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
	   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
	   */
	  function toVLQSigned(aValue) {
	    return aValue < 0
	      ? ((-aValue) << 1) + 1
	      : (aValue << 1) + 0;
	  }
	
	  /**
	   * Converts to a two-complement value from a value where the sign bit is
	   * is placed in the least significant bit.  For example, as decimals:
	   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
	   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
	   */
	  function fromVLQSigned(aValue) {
	    var isNegative = (aValue & 1) === 1;
	    var shifted = aValue >> 1;
	    return isNegative
	      ? -shifted
	      : shifted;
	  }
	
	  /**
	   * Returns the base 64 VLQ encoded value.
	   */
	  exports.encode = function base64VLQ_encode(aValue) {
	    var encoded = "";
	    var digit;
	
	    var vlq = toVLQSigned(aValue);
	
	    do {
	      digit = vlq & VLQ_BASE_MASK;
	      vlq >>>= VLQ_BASE_SHIFT;
	      if (vlq > 0) {
	        // There are still more digits in this value, so we must make sure the
	        // continuation bit is marked.
	        digit |= VLQ_CONTINUATION_BIT;
	      }
	      encoded += base64.encode(digit);
	    } while (vlq > 0);
	
	    return encoded;
	  };
	
	  /**
	   * Decodes the next base 64 VLQ value from the given string and returns the
	   * value and the rest of the string.
	   */
	  exports.decode = function base64VLQ_decode(aStr) {
	    var i = 0;
	    var strLen = aStr.length;
	    var result = 0;
	    var shift = 0;
	    var continuation, digit;
	
	    do {
	      if (i >= strLen) {
	        throw new Error("Expected more digits in base 64 VLQ value.");
	      }
	      digit = base64.decode(aStr.charAt(i++));
	      continuation = !!(digit & VLQ_CONTINUATION_BIT);
	      digit &= VLQ_BASE_MASK;
	      result = result + (digit << shift);
	      shift += VLQ_BASE_SHIFT;
	    } while (continuation);
	
	    return {
	      value: fromVLQSigned(result),
	      rest: aStr.slice(i)
	    };
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 60 */
/*!*************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/util.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  /**
	   * This is a helper function for getting values from parameter/options
	   * objects.
	   *
	   * @param args The object we are extracting values from
	   * @param name The name of the property we are getting.
	   * @param defaultValue An optional value to return if the property is missing
	   * from the object. If this is not specified and the property is missing, an
	   * error will be thrown.
	   */
	  function getArg(aArgs, aName, aDefaultValue) {
	    if (aName in aArgs) {
	      return aArgs[aName];
	    } else if (arguments.length === 3) {
	      return aDefaultValue;
	    } else {
	      throw new Error('"' + aName + '" is a required argument.');
	    }
	  }
	  exports.getArg = getArg;
	
	  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
	  var dataUrlRegexp = /^data:.+\,.+$/;
	
	  function urlParse(aUrl) {
	    var match = aUrl.match(urlRegexp);
	    if (!match) {
	      return null;
	    }
	    return {
	      scheme: match[1],
	      auth: match[2],
	      host: match[3],
	      port: match[4],
	      path: match[5]
	    };
	  }
	  exports.urlParse = urlParse;
	
	  function urlGenerate(aParsedUrl) {
	    var url = '';
	    if (aParsedUrl.scheme) {
	      url += aParsedUrl.scheme + ':';
	    }
	    url += '//';
	    if (aParsedUrl.auth) {
	      url += aParsedUrl.auth + '@';
	    }
	    if (aParsedUrl.host) {
	      url += aParsedUrl.host;
	    }
	    if (aParsedUrl.port) {
	      url += ":" + aParsedUrl.port
	    }
	    if (aParsedUrl.path) {
	      url += aParsedUrl.path;
	    }
	    return url;
	  }
	  exports.urlGenerate = urlGenerate;
	
	  /**
	   * Normalizes a path, or the path portion of a URL:
	   *
	   * - Replaces consequtive slashes with one slash.
	   * - Removes unnecessary '.' parts.
	   * - Removes unnecessary '<dir>/..' parts.
	   *
	   * Based on code in the Node.js 'path' core module.
	   *
	   * @param aPath The path or url to normalize.
	   */
	  function normalize(aPath) {
	    var path = aPath;
	    var url = urlParse(aPath);
	    if (url) {
	      if (!url.path) {
	        return aPath;
	      }
	      path = url.path;
	    }
	    var isAbsolute = (path.charAt(0) === '/');
	
	    var parts = path.split(/\/+/);
	    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
	      part = parts[i];
	      if (part === '.') {
	        parts.splice(i, 1);
	      } else if (part === '..') {
	        up++;
	      } else if (up > 0) {
	        if (part === '') {
	          // The first part is blank if the path is absolute. Trying to go
	          // above the root is a no-op. Therefore we can remove all '..' parts
	          // directly after the root.
	          parts.splice(i + 1, up);
	          up = 0;
	        } else {
	          parts.splice(i, 2);
	          up--;
	        }
	      }
	    }
	    path = parts.join('/');
	
	    if (path === '') {
	      path = isAbsolute ? '/' : '.';
	    }
	
	    if (url) {
	      url.path = path;
	      return urlGenerate(url);
	    }
	    return path;
	  }
	  exports.normalize = normalize;
	
	  /**
	   * Joins two paths/URLs.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be joined with the root.
	   *
	   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
	   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
	   *   first.
	   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
	   *   is updated with the result and aRoot is returned. Otherwise the result
	   *   is returned.
	   *   - If aPath is absolute, the result is aPath.
	   *   - Otherwise the two paths are joined with a slash.
	   * - Joining for example 'http://' and 'www.example.com' is also supported.
	   */
	  function join(aRoot, aPath) {
	    var aPathUrl = urlParse(aPath);
	    var aRootUrl = urlParse(aRoot);
	    if (aRootUrl) {
	      aRoot = aRootUrl.path || '/';
	    }
	
	    // `join(foo, '//www.example.org')`
	    if (aPathUrl && !aPathUrl.scheme) {
	      if (aRootUrl) {
	        aPathUrl.scheme = aRootUrl.scheme;
	      }
	      return urlGenerate(aPathUrl);
	    }
	
	    if (aPathUrl || aPath.match(dataUrlRegexp)) {
	      return aPath;
	    }
	
	    // `join('http://', 'www.example.com')`
	    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
	      aRootUrl.host = aPath;
	      return urlGenerate(aRootUrl);
	    }
	
	    var joined = aPath.charAt(0) === '/'
	      ? aPath
	      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);
	
	    if (aRootUrl) {
	      aRootUrl.path = joined;
	      return urlGenerate(aRootUrl);
	    }
	    return joined;
	  }
	  exports.join = join;
	
	  /**
	   * Because behavior goes wacky when you set `__proto__` on objects, we
	   * have to prefix all the strings in our set with an arbitrary character.
	   *
	   * See https://github.com/mozilla/source-map/pull/31 and
	   * https://github.com/mozilla/source-map/issues/30
	   *
	   * @param String aStr
	   */
	  function toSetString(aStr) {
	    return '$' + aStr;
	  }
	  exports.toSetString = toSetString;
	
	  function fromSetString(aStr) {
	    return aStr.substr(1);
	  }
	  exports.fromSetString = fromSetString;
	
	  function relative(aRoot, aPath) {
	    aRoot = aRoot.replace(/\/$/, '');
	
	    var url = urlParse(aRoot);
	    if (aPath.charAt(0) == "/" && url && url.path == "/") {
	      return aPath.slice(1);
	    }
	
	    return aPath.indexOf(aRoot + '/') === 0
	      ? aPath.substr(aRoot.length + 1)
	      : aPath;
	  }
	  exports.relative = relative;
	
	  function strcmp(aStr1, aStr2) {
	    var s1 = aStr1 || "";
	    var s2 = aStr2 || "";
	    return (s1 > s2) - (s1 < s2);
	  }
	
	  /**
	   * Comparator between two mappings where the original positions are compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same original source/line/column, but different generated
	   * line and column the same. Useful when searching for a mapping with a
	   * stubbed out mapping.
	   */
	  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
	    var cmp;
	
	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp || onlyCompareOriginal) {
	      return cmp;
	    }
	
	    cmp = strcmp(mappingA.name, mappingB.name);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    return mappingA.generatedColumn - mappingB.generatedColumn;
	  };
	  exports.compareByOriginalPositions = compareByOriginalPositions;
	
	  /**
	   * Comparator between two mappings where the generated positions are
	   * compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same generated line and column, but different
	   * source/name/original line and column the same. Useful when searching for a
	   * mapping with a stubbed out mapping.
	   */
	  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
	    var cmp;
	
	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	    if (cmp || onlyCompareGenerated) {
	      return cmp;
	    }
	
	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp) {
	      return cmp;
	    }
	
	    return strcmp(mappingA.name, mappingB.name);
	  };
	  exports.compareByGeneratedPositions = compareByGeneratedPositions;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 61 */
/*!******************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/array-set.js ***!
  \******************************************************************/
[105, 60],
/* 62 */
/*!**********************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/binary-search.js ***!
  \**********************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  /**
	   * Recursive implementation of binary search.
	   *
	   * @param aLow Indices here and lower do not contain the needle.
	   * @param aHigh Indices here and higher do not contain the needle.
	   * @param aNeedle The element being searched for.
	   * @param aHaystack The non-empty array being searched.
	   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
	   */
	  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
	    // This function terminates when one of the following is true:
	    //
	    //   1. We find the exact element we are looking for.
	    //
	    //   2. We did not find the exact element, but we can return the next
	    //      closest element that is less than that element.
	    //
	    //   3. We did not find the exact element, and there is no next-closest
	    //      element which is less than the one we are searching for, so we
	    //      return null.
	    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
	    var cmp = aCompare(aNeedle, aHaystack[mid], true);
	    if (cmp === 0) {
	      // Found the element we are looking for.
	      return aHaystack[mid];
	    }
	    else if (cmp > 0) {
	      // aHaystack[mid] is greater than our needle.
	      if (aHigh - mid > 1) {
	        // The element is in the upper half.
	        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
	      }
	      // We did not find an exact match, return the next closest one
	      // (termination case 2).
	      return aHaystack[mid];
	    }
	    else {
	      // aHaystack[mid] is less than our needle.
	      if (mid - aLow > 1) {
	        // The element is in the lower half.
	        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
	      }
	      // The exact needle element was not found in this haystack. Determine if
	      // we are in termination case (2) or (3) and return the appropriate thing.
	      return aLow < 0
	        ? null
	        : aHaystack[aLow];
	    }
	  }
	
	  /**
	   * This is an implementation of binary search which will always try and return
	   * the next lowest value checked if there is no exact hit. This is because
	   * mappings between original and generated line/col pairs are single points,
	   * and there is an implicit region between each of them, so a miss just means
	   * that you aren't on the very start of a region.
	   *
	   * @param aNeedle The element you are looking for.
	   * @param aHaystack The array that is being searched.
	   * @param aCompare A function which takes the needle and an element in the
	   *     array and returns -1, 0, or 1 depending on whether the needle is less
	   *     than, equal to, or greater than the element, respectively.
	   */
	  exports.search = function search(aNeedle, aHaystack, aCompare) {
	    return aHaystack.length > 0
	      ? recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
	      : null;
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 63 */
/*!*****************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/querystring-es3/decode.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};
	
	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }
	
	  var regexp = /\+/g;
	  qs = qs.split(sep);
	
	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }
	
	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }
	
	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;
	
	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }
	
	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);
	
	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }
	
	  return obj;
	};
	
	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};


/***/ },
/* 64 */
/*!*****************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/querystring-es3/encode.js ***!
  \*****************************************************************/
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;
	
	    case 'boolean':
	      return v ? 'true' : 'false';
	
	    case 'number':
	      return isFinite(v) ? v : '';
	
	    default:
	      return '';
	  }
	};
	
	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }
	
	  if (typeof obj === 'object') {
	    return map(objectKeys(obj), function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (isArray(obj[k])) {
	        return map(obj[k], function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);
	
	  }
	
	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};
	
	var isArray = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};
	
	function map (xs, f) {
	  if (xs.map) return xs.map(f);
	  var res = [];
	  for (var i = 0; i < xs.length; i++) {
	    res.push(f(xs[i], i));
	  }
	  return res;
	}
	
	var objectKeys = Object.keys || function (obj) {
	  var res = [];
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
	  }
	  return res;
	};


/***/ },
/* 65 */
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 66 */
/*!***************************************!*\
  !*** (webpack)/buildin/amd-define.js ***!
  \***************************************/
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 67 */
/*!***************************************************************!*\
  !*** ./~/deadunit-core/~/source-map/lib/source-map/base64.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var charToIntMap = {};
	  var intToCharMap = {};
	
	  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	    .split('')
	    .forEach(function (ch, index) {
	      charToIntMap[ch] = index;
	      intToCharMap[index] = ch;
	    });
	
	  /**
	   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
	   */
	  exports.encode = function base64_encode(aNumber) {
	    if (aNumber in intToCharMap) {
	      return intToCharMap[aNumber];
	    }
	    throw new TypeError("Must be between 0 and 63: " + aNumber);
	  };
	
	  /**
	   * Decode a single base 64 digit to an integer.
	   */
	  exports.decode = function base64_decode(aChar) {
	    if (aChar in charToIntMap) {
	      return charToIntMap[aChar];
	    }
	    throw new TypeError("Not a valid base 64 digit: " + aChar);
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 68 */
/*!******************************************************************************!*\
  !*** (webpack)/~/node-libs-browser/~/timers-browserify/~/process/browser.js ***!
  \******************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    draining = true;
	    var currentQueue;
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        var i = -1;
	        while (++i < len) {
	            currentQueue[i]();
	        }
	        len = queue.length;
	    }
	    draining = false;
	}
	process.nextTick = function (fun) {
	    queue.push(fun);
	    if (!draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 69 */
/*!*****************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/error-stack-parser/~/stackframe/stackframe.js ***!
  \*****************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	    'use strict';
	    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory();
	    } else {
	        root.StackFrame = factory();
	    }
	}(this, function () {
	    'use strict';
	    function _isNumber(n) {
	        return !isNaN(parseFloat(n)) && isFinite(n);
	    }
	
	    function StackFrame(functionName, args, fileName, lineNumber, columnNumber) {
	        if (functionName !== undefined) {
	            this.setFunctionName(functionName);
	        }
	        if (args !== undefined) {
	            this.setArgs(args);
	        }
	        if (fileName !== undefined) {
	            this.setFileName(fileName);
	        }
	        if (lineNumber !== undefined) {
	            this.setLineNumber(lineNumber);
	        }
	        if (columnNumber !== undefined) {
	            this.setColumnNumber(columnNumber);
	        }
	    }
	
	    StackFrame.prototype = {
	        getFunctionName: function () {
	            return this.functionName;
	        },
	        setFunctionName: function (v) {
	            this.functionName = String(v);
	        },
	
	        getArgs: function () {
	            return this.args;
	        },
	        setArgs: function (v) {
	            if (Object.prototype.toString.call(v) !== '[object Array]') {
	                throw new TypeError('Args must be an Array');
	            }
	            this.args = v;
	        },
	
	        // NOTE: Property name may be misleading as it includes the path,
	        // but it somewhat mirrors V8's JavaScriptStackTraceApi
	        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
	        // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
	        getFileName: function () {
	            return this.fileName;
	        },
	        setFileName: function (v) {
	            this.fileName = String(v);
	        },
	
	        getLineNumber: function () {
	            return this.lineNumber;
	        },
	        setLineNumber: function (v) {
	            if (!_isNumber(v)) {
	                throw new TypeError('Line Number must be a Number');
	            }
	            this.lineNumber = Number(v);
	        },
	
	        getColumnNumber: function () {
	            return this.columnNumber;
	        },
	        setColumnNumber: function (v) {
	            if (!_isNumber(v)) {
	                throw new TypeError('Column Number must be a Number');
	            }
	            this.columnNumber = Number(v);
	        },
	
	        toString: function() {
	            var functionName = this.getFunctionName() || '{anonymous}';
	            var args = '(' + (this.getArgs() || []).join(',') + ')';
	            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
	            var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
	            var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
	            return functionName + args + fileName + lineNumber + columnNumber;
	        }
	    };
	
	    return StackFrame;
	}));


/***/ },
/* 70 */
/*!**************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stack-generator/~/stackframe/stackframe.js ***!
  \**************************************************************************************/
69,
/* 71 */
/*!*****************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map.js ***!
  \*****************************************************************************************/
[104, 74, 75, 76],
/* 72 */
/*!*************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/stackframe/stackframe.js ***!
  \*************************************************************************************/
69,
/* 73 */
/*!********************************************************************************!*\
  !*** ./~/deadunit-core/~/ajax/~/async-future/~/trimArguments/trimArguments.js ***!
  \********************************************************************************/
25,
/* 74 */
/*!**************************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/source-map-generator.js ***!
  \**************************************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var base64VLQ = __webpack_require__(/*! ./base64-vlq */ 77);
	  var util = __webpack_require__(/*! ./util */ 78);
	  var ArraySet = __webpack_require__(/*! ./array-set */ 79).ArraySet;
	  var MappingList = __webpack_require__(/*! ./mapping-list */ 80).MappingList;
	
	  /**
	   * An instance of the SourceMapGenerator represents a source map which is
	   * being built incrementally. You may pass an object with the following
	   * properties:
	   *
	   *   - file: The filename of the generated source.
	   *   - sourceRoot: A root for all relative URLs in this source map.
	   */
	  function SourceMapGenerator(aArgs) {
	    if (!aArgs) {
	      aArgs = {};
	    }
	    this._file = util.getArg(aArgs, 'file', null);
	    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
	    this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
	    this._sources = new ArraySet();
	    this._names = new ArraySet();
	    this._mappings = new MappingList();
	    this._sourcesContents = null;
	  }
	
	  SourceMapGenerator.prototype._version = 3;
	
	  /**
	   * Creates a new SourceMapGenerator based on a SourceMapConsumer
	   *
	   * @param aSourceMapConsumer The SourceMap.
	   */
	  SourceMapGenerator.fromSourceMap =
	    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
	      var sourceRoot = aSourceMapConsumer.sourceRoot;
	      var generator = new SourceMapGenerator({
	        file: aSourceMapConsumer.file,
	        sourceRoot: sourceRoot
	      });
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        var newMapping = {
	          generated: {
	            line: mapping.generatedLine,
	            column: mapping.generatedColumn
	          }
	        };
	
	        if (mapping.source != null) {
	          newMapping.source = mapping.source;
	          if (sourceRoot != null) {
	            newMapping.source = util.relative(sourceRoot, newMapping.source);
	          }
	
	          newMapping.original = {
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          };
	
	          if (mapping.name != null) {
	            newMapping.name = mapping.name;
	          }
	        }
	
	        generator.addMapping(newMapping);
	      });
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          generator.setSourceContent(sourceFile, content);
	        }
	      });
	      return generator;
	    };
	
	  /**
	   * Add a single mapping from original source line and column to the generated
	   * source's line and column for this source map being created. The mapping
	   * object should have the following properties:
	   *
	   *   - generated: An object with the generated line and column positions.
	   *   - original: An object with the original line and column positions.
	   *   - source: The original source file (relative to the sourceRoot).
	   *   - name: An optional original token name for this mapping.
	   */
	  SourceMapGenerator.prototype.addMapping =
	    function SourceMapGenerator_addMapping(aArgs) {
	      var generated = util.getArg(aArgs, 'generated');
	      var original = util.getArg(aArgs, 'original', null);
	      var source = util.getArg(aArgs, 'source', null);
	      var name = util.getArg(aArgs, 'name', null);
	
	      if (!this._skipValidation) {
	        this._validateMapping(generated, original, source, name);
	      }
	
	      if (source != null && !this._sources.has(source)) {
	        this._sources.add(source);
	      }
	
	      if (name != null && !this._names.has(name)) {
	        this._names.add(name);
	      }
	
	      this._mappings.add({
	        generatedLine: generated.line,
	        generatedColumn: generated.column,
	        originalLine: original != null && original.line,
	        originalColumn: original != null && original.column,
	        source: source,
	        name: name
	      });
	    };
	
	  /**
	   * Set the source content for a source file.
	   */
	  SourceMapGenerator.prototype.setSourceContent =
	    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
	      var source = aSourceFile;
	      if (this._sourceRoot != null) {
	        source = util.relative(this._sourceRoot, source);
	      }
	
	      if (aSourceContent != null) {
	        // Add the source content to the _sourcesContents map.
	        // Create a new _sourcesContents map if the property is null.
	        if (!this._sourcesContents) {
	          this._sourcesContents = {};
	        }
	        this._sourcesContents[util.toSetString(source)] = aSourceContent;
	      } else if (this._sourcesContents) {
	        // Remove the source file from the _sourcesContents map.
	        // If the _sourcesContents map is empty, set the property to null.
	        delete this._sourcesContents[util.toSetString(source)];
	        if (Object.keys(this._sourcesContents).length === 0) {
	          this._sourcesContents = null;
	        }
	      }
	    };
	
	  /**
	   * Applies the mappings of a sub-source-map for a specific source file to the
	   * source map being generated. Each mapping to the supplied source file is
	   * rewritten using the supplied source map. Note: The resolution for the
	   * resulting mappings is the minimium of this map and the supplied map.
	   *
	   * @param aSourceMapConsumer The source map to be applied.
	   * @param aSourceFile Optional. The filename of the source file.
	   *        If omitted, SourceMapConsumer's file property will be used.
	   * @param aSourceMapPath Optional. The dirname of the path to the source map
	   *        to be applied. If relative, it is relative to the SourceMapConsumer.
	   *        This parameter is needed when the two source maps aren't in the same
	   *        directory, and the source map to be applied contains relative source
	   *        paths. If so, those relative source paths need to be rewritten
	   *        relative to the SourceMapGenerator.
	   */
	  SourceMapGenerator.prototype.applySourceMap =
	    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
	      var sourceFile = aSourceFile;
	      // If aSourceFile is omitted, we will use the file property of the SourceMap
	      if (aSourceFile == null) {
	        if (aSourceMapConsumer.file == null) {
	          throw new Error(
	            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
	            'or the source map\'s "file" property. Both were omitted.'
	          );
	        }
	        sourceFile = aSourceMapConsumer.file;
	      }
	      var sourceRoot = this._sourceRoot;
	      // Make "sourceFile" relative if an absolute Url is passed.
	      if (sourceRoot != null) {
	        sourceFile = util.relative(sourceRoot, sourceFile);
	      }
	      // Applying the SourceMap can add and remove items from the sources and
	      // the names array.
	      var newSources = new ArraySet();
	      var newNames = new ArraySet();
	
	      // Find mappings for the "sourceFile"
	      this._mappings.unsortedForEach(function (mapping) {
	        if (mapping.source === sourceFile && mapping.originalLine != null) {
	          // Check if it can be mapped by the source map, then update the mapping.
	          var original = aSourceMapConsumer.originalPositionFor({
	            line: mapping.originalLine,
	            column: mapping.originalColumn
	          });
	          if (original.source != null) {
	            // Copy mapping
	            mapping.source = original.source;
	            if (aSourceMapPath != null) {
	              mapping.source = util.join(aSourceMapPath, mapping.source)
	            }
	            if (sourceRoot != null) {
	              mapping.source = util.relative(sourceRoot, mapping.source);
	            }
	            mapping.originalLine = original.line;
	            mapping.originalColumn = original.column;
	            if (original.name != null) {
	              mapping.name = original.name;
	            }
	          }
	        }
	
	        var source = mapping.source;
	        if (source != null && !newSources.has(source)) {
	          newSources.add(source);
	        }
	
	        var name = mapping.name;
	        if (name != null && !newNames.has(name)) {
	          newNames.add(name);
	        }
	
	      }, this);
	      this._sources = newSources;
	      this._names = newNames;
	
	      // Copy sourcesContents of applied map.
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          if (aSourceMapPath != null) {
	            sourceFile = util.join(aSourceMapPath, sourceFile);
	          }
	          if (sourceRoot != null) {
	            sourceFile = util.relative(sourceRoot, sourceFile);
	          }
	          this.setSourceContent(sourceFile, content);
	        }
	      }, this);
	    };
	
	  /**
	   * A mapping can have one of the three levels of data:
	   *
	   *   1. Just the generated position.
	   *   2. The Generated position, original position, and original source.
	   *   3. Generated and original position, original source, as well as a name
	   *      token.
	   *
	   * To maintain consistency, we validate that any new mapping being added falls
	   * in to one of these categories.
	   */
	  SourceMapGenerator.prototype._validateMapping =
	    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
	                                                aName) {
	      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	          && aGenerated.line > 0 && aGenerated.column >= 0
	          && !aOriginal && !aSource && !aName) {
	        // Case 1.
	        return;
	      }
	      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
	               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
	               && aGenerated.line > 0 && aGenerated.column >= 0
	               && aOriginal.line > 0 && aOriginal.column >= 0
	               && aSource) {
	        // Cases 2 and 3.
	        return;
	      }
	      else {
	        throw new Error('Invalid mapping: ' + JSON.stringify({
	          generated: aGenerated,
	          source: aSource,
	          original: aOriginal,
	          name: aName
	        }));
	      }
	    };
	
	  /**
	   * Serialize the accumulated mappings in to the stream of base 64 VLQs
	   * specified by the source map format.
	   */
	  SourceMapGenerator.prototype._serializeMappings =
	    function SourceMapGenerator_serializeMappings() {
	      var previousGeneratedColumn = 0;
	      var previousGeneratedLine = 1;
	      var previousOriginalColumn = 0;
	      var previousOriginalLine = 0;
	      var previousName = 0;
	      var previousSource = 0;
	      var result = '';
	      var mapping;
	
	      var mappings = this._mappings.toArray();
	
	      for (var i = 0, len = mappings.length; i < len; i++) {
	        mapping = mappings[i];
	
	        if (mapping.generatedLine !== previousGeneratedLine) {
	          previousGeneratedColumn = 0;
	          while (mapping.generatedLine !== previousGeneratedLine) {
	            result += ';';
	            previousGeneratedLine++;
	          }
	        }
	        else {
	          if (i > 0) {
	            if (!util.compareByGeneratedPositions(mapping, mappings[i - 1])) {
	              continue;
	            }
	            result += ',';
	          }
	        }
	
	        result += base64VLQ.encode(mapping.generatedColumn
	                                   - previousGeneratedColumn);
	        previousGeneratedColumn = mapping.generatedColumn;
	
	        if (mapping.source != null) {
	          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
	                                     - previousSource);
	          previousSource = this._sources.indexOf(mapping.source);
	
	          // lines are stored 0-based in SourceMap spec version 3
	          result += base64VLQ.encode(mapping.originalLine - 1
	                                     - previousOriginalLine);
	          previousOriginalLine = mapping.originalLine - 1;
	
	          result += base64VLQ.encode(mapping.originalColumn
	                                     - previousOriginalColumn);
	          previousOriginalColumn = mapping.originalColumn;
	
	          if (mapping.name != null) {
	            result += base64VLQ.encode(this._names.indexOf(mapping.name)
	                                       - previousName);
	            previousName = this._names.indexOf(mapping.name);
	          }
	        }
	      }
	
	      return result;
	    };
	
	  SourceMapGenerator.prototype._generateSourcesContent =
	    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
	      return aSources.map(function (source) {
	        if (!this._sourcesContents) {
	          return null;
	        }
	        if (aSourceRoot != null) {
	          source = util.relative(aSourceRoot, source);
	        }
	        var key = util.toSetString(source);
	        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
	                                                    key)
	          ? this._sourcesContents[key]
	          : null;
	      }, this);
	    };
	
	  /**
	   * Externalize the source map.
	   */
	  SourceMapGenerator.prototype.toJSON =
	    function SourceMapGenerator_toJSON() {
	      var map = {
	        version: this._version,
	        sources: this._sources.toArray(),
	        names: this._names.toArray(),
	        mappings: this._serializeMappings()
	      };
	      if (this._file != null) {
	        map.file = this._file;
	      }
	      if (this._sourceRoot != null) {
	        map.sourceRoot = this._sourceRoot;
	      }
	      if (this._sourcesContents) {
	        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
	      }
	
	      return map;
	    };
	
	  /**
	   * Render the source map being generated to a string.
	   */
	  SourceMapGenerator.prototype.toString =
	    function SourceMapGenerator_toString() {
	      return JSON.stringify(this);
	    };
	
	  exports.SourceMapGenerator = SourceMapGenerator;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 75 */
/*!*************************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/source-map-consumer.js ***!
  \*************************************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(/*! ./util */ 78);
	  var binarySearch = __webpack_require__(/*! ./binary-search */ 81);
	  var ArraySet = __webpack_require__(/*! ./array-set */ 79).ArraySet;
	  var base64VLQ = __webpack_require__(/*! ./base64-vlq */ 77);
	
	  /**
	   * A SourceMapConsumer instance represents a parsed source map which we can
	   * query for information about the original file positions by giving it a file
	   * position in the generated source.
	   *
	   * The only parameter is the raw source map (either as a JSON string, or
	   * already parsed to an object). According to the spec, source maps have the
	   * following attributes:
	   *
	   *   - version: Which version of the source map spec this map is following.
	   *   - sources: An array of URLs to the original source files.
	   *   - names: An array of identifiers which can be referrenced by individual mappings.
	   *   - sourceRoot: Optional. The URL root from which all sources are relative.
	   *   - sourcesContent: Optional. An array of contents of the original source files.
	   *   - mappings: A string of base64 VLQs which contain the actual mappings.
	   *   - file: Optional. The generated file this source map is associated with.
	   *
	   * Here is an example source map, taken from the source map spec[0]:
	   *
	   *     {
	   *       version : 3,
	   *       file: "out.js",
	   *       sourceRoot : "",
	   *       sources: ["foo.js", "bar.js"],
	   *       names: ["src", "maps", "are", "fun"],
	   *       mappings: "AA,AB;;ABCDE;"
	   *     }
	   *
	   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
	   */
	  function SourceMapConsumer(aSourceMap) {
	    var sourceMap = aSourceMap;
	    if (typeof aSourceMap === 'string') {
	      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
	    }
	
	    var version = util.getArg(sourceMap, 'version');
	    var sources = util.getArg(sourceMap, 'sources');
	    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
	    // requires the array) to play nice here.
	    var names = util.getArg(sourceMap, 'names', []);
	    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
	    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
	    var mappings = util.getArg(sourceMap, 'mappings');
	    var file = util.getArg(sourceMap, 'file', null);
	
	    // Once again, Sass deviates from the spec and supplies the version as a
	    // string rather than a number, so we use loose equality checking here.
	    if (version != this._version) {
	      throw new Error('Unsupported version: ' + version);
	    }
	
	    // Some source maps produce relative source paths like "./foo.js" instead of
	    // "foo.js".  Normalize these first so that future comparisons will succeed.
	    // See bugzil.la/1090768.
	    sources = sources.map(util.normalize);
	
	    // Pass `true` below to allow duplicate names and sources. While source maps
	    // are intended to be compressed and deduplicated, the TypeScript compiler
	    // sometimes generates source maps with duplicates in them. See Github issue
	    // #72 and bugzil.la/889492.
	    this._names = ArraySet.fromArray(names, true);
	    this._sources = ArraySet.fromArray(sources, true);
	
	    this.sourceRoot = sourceRoot;
	    this.sourcesContent = sourcesContent;
	    this._mappings = mappings;
	    this.file = file;
	  }
	
	  /**
	   * Create a SourceMapConsumer from a SourceMapGenerator.
	   *
	   * @param SourceMapGenerator aSourceMap
	   *        The source map that will be consumed.
	   * @returns SourceMapConsumer
	   */
	  SourceMapConsumer.fromSourceMap =
	    function SourceMapConsumer_fromSourceMap(aSourceMap) {
	      var smc = Object.create(SourceMapConsumer.prototype);
	
	      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
	      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
	      smc.sourceRoot = aSourceMap._sourceRoot;
	      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
	                                                              smc.sourceRoot);
	      smc.file = aSourceMap._file;
	
	      smc.__generatedMappings = aSourceMap._mappings.toArray().slice();
	      smc.__originalMappings = aSourceMap._mappings.toArray().slice()
	        .sort(util.compareByOriginalPositions);
	
	      return smc;
	    };
	
	  /**
	   * The version of the source mapping spec that we are consuming.
	   */
	  SourceMapConsumer.prototype._version = 3;
	
	  /**
	   * The list of original sources.
	   */
	  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
	    get: function () {
	      return this._sources.toArray().map(function (s) {
	        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
	      }, this);
	    }
	  });
	
	  // `__generatedMappings` and `__originalMappings` are arrays that hold the
	  // parsed mapping coordinates from the source map's "mappings" attribute. They
	  // are lazily instantiated, accessed via the `_generatedMappings` and
	  // `_originalMappings` getters respectively, and we only parse the mappings
	  // and create these arrays once queried for a source location. We jump through
	  // these hoops because there can be many thousands of mappings, and parsing
	  // them is expensive, so we only want to do it if we must.
	  //
	  // Each object in the arrays is of the form:
	  //
	  //     {
	  //       generatedLine: The line number in the generated code,
	  //       generatedColumn: The column number in the generated code,
	  //       source: The path to the original source file that generated this
	  //               chunk of code,
	  //       originalLine: The line number in the original source that
	  //                     corresponds to this chunk of generated code,
	  //       originalColumn: The column number in the original source that
	  //                       corresponds to this chunk of generated code,
	  //       name: The name of the original symbol which generated this chunk of
	  //             code.
	  //     }
	  //
	  // All properties except for `generatedLine` and `generatedColumn` can be
	  // `null`.
	  //
	  // `_generatedMappings` is ordered by the generated positions.
	  //
	  // `_originalMappings` is ordered by the original positions.
	
	  SourceMapConsumer.prototype.__generatedMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
	    get: function () {
	      if (!this.__generatedMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }
	
	      return this.__generatedMappings;
	    }
	  });
	
	  SourceMapConsumer.prototype.__originalMappings = null;
	  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
	    get: function () {
	      if (!this.__originalMappings) {
	        this.__generatedMappings = [];
	        this.__originalMappings = [];
	        this._parseMappings(this._mappings, this.sourceRoot);
	      }
	
	      return this.__originalMappings;
	    }
	  });
	
	  SourceMapConsumer.prototype._nextCharIsMappingSeparator =
	    function SourceMapConsumer_nextCharIsMappingSeparator(aStr) {
	      var c = aStr.charAt(0);
	      return c === ";" || c === ",";
	    };
	
	  /**
	   * Parse the mappings in a string in to a data structure which we can easily
	   * query (the ordered arrays in the `this.__generatedMappings` and
	   * `this.__originalMappings` properties).
	   */
	  SourceMapConsumer.prototype._parseMappings =
	    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
	      var generatedLine = 1;
	      var previousGeneratedColumn = 0;
	      var previousOriginalLine = 0;
	      var previousOriginalColumn = 0;
	      var previousSource = 0;
	      var previousName = 0;
	      var str = aStr;
	      var temp = {};
	      var mapping;
	
	      while (str.length > 0) {
	        if (str.charAt(0) === ';') {
	          generatedLine++;
	          str = str.slice(1);
	          previousGeneratedColumn = 0;
	        }
	        else if (str.charAt(0) === ',') {
	          str = str.slice(1);
	        }
	        else {
	          mapping = {};
	          mapping.generatedLine = generatedLine;
	
	          // Generated column.
	          base64VLQ.decode(str, temp);
	          mapping.generatedColumn = previousGeneratedColumn + temp.value;
	          previousGeneratedColumn = mapping.generatedColumn;
	          str = temp.rest;
	
	          if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
	            // Original source.
	            base64VLQ.decode(str, temp);
	            mapping.source = this._sources.at(previousSource + temp.value);
	            previousSource += temp.value;
	            str = temp.rest;
	            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
	              throw new Error('Found a source, but no line and column');
	            }
	
	            // Original line.
	            base64VLQ.decode(str, temp);
	            mapping.originalLine = previousOriginalLine + temp.value;
	            previousOriginalLine = mapping.originalLine;
	            // Lines are stored 0-based
	            mapping.originalLine += 1;
	            str = temp.rest;
	            if (str.length === 0 || this._nextCharIsMappingSeparator(str)) {
	              throw new Error('Found a source and line, but no column');
	            }
	
	            // Original column.
	            base64VLQ.decode(str, temp);
	            mapping.originalColumn = previousOriginalColumn + temp.value;
	            previousOriginalColumn = mapping.originalColumn;
	            str = temp.rest;
	
	            if (str.length > 0 && !this._nextCharIsMappingSeparator(str)) {
	              // Original name.
	              base64VLQ.decode(str, temp);
	              mapping.name = this._names.at(previousName + temp.value);
	              previousName += temp.value;
	              str = temp.rest;
	            }
	          }
	
	          this.__generatedMappings.push(mapping);
	          if (typeof mapping.originalLine === 'number') {
	            this.__originalMappings.push(mapping);
	          }
	        }
	      }
	
	      this.__generatedMappings.sort(util.compareByGeneratedPositions);
	      this.__originalMappings.sort(util.compareByOriginalPositions);
	    };
	
	  /**
	   * Find the mapping that best matches the hypothetical "needle" mapping that
	   * we are searching for in the given "haystack" of mappings.
	   */
	  SourceMapConsumer.prototype._findMapping =
	    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
	                                           aColumnName, aComparator) {
	      // To return the position we are searching for, we must first find the
	      // mapping for the given position and then return the opposite position it
	      // points to. Because the mappings are sorted, we can use binary search to
	      // find the best mapping.
	
	      if (aNeedle[aLineName] <= 0) {
	        throw new TypeError('Line must be greater than or equal to 1, got '
	                            + aNeedle[aLineName]);
	      }
	      if (aNeedle[aColumnName] < 0) {
	        throw new TypeError('Column must be greater than or equal to 0, got '
	                            + aNeedle[aColumnName]);
	      }
	
	      return binarySearch.search(aNeedle, aMappings, aComparator);
	    };
	
	  /**
	   * Compute the last column for each generated mapping. The last column is
	   * inclusive.
	   */
	  SourceMapConsumer.prototype.computeColumnSpans =
	    function SourceMapConsumer_computeColumnSpans() {
	      for (var index = 0; index < this._generatedMappings.length; ++index) {
	        var mapping = this._generatedMappings[index];
	
	        // Mappings do not contain a field for the last generated columnt. We
	        // can come up with an optimistic estimate, however, by assuming that
	        // mappings are contiguous (i.e. given two consecutive mappings, the
	        // first mapping ends where the second one starts).
	        if (index + 1 < this._generatedMappings.length) {
	          var nextMapping = this._generatedMappings[index + 1];
	
	          if (mapping.generatedLine === nextMapping.generatedLine) {
	            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
	            continue;
	          }
	        }
	
	        // The last mapping for each line spans the entire line.
	        mapping.lastGeneratedColumn = Infinity;
	      }
	    };
	
	  /**
	   * Returns the original source, line, and column information for the generated
	   * source's line and column positions provided. The only argument is an object
	   * with the following properties:
	   *
	   *   - line: The line number in the generated source.
	   *   - column: The column number in the generated source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - source: The original source file, or null.
	   *   - line: The line number in the original source, or null.
	   *   - column: The column number in the original source, or null.
	   *   - name: The original identifier, or null.
	   */
	  SourceMapConsumer.prototype.originalPositionFor =
	    function SourceMapConsumer_originalPositionFor(aArgs) {
	      var needle = {
	        generatedLine: util.getArg(aArgs, 'line'),
	        generatedColumn: util.getArg(aArgs, 'column')
	      };
	
	      var index = this._findMapping(needle,
	                                    this._generatedMappings,
	                                    "generatedLine",
	                                    "generatedColumn",
	                                    util.compareByGeneratedPositions);
	
	      if (index >= 0) {
	        var mapping = this._generatedMappings[index];
	
	        if (mapping.generatedLine === needle.generatedLine) {
	          var source = util.getArg(mapping, 'source', null);
	          if (source != null && this.sourceRoot != null) {
	            source = util.join(this.sourceRoot, source);
	          }
	          return {
	            source: source,
	            line: util.getArg(mapping, 'originalLine', null),
	            column: util.getArg(mapping, 'originalColumn', null),
	            name: util.getArg(mapping, 'name', null)
	          };
	        }
	      }
	
	      return {
	        source: null,
	        line: null,
	        column: null,
	        name: null
	      };
	    };
	
	  /**
	   * Returns the original source content. The only argument is the url of the
	   * original source file. Returns null if no original source content is
	   * availible.
	   */
	  SourceMapConsumer.prototype.sourceContentFor =
	    function SourceMapConsumer_sourceContentFor(aSource) {
	      if (!this.sourcesContent) {
	        return null;
	      }
	
	      if (this.sourceRoot != null) {
	        aSource = util.relative(this.sourceRoot, aSource);
	      }
	
	      if (this._sources.has(aSource)) {
	        return this.sourcesContent[this._sources.indexOf(aSource)];
	      }
	
	      var url;
	      if (this.sourceRoot != null
	          && (url = util.urlParse(this.sourceRoot))) {
	        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
	        // many users. We can help them out when they expect file:// URIs to
	        // behave like it would if they were running a local HTTP server. See
	        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
	        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
	        if (url.scheme == "file"
	            && this._sources.has(fileUriAbsPath)) {
	          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
	        }
	
	        if ((!url.path || url.path == "/")
	            && this._sources.has("/" + aSource)) {
	          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
	        }
	      }
	
	      throw new Error('"' + aSource + '" is not in the SourceMap.');
	    };
	
	  /**
	   * Returns the generated line and column information for the original source,
	   * line, and column positions provided. The only argument is an object with
	   * the following properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *   - column: The column number in the original source.
	   *
	   * and an object is returned with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.generatedPositionFor =
	    function SourceMapConsumer_generatedPositionFor(aArgs) {
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: util.getArg(aArgs, 'column')
	      };
	
	      if (this.sourceRoot != null) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }
	
	      var index = this._findMapping(needle,
	                                    this._originalMappings,
	                                    "originalLine",
	                                    "originalColumn",
	                                    util.compareByOriginalPositions);
	
	      if (index >= 0) {
	        var mapping = this._originalMappings[index];
	
	        return {
	          line: util.getArg(mapping, 'generatedLine', null),
	          column: util.getArg(mapping, 'generatedColumn', null),
	          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
	        };
	      }
	
	      return {
	        line: null,
	        column: null,
	        lastColumn: null
	      };
	    };
	
	  /**
	   * Returns all generated line and column information for the original source
	   * and line provided. The only argument is an object with the following
	   * properties:
	   *
	   *   - source: The filename of the original source.
	   *   - line: The line number in the original source.
	   *
	   * and an array of objects is returned, each with the following properties:
	   *
	   *   - line: The line number in the generated source, or null.
	   *   - column: The column number in the generated source, or null.
	   */
	  SourceMapConsumer.prototype.allGeneratedPositionsFor =
	    function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
	      // When there is no exact match, SourceMapConsumer.prototype._findMapping
	      // returns the index of the closest mapping less than the needle. By
	      // setting needle.originalColumn to Infinity, we thus find the last
	      // mapping for the given line, provided such a mapping exists.
	      var needle = {
	        source: util.getArg(aArgs, 'source'),
	        originalLine: util.getArg(aArgs, 'line'),
	        originalColumn: Infinity
	      };
	
	      if (this.sourceRoot != null) {
	        needle.source = util.relative(this.sourceRoot, needle.source);
	      }
	
	      var mappings = [];
	
	      var index = this._findMapping(needle,
	                                    this._originalMappings,
	                                    "originalLine",
	                                    "originalColumn",
	                                    util.compareByOriginalPositions);
	      if (index >= 0) {
	        var mapping = this._originalMappings[index];
	
	        while (mapping && mapping.originalLine === needle.originalLine) {
	          mappings.push({
	            line: util.getArg(mapping, 'generatedLine', null),
	            column: util.getArg(mapping, 'generatedColumn', null),
	            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
	          });
	
	          mapping = this._originalMappings[--index];
	        }
	      }
	
	      return mappings.reverse();
	    };
	
	  SourceMapConsumer.GENERATED_ORDER = 1;
	  SourceMapConsumer.ORIGINAL_ORDER = 2;
	
	  /**
	   * Iterate over each mapping between an original source/line/column and a
	   * generated line/column in this source map.
	   *
	   * @param Function aCallback
	   *        The function that is called with each mapping.
	   * @param Object aContext
	   *        Optional. If specified, this object will be the value of `this` every
	   *        time that `aCallback` is called.
	   * @param aOrder
	   *        Either `SourceMapConsumer.GENERATED_ORDER` or
	   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
	   *        iterate over the mappings sorted by the generated file's line/column
	   *        order or the original's source/line/column order, respectively. Defaults to
	   *        `SourceMapConsumer.GENERATED_ORDER`.
	   */
	  SourceMapConsumer.prototype.eachMapping =
	    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
	      var context = aContext || null;
	      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
	
	      var mappings;
	      switch (order) {
	      case SourceMapConsumer.GENERATED_ORDER:
	        mappings = this._generatedMappings;
	        break;
	      case SourceMapConsumer.ORIGINAL_ORDER:
	        mappings = this._originalMappings;
	        break;
	      default:
	        throw new Error("Unknown order of iteration.");
	      }
	
	      var sourceRoot = this.sourceRoot;
	      mappings.map(function (mapping) {
	        var source = mapping.source;
	        if (source != null && sourceRoot != null) {
	          source = util.join(sourceRoot, source);
	        }
	        return {
	          source: source,
	          generatedLine: mapping.generatedLine,
	          generatedColumn: mapping.generatedColumn,
	          originalLine: mapping.originalLine,
	          originalColumn: mapping.originalColumn,
	          name: mapping.name
	        };
	      }).forEach(aCallback, context);
	    };
	
	  exports.SourceMapConsumer = SourceMapConsumer;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 76 */
/*!*****************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/source-node.js ***!
  \*****************************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var SourceMapGenerator = __webpack_require__(/*! ./source-map-generator */ 74).SourceMapGenerator;
	  var util = __webpack_require__(/*! ./util */ 78);
	
	  // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
	  // operating systems these days (capturing the result).
	  var REGEX_NEWLINE = /(\r?\n)/;
	
	  // Newline character code for charCodeAt() comparisons
	  var NEWLINE_CODE = 10;
	
	  // Private symbol for identifying `SourceNode`s when multiple versions of
	  // the source-map library are loaded. This MUST NOT CHANGE across
	  // versions!
	  var isSourceNode = "$$$isSourceNode$$$";
	
	  /**
	   * SourceNodes provide a way to abstract over interpolating/concatenating
	   * snippets of generated JavaScript source code while maintaining the line and
	   * column information associated with the original source code.
	   *
	   * @param aLine The original line number.
	   * @param aColumn The original column number.
	   * @param aSource The original source's filename.
	   * @param aChunks Optional. An array of strings which are snippets of
	   *        generated JS, or other SourceNodes.
	   * @param aName The original identifier.
	   */
	  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
	    this.children = [];
	    this.sourceContents = {};
	    this.line = aLine == null ? null : aLine;
	    this.column = aColumn == null ? null : aColumn;
	    this.source = aSource == null ? null : aSource;
	    this.name = aName == null ? null : aName;
	    this[isSourceNode] = true;
	    if (aChunks != null) this.add(aChunks);
	  }
	
	  /**
	   * Creates a SourceNode from generated code and a SourceMapConsumer.
	   *
	   * @param aGeneratedCode The generated code
	   * @param aSourceMapConsumer The SourceMap for the generated code
	   * @param aRelativePath Optional. The path that relative sources in the
	   *        SourceMapConsumer should be relative to.
	   */
	  SourceNode.fromStringWithSourceMap =
	    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
	      // The SourceNode we want to fill with the generated code
	      // and the SourceMap
	      var node = new SourceNode();
	
	      // All even indices of this array are one line of the generated code,
	      // while all odd indices are the newlines between two adjacent lines
	      // (since `REGEX_NEWLINE` captures its match).
	      // Processed fragments are removed from this array, by calling `shiftNextLine`.
	      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
	      var shiftNextLine = function() {
	        var lineContents = remainingLines.shift();
	        // The last line of a file might not have a newline.
	        var newLine = remainingLines.shift() || "";
	        return lineContents + newLine;
	      };
	
	      // We need to remember the position of "remainingLines"
	      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
	
	      // The generate SourceNodes we need a code range.
	      // To extract it current and last mapping is used.
	      // Here we store the last mapping.
	      var lastMapping = null;
	
	      aSourceMapConsumer.eachMapping(function (mapping) {
	        if (lastMapping !== null) {
	          // We add the code from "lastMapping" to "mapping":
	          // First check if there is a new line in between.
	          if (lastGeneratedLine < mapping.generatedLine) {
	            var code = "";
	            // Associate first line with "lastMapping"
	            addMappingWithCode(lastMapping, shiftNextLine());
	            lastGeneratedLine++;
	            lastGeneratedColumn = 0;
	            // The remaining code is added without mapping
	          } else {
	            // There is no new line in between.
	            // Associate the code between "lastGeneratedColumn" and
	            // "mapping.generatedColumn" with "lastMapping"
	            var nextLine = remainingLines[0];
	            var code = nextLine.substr(0, mapping.generatedColumn -
	                                          lastGeneratedColumn);
	            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
	                                                lastGeneratedColumn);
	            lastGeneratedColumn = mapping.generatedColumn;
	            addMappingWithCode(lastMapping, code);
	            // No more remaining code, continue
	            lastMapping = mapping;
	            return;
	          }
	        }
	        // We add the generated code until the first mapping
	        // to the SourceNode without any mapping.
	        // Each line is added as separate string.
	        while (lastGeneratedLine < mapping.generatedLine) {
	          node.add(shiftNextLine());
	          lastGeneratedLine++;
	        }
	        if (lastGeneratedColumn < mapping.generatedColumn) {
	          var nextLine = remainingLines[0];
	          node.add(nextLine.substr(0, mapping.generatedColumn));
	          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
	          lastGeneratedColumn = mapping.generatedColumn;
	        }
	        lastMapping = mapping;
	      }, this);
	      // We have processed all mappings.
	      if (remainingLines.length > 0) {
	        if (lastMapping) {
	          // Associate the remaining code in the current line with "lastMapping"
	          addMappingWithCode(lastMapping, shiftNextLine());
	        }
	        // and add the remaining lines without any mapping
	        node.add(remainingLines.join(""));
	      }
	
	      // Copy sourcesContent into SourceNode
	      aSourceMapConsumer.sources.forEach(function (sourceFile) {
	        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
	        if (content != null) {
	          if (aRelativePath != null) {
	            sourceFile = util.join(aRelativePath, sourceFile);
	          }
	          node.setSourceContent(sourceFile, content);
	        }
	      });
	
	      return node;
	
	      function addMappingWithCode(mapping, code) {
	        if (mapping === null || mapping.source === undefined) {
	          node.add(code);
	        } else {
	          var source = aRelativePath
	            ? util.join(aRelativePath, mapping.source)
	            : mapping.source;
	          node.add(new SourceNode(mapping.originalLine,
	                                  mapping.originalColumn,
	                                  source,
	                                  code,
	                                  mapping.name));
	        }
	      }
	    };
	
	  /**
	   * Add a chunk of generated JS to this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.add = function SourceNode_add(aChunk) {
	    if (Array.isArray(aChunk)) {
	      aChunk.forEach(function (chunk) {
	        this.add(chunk);
	      }, this);
	    }
	    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      if (aChunk) {
	        this.children.push(aChunk);
	      }
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };
	
	  /**
	   * Add a chunk of generated JS to the beginning of this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
	    if (Array.isArray(aChunk)) {
	      for (var i = aChunk.length-1; i >= 0; i--) {
	        this.prepend(aChunk[i]);
	      }
	    }
	    else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      this.children.unshift(aChunk);
	    }
	    else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
	      );
	    }
	    return this;
	  };
	
	  /**
	   * Walk over the tree of JS snippets in this node and its children. The
	   * walking function is called once for each snippet of JS and is passed that
	   * snippet and the its original associated source's line/column location.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
	    var chunk;
	    for (var i = 0, len = this.children.length; i < len; i++) {
	      chunk = this.children[i];
	      if (chunk[isSourceNode]) {
	        chunk.walk(aFn);
	      }
	      else {
	        if (chunk !== '') {
	          aFn(chunk, { source: this.source,
	                       line: this.line,
	                       column: this.column,
	                       name: this.name });
	        }
	      }
	    }
	  };
	
	  /**
	   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
	   * each of `this.children`.
	   *
	   * @param aSep The separator.
	   */
	  SourceNode.prototype.join = function SourceNode_join(aSep) {
	    var newChildren;
	    var i;
	    var len = this.children.length;
	    if (len > 0) {
	      newChildren = [];
	      for (i = 0; i < len-1; i++) {
	        newChildren.push(this.children[i]);
	        newChildren.push(aSep);
	      }
	      newChildren.push(this.children[i]);
	      this.children = newChildren;
	    }
	    return this;
	  };
	
	  /**
	   * Call String.prototype.replace on the very right-most source snippet. Useful
	   * for trimming whitespace from the end of a source node, etc.
	   *
	   * @param aPattern The pattern to replace.
	   * @param aReplacement The thing to replace the pattern with.
	   */
	  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
	    var lastChild = this.children[this.children.length - 1];
	    if (lastChild[isSourceNode]) {
	      lastChild.replaceRight(aPattern, aReplacement);
	    }
	    else if (typeof lastChild === 'string') {
	      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
	    }
	    else {
	      this.children.push(''.replace(aPattern, aReplacement));
	    }
	    return this;
	  };
	
	  /**
	   * Set the source content for a source file. This will be added to the SourceMapGenerator
	   * in the sourcesContent field.
	   *
	   * @param aSourceFile The filename of the source file
	   * @param aSourceContent The content of the source file
	   */
	  SourceNode.prototype.setSourceContent =
	    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
	      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
	    };
	
	  /**
	   * Walk over the tree of SourceNodes. The walking function is called for each
	   * source file content and is passed the filename and source content.
	   *
	   * @param aFn The traversal function.
	   */
	  SourceNode.prototype.walkSourceContents =
	    function SourceNode_walkSourceContents(aFn) {
	      for (var i = 0, len = this.children.length; i < len; i++) {
	        if (this.children[i][isSourceNode]) {
	          this.children[i].walkSourceContents(aFn);
	        }
	      }
	
	      var sources = Object.keys(this.sourceContents);
	      for (var i = 0, len = sources.length; i < len; i++) {
	        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
	      }
	    };
	
	  /**
	   * Return the string representation of this source node. Walks over the tree
	   * and concatenates all the various snippets together to one string.
	   */
	  SourceNode.prototype.toString = function SourceNode_toString() {
	    var str = "";
	    this.walk(function (chunk) {
	      str += chunk;
	    });
	    return str;
	  };
	
	  /**
	   * Returns the string representation of this source node along with a source
	   * map.
	   */
	  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
	    var generated = {
	      code: "",
	      line: 1,
	      column: 0
	    };
	    var map = new SourceMapGenerator(aArgs);
	    var sourceMappingActive = false;
	    var lastOriginalSource = null;
	    var lastOriginalLine = null;
	    var lastOriginalColumn = null;
	    var lastOriginalName = null;
	    this.walk(function (chunk, original) {
	      generated.code += chunk;
	      if (original.source !== null
	          && original.line !== null
	          && original.column !== null) {
	        if(lastOriginalSource !== original.source
	           || lastOriginalLine !== original.line
	           || lastOriginalColumn !== original.column
	           || lastOriginalName !== original.name) {
	          map.addMapping({
	            source: original.source,
	            original: {
	              line: original.line,
	              column: original.column
	            },
	            generated: {
	              line: generated.line,
	              column: generated.column
	            },
	            name: original.name
	          });
	        }
	        lastOriginalSource = original.source;
	        lastOriginalLine = original.line;
	        lastOriginalColumn = original.column;
	        lastOriginalName = original.name;
	        sourceMappingActive = true;
	      } else if (sourceMappingActive) {
	        map.addMapping({
	          generated: {
	            line: generated.line,
	            column: generated.column
	          }
	        });
	        lastOriginalSource = null;
	        sourceMappingActive = false;
	      }
	      for (var idx = 0, length = chunk.length; idx < length; idx++) {
	        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
	          generated.line++;
	          generated.column = 0;
	          // Mappings end at eol
	          if (idx + 1 === length) {
	            lastOriginalSource = null;
	            sourceMappingActive = false;
	          } else if (sourceMappingActive) {
	            map.addMapping({
	              source: original.source,
	              original: {
	                line: original.line,
	                column: original.column
	              },
	              generated: {
	                line: generated.line,
	                column: generated.column
	              },
	              name: original.name
	            });
	          }
	        } else {
	          generated.column++;
	        }
	      }
	    });
	    this.walkSourceContents(function (sourceFile, sourceContent) {
	      map.setSourceContent(sourceFile, sourceContent);
	    });
	
	    return { code: generated.code, map: map };
	  };
	
	  exports.SourceNode = SourceNode;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 77 */
/*!****************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/base64-vlq.js ***!
  \****************************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 *
	 * Based on the Base 64 VLQ implementation in Closure Compiler:
	 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
	 *
	 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *  * Redistributions of source code must retain the above copyright
	 *    notice, this list of conditions and the following disclaimer.
	 *  * Redistributions in binary form must reproduce the above
	 *    copyright notice, this list of conditions and the following
	 *    disclaimer in the documentation and/or other materials provided
	 *    with the distribution.
	 *  * Neither the name of Google Inc. nor the names of its
	 *    contributors may be used to endorse or promote products derived
	 *    from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var base64 = __webpack_require__(/*! ./base64 */ 82);
	
	  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
	  // length quantities we use in the source map spec, the first bit is the sign,
	  // the next four bits are the actual value, and the 6th bit is the
	  // continuation bit. The continuation bit tells us whether there are more
	  // digits in this value following this digit.
	  //
	  //   Continuation
	  //   |    Sign
	  //   |    |
	  //   V    V
	  //   101011
	
	  var VLQ_BASE_SHIFT = 5;
	
	  // binary: 100000
	  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
	
	  // binary: 011111
	  var VLQ_BASE_MASK = VLQ_BASE - 1;
	
	  // binary: 100000
	  var VLQ_CONTINUATION_BIT = VLQ_BASE;
	
	  /**
	   * Converts from a two-complement value to a value where the sign bit is
	   * placed in the least significant bit.  For example, as decimals:
	   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
	   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
	   */
	  function toVLQSigned(aValue) {
	    return aValue < 0
	      ? ((-aValue) << 1) + 1
	      : (aValue << 1) + 0;
	  }
	
	  /**
	   * Converts to a two-complement value from a value where the sign bit is
	   * placed in the least significant bit.  For example, as decimals:
	   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
	   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
	   */
	  function fromVLQSigned(aValue) {
	    var isNegative = (aValue & 1) === 1;
	    var shifted = aValue >> 1;
	    return isNegative
	      ? -shifted
	      : shifted;
	  }
	
	  /**
	   * Returns the base 64 VLQ encoded value.
	   */
	  exports.encode = function base64VLQ_encode(aValue) {
	    var encoded = "";
	    var digit;
	
	    var vlq = toVLQSigned(aValue);
	
	    do {
	      digit = vlq & VLQ_BASE_MASK;
	      vlq >>>= VLQ_BASE_SHIFT;
	      if (vlq > 0) {
	        // There are still more digits in this value, so we must make sure the
	        // continuation bit is marked.
	        digit |= VLQ_CONTINUATION_BIT;
	      }
	      encoded += base64.encode(digit);
	    } while (vlq > 0);
	
	    return encoded;
	  };
	
	  /**
	   * Decodes the next base 64 VLQ value from the given string and returns the
	   * value and the rest of the string via the out parameter.
	   */
	  exports.decode = function base64VLQ_decode(aStr, aOutParam) {
	    var i = 0;
	    var strLen = aStr.length;
	    var result = 0;
	    var shift = 0;
	    var continuation, digit;
	
	    do {
	      if (i >= strLen) {
	        throw new Error("Expected more digits in base 64 VLQ value.");
	      }
	      digit = base64.decode(aStr.charAt(i++));
	      continuation = !!(digit & VLQ_CONTINUATION_BIT);
	      digit &= VLQ_BASE_MASK;
	      result = result + (digit << shift);
	      shift += VLQ_BASE_SHIFT;
	    } while (continuation);
	
	    aOutParam.value = fromVLQSigned(result);
	    aOutParam.rest = aStr.slice(i);
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 78 */
/*!**********************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/util.js ***!
  \**********************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  /**
	   * This is a helper function for getting values from parameter/options
	   * objects.
	   *
	   * @param args The object we are extracting values from
	   * @param name The name of the property we are getting.
	   * @param defaultValue An optional value to return if the property is missing
	   * from the object. If this is not specified and the property is missing, an
	   * error will be thrown.
	   */
	  function getArg(aArgs, aName, aDefaultValue) {
	    if (aName in aArgs) {
	      return aArgs[aName];
	    } else if (arguments.length === 3) {
	      return aDefaultValue;
	    } else {
	      throw new Error('"' + aName + '" is a required argument.');
	    }
	  }
	  exports.getArg = getArg;
	
	  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
	  var dataUrlRegexp = /^data:.+\,.+$/;
	
	  function urlParse(aUrl) {
	    var match = aUrl.match(urlRegexp);
	    if (!match) {
	      return null;
	    }
	    return {
	      scheme: match[1],
	      auth: match[2],
	      host: match[3],
	      port: match[4],
	      path: match[5]
	    };
	  }
	  exports.urlParse = urlParse;
	
	  function urlGenerate(aParsedUrl) {
	    var url = '';
	    if (aParsedUrl.scheme) {
	      url += aParsedUrl.scheme + ':';
	    }
	    url += '//';
	    if (aParsedUrl.auth) {
	      url += aParsedUrl.auth + '@';
	    }
	    if (aParsedUrl.host) {
	      url += aParsedUrl.host;
	    }
	    if (aParsedUrl.port) {
	      url += ":" + aParsedUrl.port
	    }
	    if (aParsedUrl.path) {
	      url += aParsedUrl.path;
	    }
	    return url;
	  }
	  exports.urlGenerate = urlGenerate;
	
	  /**
	   * Normalizes a path, or the path portion of a URL:
	   *
	   * - Replaces consequtive slashes with one slash.
	   * - Removes unnecessary '.' parts.
	   * - Removes unnecessary '<dir>/..' parts.
	   *
	   * Based on code in the Node.js 'path' core module.
	   *
	   * @param aPath The path or url to normalize.
	   */
	  function normalize(aPath) {
	    var path = aPath;
	    var url = urlParse(aPath);
	    if (url) {
	      if (!url.path) {
	        return aPath;
	      }
	      path = url.path;
	    }
	    var isAbsolute = (path.charAt(0) === '/');
	
	    var parts = path.split(/\/+/);
	    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
	      part = parts[i];
	      if (part === '.') {
	        parts.splice(i, 1);
	      } else if (part === '..') {
	        up++;
	      } else if (up > 0) {
	        if (part === '') {
	          // The first part is blank if the path is absolute. Trying to go
	          // above the root is a no-op. Therefore we can remove all '..' parts
	          // directly after the root.
	          parts.splice(i + 1, up);
	          up = 0;
	        } else {
	          parts.splice(i, 2);
	          up--;
	        }
	      }
	    }
	    path = parts.join('/');
	
	    if (path === '') {
	      path = isAbsolute ? '/' : '.';
	    }
	
	    if (url) {
	      url.path = path;
	      return urlGenerate(url);
	    }
	    return path;
	  }
	  exports.normalize = normalize;
	
	  /**
	   * Joins two paths/URLs.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be joined with the root.
	   *
	   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
	   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
	   *   first.
	   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
	   *   is updated with the result and aRoot is returned. Otherwise the result
	   *   is returned.
	   *   - If aPath is absolute, the result is aPath.
	   *   - Otherwise the two paths are joined with a slash.
	   * - Joining for example 'http://' and 'www.example.com' is also supported.
	   */
	  function join(aRoot, aPath) {
	    if (aRoot === "") {
	      aRoot = ".";
	    }
	    if (aPath === "") {
	      aPath = ".";
	    }
	    var aPathUrl = urlParse(aPath);
	    var aRootUrl = urlParse(aRoot);
	    if (aRootUrl) {
	      aRoot = aRootUrl.path || '/';
	    }
	
	    // `join(foo, '//www.example.org')`
	    if (aPathUrl && !aPathUrl.scheme) {
	      if (aRootUrl) {
	        aPathUrl.scheme = aRootUrl.scheme;
	      }
	      return urlGenerate(aPathUrl);
	    }
	
	    if (aPathUrl || aPath.match(dataUrlRegexp)) {
	      return aPath;
	    }
	
	    // `join('http://', 'www.example.com')`
	    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
	      aRootUrl.host = aPath;
	      return urlGenerate(aRootUrl);
	    }
	
	    var joined = aPath.charAt(0) === '/'
	      ? aPath
	      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);
	
	    if (aRootUrl) {
	      aRootUrl.path = joined;
	      return urlGenerate(aRootUrl);
	    }
	    return joined;
	  }
	  exports.join = join;
	
	  /**
	   * Make a path relative to a URL or another path.
	   *
	   * @param aRoot The root path or URL.
	   * @param aPath The path or URL to be made relative to aRoot.
	   */
	  function relative(aRoot, aPath) {
	    if (aRoot === "") {
	      aRoot = ".";
	    }
	
	    aRoot = aRoot.replace(/\/$/, '');
	
	    // XXX: It is possible to remove this block, and the tests still pass!
	    var url = urlParse(aRoot);
	    if (aPath.charAt(0) == "/" && url && url.path == "/") {
	      return aPath.slice(1);
	    }
	
	    return aPath.indexOf(aRoot + '/') === 0
	      ? aPath.substr(aRoot.length + 1)
	      : aPath;
	  }
	  exports.relative = relative;
	
	  /**
	   * Because behavior goes wacky when you set `__proto__` on objects, we
	   * have to prefix all the strings in our set with an arbitrary character.
	   *
	   * See https://github.com/mozilla/source-map/pull/31 and
	   * https://github.com/mozilla/source-map/issues/30
	   *
	   * @param String aStr
	   */
	  function toSetString(aStr) {
	    return '$' + aStr;
	  }
	  exports.toSetString = toSetString;
	
	  function fromSetString(aStr) {
	    return aStr.substr(1);
	  }
	  exports.fromSetString = fromSetString;
	
	  function strcmp(aStr1, aStr2) {
	    var s1 = aStr1 || "";
	    var s2 = aStr2 || "";
	    return (s1 > s2) - (s1 < s2);
	  }
	
	  /**
	   * Comparator between two mappings where the original positions are compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same original source/line/column, but different generated
	   * line and column the same. Useful when searching for a mapping with a
	   * stubbed out mapping.
	   */
	  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
	    var cmp;
	
	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp || onlyCompareOriginal) {
	      return cmp;
	    }
	
	    cmp = strcmp(mappingA.name, mappingB.name);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    return mappingA.generatedColumn - mappingB.generatedColumn;
	  };
	  exports.compareByOriginalPositions = compareByOriginalPositions;
	
	  /**
	   * Comparator between two mappings where the generated positions are
	   * compared.
	   *
	   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
	   * mappings with the same generated line and column, but different
	   * source/name/original line and column the same. Useful when searching for a
	   * mapping with a stubbed out mapping.
	   */
	  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
	    var cmp;
	
	    cmp = mappingA.generatedLine - mappingB.generatedLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	    if (cmp || onlyCompareGenerated) {
	      return cmp;
	    }
	
	    cmp = strcmp(mappingA.source, mappingB.source);
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalLine - mappingB.originalLine;
	    if (cmp) {
	      return cmp;
	    }
	
	    cmp = mappingA.originalColumn - mappingB.originalColumn;
	    if (cmp) {
	      return cmp;
	    }
	
	    return strcmp(mappingA.name, mappingB.name);
	  };
	  exports.compareByGeneratedPositions = compareByGeneratedPositions;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 79 */
/*!***************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/array-set.js ***!
  \***************************************************************************************************/
[105, 78],
/* 80 */
/*!******************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/mapping-list.js ***!
  \******************************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2014 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(/*! ./util */ 78);
	
	  /**
	   * Determine whether mappingB is after mappingA with respect to generated
	   * position.
	   */
	  function generatedPositionAfter(mappingA, mappingB) {
	    // Optimized for most common case
	    var lineA = mappingA.generatedLine;
	    var lineB = mappingB.generatedLine;
	    var columnA = mappingA.generatedColumn;
	    var columnB = mappingB.generatedColumn;
	    return lineB > lineA || lineB == lineA && columnB >= columnA ||
	           util.compareByGeneratedPositions(mappingA, mappingB) <= 0;
	  }
	
	  /**
	   * A data structure to provide a sorted view of accumulated mappings in a
	   * performance conscious manner. It trades a neglibable overhead in general
	   * case for a large speedup in case of mappings being added in order.
	   */
	  function MappingList() {
	    this._array = [];
	    this._sorted = true;
	    // Serves as infimum
	    this._last = {generatedLine: -1, generatedColumn: 0};
	  }
	
	  /**
	   * Iterate through internal items. This method takes the same arguments that
	   * `Array.prototype.forEach` takes.
	   *
	   * NOTE: The order of the mappings is NOT guaranteed.
	   */
	  MappingList.prototype.unsortedForEach =
	    function MappingList_forEach(aCallback, aThisArg) {
	      this._array.forEach(aCallback, aThisArg);
	    };
	
	  /**
	   * Add the given source mapping.
	   *
	   * @param Object aMapping
	   */
	  MappingList.prototype.add = function MappingList_add(aMapping) {
	    var mapping;
	    if (generatedPositionAfter(this._last, aMapping)) {
	      this._last = aMapping;
	      this._array.push(aMapping);
	    } else {
	      this._sorted = false;
	      this._array.push(aMapping);
	    }
	  };
	
	  /**
	   * Returns the flat, sorted array of mappings. The mappings are sorted by
	   * generated position.
	   *
	   * WARNING: This method returns internal data without copying, for
	   * performance. The return value must NOT be mutated, and should be treated as
	   * an immutable borrow. If you want to take ownership, you must make your own
	   * copy.
	   */
	  MappingList.prototype.toArray = function MappingList_toArray() {
	    if (!this._sorted) {
	      this._array.sort(util.compareByGeneratedPositions);
	      this._sorted = true;
	    }
	    return this._array;
	  };
	
	  exports.MappingList = MappingList;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 81 */
/*!*******************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/binary-search.js ***!
  \*******************************************************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  /**
	   * Recursive implementation of binary search.
	   *
	   * @param aLow Indices here and lower do not contain the needle.
	   * @param aHigh Indices here and higher do not contain the needle.
	   * @param aNeedle The element being searched for.
	   * @param aHaystack The non-empty array being searched.
	   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
	   */
	  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
	    // This function terminates when one of the following is true:
	    //
	    //   1. We find the exact element we are looking for.
	    //
	    //   2. We did not find the exact element, but we can return the index of
	    //      the next closest element that is less than that element.
	    //
	    //   3. We did not find the exact element, and there is no next-closest
	    //      element which is less than the one we are searching for, so we
	    //      return -1.
	    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
	    var cmp = aCompare(aNeedle, aHaystack[mid], true);
	    if (cmp === 0) {
	      // Found the element we are looking for.
	      return mid;
	    }
	    else if (cmp > 0) {
	      // aHaystack[mid] is greater than our needle.
	      if (aHigh - mid > 1) {
	        // The element is in the upper half.
	        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
	      }
	      // We did not find an exact match, return the next closest one
	      // (termination case 2).
	      return mid;
	    }
	    else {
	      // aHaystack[mid] is less than our needle.
	      if (mid - aLow > 1) {
	        // The element is in the lower half.
	        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
	      }
	      // The exact needle element was not found in this haystack. Determine if
	      // we are in termination case (2) or (3) and return the appropriate thing.
	      return aLow < 0 ? -1 : aLow;
	    }
	  }
	
	  /**
	   * This is an implementation of binary search which will always try and return
	   * the index of next lowest value checked if there is no exact hit. This is
	   * because mappings between original and generated line/col pairs are single
	   * points, and there is an implicit region between each of them, so a miss
	   * just means that you aren't on the very start of a region.
	   *
	   * @param aNeedle The element you are looking for.
	   * @param aHaystack The array that is being searched.
	   * @param aCompare A function which takes the needle and an element in the
	   *     array and returns -1, 0, or 1 depending on whether the needle is less
	   *     than, equal to, or greater than the element, respectively.
	   */
	  exports.search = function search(aNeedle, aHaystack, aCompare) {
	    if (aHaystack.length === 0) {
	      return -1;
	    }
	    return recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
	  };
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 82 */
/*!************************************************************************************************!*\
  !*** ./~/deadunit-core/~/stacktrace-js/~/stacktrace-gps/~/source-map/lib/source-map/base64.js ***!
  \************************************************************************************************/
67,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */
/*!**********************************!*\
  !*** template of 9 referencing  ***!
  \**********************************/
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var trimArgs = __webpack_require__(__webpack_module_template_argument_0__)
	
	
	module.exports = Future
	
	Future.debug = false // switch this to true if you want ids and long stack traces
	
	var curId = 0         // for ids\
	function Future(value) {
		if(arguments.length > 0) {
			var f = new Future()
	        f.return(value)
	        return f
		} else {
	        this.isResolved = false
	        this.queue = []
	        if(Future.debug) {
	            curId++
	            this.id = curId
	        }
	    }
	}
	
	// static methods
	
	// has one parameter: either a bunch of futures, or a single array of futures
	// returns a promise that resolves when one of them errors, or when all of them succeeds
	Future.all = function() {
	    if(arguments[0] instanceof Array) {
	        var futures = arguments[0]
	    } else {
	        var futures = trimArgs(arguments)
	    }
	
	    var f = new Future()
	    var results = []
	
	    if(futures.length > 0) {
	        var current = futures[0]
	        futures.forEach(function(future, index) {
	            current = current.then(function(v) {
	                results[index] = v
	                return futures[index+1]
	            })
	        })
	
	        //if
	        current.catch(function(e) {
	            f.throw(e)
	        })
	        // else
	        current.then(function() {
	            f.return(results)
	        })
	
	
	    } else {
	        f.return(results)
	    }
	
	    return f
	}
	
	// either used like futureWrap(function(){ ... })(arg1,arg2,etc) or
	//  futureWrap(object, 'methodName')(arg1,arg2,etc)
	Future.wrap = function() {
	    // function
	    if(arguments.length === 1) {
	        var fn = arguments[0]
	        var object = undefined
	
	
	    // object, function
	    } else {
	        var object = arguments[0]
	        var fn = object[arguments[1]]
	    }
	
	    return function() {
	        var args = Array.prototype.slice.call(arguments)
	        var future = new Future
	        args.push(future.resolver())
	        var me = this
	        if(object) me = object
	        fn.apply(me, args)
	        return future
	    }
	}
	
	
	// default
	var unhandledErrorHandler = function(e) {
	    setTimeout(function() {
	        throw e
	    },0)
	}
	
	// setup unhandled error handler
	// unhandled errors happen when done is called, and  then an exception is thrown from the future
	Future.error = function(handler) {
	    unhandledErrorHandler = handler
	}
	
	// instance methods
	
	// returns a value for the future (can only be executed once)
	// if there are callbacks waiting on this value, they are run in the next tick
	    // (ie they aren't run immediately, allowing the current thread of execution to complete)
	Future.prototype.return = function(v) {
	    resolve(this, 'return', v)
	}
	Future.prototype.throw = function(e) {
	    resolve(this, 'error', e)
	}
	
	function setNext(that, future) {
	    if(future !== undefined && !isLikeAFuture(future) )
	        throw Error("Value returned from then or catch *not* a Future: "+future)
	
	    resolve(that, 'next', future)
	}
	
	function wait(that, cb) {
	    if(that.isResolved) {
	        executeCallbacks(that, [cb])
	    } else {
	        that.queue.push(cb)
	    }
	}
	
	// duck typing to determine if something is or isn't a future
	function isLikeAFuture(x) {
	    return x.isResolved !== undefined && x.queue !== undefined && x.then !== undefined
	}
	
	function waitOnResult(f, result, cb) {
	    wait(result, function() {
	        if(this.hasError) {
	            f.throw(this.error)
	        } else if(this.hasNext) {
	            waitOnResult(f, this.next, cb)
	        } else {
	            try {
	                setNext(f, cb(this.result))
	            } catch(e) {
	                f.throw(e)
	            }
	        }
	    })
	}
	
	
	// cb takes one parameter - the value returned
	// cb can return a Future, in which case the result of that Future is passed to next-in-chain
	Future.prototype.then = function(cb) {
	    var f = new Future
	    wait(this, function() {
	        if(this.hasError)
	            f.throw(this.error)
	        else if(this.hasNext)
	            waitOnResult(f, this.next, cb)
	        else {
	            try {
	                setNext(f, cb(this.result))
	            } catch(e) {
	                f.throw(e)
	            }
	        }
	    })
	    return f
	}
	// cb takes one parameter - the error caught
	// cb can return a Future, in which case the result of that Future is passed to next-in-chain
	Future.prototype.catch = function(cb) {
	    var f = new Future
	    wait(this, function() {
	        if(this.hasError) {
	            try {
	                setNext(f, cb(this.error))
	            } catch(e) {
	                f.throw(e)
	            }
	        } else if(this.hasNext) {
	            this.next.then(function(v) {
	                f.return(v)
	            }).catch(function(e) {
	                setNext(f, cb(e))
	            })
	        } else {
	            f.return(this.result)
	        }
	    })
	    return f
	}
	// cb takes no parameters
	// callback's return value is ignored, but thrown exceptions propogate normally
	Future.prototype.finally = function(cb) {
	    var f = new Future
	    wait(this, function() {
	        try {
	            var that = this
	            if(this.hasNext) {
	                this.next.then(function(v) {
	                    var x = cb()
	                    f.return(v)
	                    return x
	                }).catch(function(e) {
	                    var x = cb()
	                    f.throw(e)
	                    return x
	                }).done()
	            } else if(this.hasError) {
	                Future(true).then(function() {
	                    return cb()
	                }).then(function() {
	                    f.throw(that.error)
	                }).catch(function(e) {
	                    f.throw(e)
	                }).done()
	
	            } else  {
	                Future(true).then(function() {
	                    return cb()
	                }).then(function() {
	                    f.return(that.result)
	                }).catch(function(e) {
	                    f.throw(e)
	                }).done()
	            }
	        } catch(e) {
	            f.throw(e)
	        }
	    })
	    return f
	}
	
	// all unused futures should end with this (e.g. most then-chains)
	// detatches the future so any propogated exception is thrown (so the exception isn't silently lost)
	Future.prototype.done = function() {
	    wait(this, function() {
	        if(this.hasError) {
	            unhandledErrorHandler(this.error)
	        } else if(this.hasNext) {
	            this.next.catch(function(e) {
	                unhandledErrorHandler(e)
	            })
	        }
	    })
	}
	
	
	
	Future.prototype.resolver = function() {
	    var me = this
	
	    return function(e,v) {
	        if(e) { // error argument
	            me.throw(e)
	        } else {
	            me.return(v)
	        }
	    }
	}
	
	Future.prototype.resolved = function() {
	    return this.isResolved
	}
	
	
	function resolve(that, type, value) {
	    if(that.isResolved)
	        throw Error("Future resolved more than once! Resolution: "+value)
	
	    that.isResolved = true
	    that.hasError = type === 'error'
	    that.hasNext = type === 'next' && value !== undefined
	
	    if(that.hasError)
	        that.error = value
	    else if(that.hasNext)
	        that.next = value
	    else
	        that.result = value
	
	    executeCallbacks(that, that.queue)
	}
	
	function executeCallbacks(that, callbacks) {
	    if(callbacks.length > 0) {
	        setTimeout(function() {
	            callbacks.forEach(function(cb) {
	                cb.apply(that)
	            })
	        },0)
	    }
	}


/***/ },
/* 104 */
/*!***********************************!*\
  !*** template of 38 referencing  ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__, __webpack_module_template_argument_1__, __webpack_module_template_argument_2__) {

	/*
	 * Copyright 2009-2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE.txt or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	exports.SourceMapGenerator = __webpack_require__(__webpack_module_template_argument_0__).SourceMapGenerator;
	exports.SourceMapConsumer = __webpack_require__(__webpack_module_template_argument_1__).SourceMapConsumer;
	exports.SourceNode = __webpack_require__(__webpack_module_template_argument_2__).SourceNode;


/***/ },
/* 105 */
/*!***********************************!*\
  !*** template of 61 referencing  ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__, __webpack_module_template_argument_0__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* -*- Mode: js; js-indent-level: 2; -*- */
	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */
	if (false) {
	    var define = require('amdefine')(module, require);
	}
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	
	  var util = __webpack_require__(__webpack_module_template_argument_0__);
	
	  /**
	   * A data structure which is a combination of an array and a set. Adding a new
	   * member is O(1), testing for membership is O(1), and finding the index of an
	   * element is O(1). Removing elements from the set is not supported. Only
	   * strings are supported for membership.
	   */
	  function ArraySet() {
	    this._array = [];
	    this._set = {};
	  }
	
	  /**
	   * Static method for creating ArraySet instances from an existing array.
	   */
	  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
	    var set = new ArraySet();
	    for (var i = 0, len = aArray.length; i < len; i++) {
	      set.add(aArray[i], aAllowDuplicates);
	    }
	    return set;
	  };
	
	  /**
	   * Add the given string to this set.
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
	    var isDuplicate = this.has(aStr);
	    var idx = this._array.length;
	    if (!isDuplicate || aAllowDuplicates) {
	      this._array.push(aStr);
	    }
	    if (!isDuplicate) {
	      this._set[util.toSetString(aStr)] = idx;
	    }
	  };
	
	  /**
	   * Is the given string a member of this set?
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.has = function ArraySet_has(aStr) {
	    return Object.prototype.hasOwnProperty.call(this._set,
	                                                util.toSetString(aStr));
	  };
	
	  /**
	   * What is the index of the given string in the array?
	   *
	   * @param String aStr
	   */
	  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
	    if (this.has(aStr)) {
	      return this._set[util.toSetString(aStr)];
	    }
	    throw new Error('"' + aStr + '" is not in the set.');
	  };
	
	  /**
	   * What is the element at the given index?
	   *
	   * @param Number aIdx
	   */
	  ArraySet.prototype.at = function ArraySet_at(aIdx) {
	    if (aIdx >= 0 && aIdx < this._array.length) {
	      return this._array[aIdx];
	    }
	    throw new Error('No element indexed by ' + aIdx);
	  };
	
	  /**
	   * Returns the array representation of this set (which has the proper indices
	   * indicated by indexOf). Note that this is a copy of the internal array used
	   * for storing the members so that no one can mess with internal state.
	   */
	  ArraySet.prototype.toArray = function ArraySet_toArray() {
	    return this._array.slice();
	  };
	
	  exports.ArraySet = ArraySet;
	
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }
/******/ ])))
});

//# sourceMappingURL=deadunit.browser.gen.umd.js.map