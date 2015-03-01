"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var Future = require('async-future')
var proto = require('proto')
var defaultFormats = require('./defaultFormats')

var Container = require('blocks.js/Container')
var OriginalText = require('blocks.js/Text')
var Block = require("blocks.js/Block")
Block.dev = true
var Style = require("blocks.js/Style")

var deadunitInternal = require("./deadunit.internal")
var utils = require("./utils")


module.exports = deadunitInternal({
    deadunitCore: require('deadunit-core/src/deadunitCore.browser'),

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
            if(state.late) {
                var textColor = color.yellow
            } else if(state.success) {
                var textColor = color.green
            } else {
                var textColor = color.red
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

        this.updateTitle()
    }

    this.end = function(time) {
        // figure out if count succeeded
        if(this.expected !== undefined) {
            var countSuccess = this.count === this.expected
            this.countBlock.state.set("success", countSuccess)

            if(countSuccess) {
                this.mainGroup.title.testTotalPasses++
                this.title.passed++
            } else {
                this.mainGroup.title.testTotalFailures++
            }
        }

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
    }
})

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

        mainTitle.on('click', function() {
            this.results.visible = !this.results.visible
        }.bind(this))
    }

    this.endTest = function(type, time) {
        if(type === 'timeout')
            this.add(Text('timeout', "The test timed out!"))

        this.updateTitle()
        this.testTotalTime = getTimeDisplay(time - this.startTime)
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
            Container('time', Text("Took "), this.testTotalTimeNode, Text(".")),
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




            /*

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

                var durationText = timeText(totalDuration)

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
                                    '<span style="color:'+brightGreen+'">'+assertSuccesses+' pass'+plural(assertSuccesses,"es","")+'</span>'+
                                    ', <span style="color:'+darkRed+'">'+assertFailures+' fail'+plural(assertFailures)+'</span>'+
                                    ', and <span style="color:'+brightPurple+'">'+exceptions+' exception'+plural(exceptions)+'</span>'+
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
                                    testSuccesses+'/'+total+" and "+exceptions+" exception"+plural(exceptions)
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

                var linesDisplay = "<i>"+textToHtml(result.sourceLines)+"</i>";
                if(result.sourceLines.indexOf("\n") !== -1) {
                    linesDisplay = "<br>\n"+linesDisplay;
                }

                var expectations = ""
                if(!result.success && (result.actual !== undefined || result.expected !== undefined)) {
                    var things = []
                    if(result.expected !== undefined)
                        things.push("Expected "+textToHtml(valueToMessage(result.expected)))
                    if(result.actual !== undefined)
                        things.push("Got "+textToHtml(valueToMessage(result.actual)))

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
                var formattedException = textToHtml(errorToString(exception))
                return '<div style="color:'+purple+';">Exception: '+formattedException+'</div>'
            },
            log: function(values) {
                return '<div>'
                    +values.map(function(v) {
                        return textToHtml(valueToString(v))
                    }).join(', ')
                +'</div>'

            }


                    */