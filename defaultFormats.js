var util = require("util")

var Future = require('async-future')

var formatBasic = require("./basicFormatter")
var indent = require("./indent")

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


            var testColor, exceptionColor, finalColor
            testColor = exceptionColor = finalColor = 'green'
            if(testFailures > 0) {
                testColor = finalColor = 'red'
            }
            if(exceptions > 0) {
                exceptionColor = finalColor = 'red'
            }

            var durationText = timeText(totalDuration)

            if(nestingLevel === 0) {
                var resultsLine = ''

                if(name) resultsLine += color('cyan', name+' - ')



                resultsLine += color(finalColor, testSuccesses+'/'+(testSuccesses+testFailures)+' successful tests. ')+
                        color('green', assertSuccesses+' pass'+plural(assertSuccesses,"es",""))+
                        ', '+color('red', assertFailures+' fail'+plural(assertFailures))+
                        ', and '+color('magenta', exceptions+' exception'+plural(exceptions))+"."
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
                                +" and "+color(exceptionColor, exceptionResults.length+" exception"+plural(exceptionResults.length))
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
                    things.push("Expected "+valueToMessage(result.expected))
                if(result.actual !== undefined)
                    things.push("Got "+valueToMessage(result.actual))

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
                        +color('magenta', errorToString(e))
        },
        log: function(values, onTheFly) {
            return lateEventsWarning()+values.map(function(v) {
                return valueToString(v)
            }).join(', ')
        },
        end: function() {
            ended = true
        }
    })
}

function valueToMessage(value) {
    if(value instanceof Error) {
        return errorToString(value)
    } else {
        return util.inspect(value)
    }
}

function errorToString(err) {
    if(err instanceof Error) {
        var otherProperties = []
        for(var n in err) {
            if(Object.hasOwnProperty.call(err, n) && n !== 'message' && n !== 'stack') {
                otherProperties.push(valueToString(err[n]))
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

function valueToString(v) {
    if(v instanceof Error) {
        return errorToString(v)

    } else if(typeof(v) === 'string') {
        return v
    } else {
        return util.inspect(v)
    }
}

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

    var red = 'rgb(200,30,30)'
    var darkRed = 'rgb(90,0,0)'
    var lightRed = 'rgb(255,210,230)'
    var black = 'rgb(20,20,20)'
    var white = 'rgb(240,220,220)'
    var green = 'rgb(0,100,20)'
    var brightGreen = 'rgb(0,200,50)'
    var purple = 'rgb(190,0,160)'
    var brightPurple = 'rgb(255,126,255)'
    var blue = 'rgb(0, 158, 173)'
    var brightBlue = 'rgb(0, 233, 255)'
    var gray = 'rgb(185, 180, 180)'


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

function plural(num, plural, singular) {
	var plur = num!==1;

    if(singular === undefined) {
    	if(plur)	return "s"
        else        return ""
    } else {
    	if(plur)	return plural
        else		return singular
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

function textToHtml(text) {
    return htmlEscape(text)
            .replace(/ /g, '&nbsp;')
            .replace(/\n/g, "<br>\n")
            .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
}

function timeText(ms) {
    if(ms < 2000)
        return ms+"ms"
    else
        return Number(ms/1000).toPrecision(3)+'s'
}
