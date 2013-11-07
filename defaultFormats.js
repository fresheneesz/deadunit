var util = require("util")

var formatBasic = require("./basicFormatter")
var indent = require("./indent")

exports.text = function textOutput(unitTest, consoleColoring) {
    if(consoleColoring) require('colors')

    function color(theColor, theString) {
        if(consoleColoring)
            return theString.toString()[theColor]
        else
            return theString.toString()
    }

    return formatBasic(unitTest, {
        group: function(name, totalSyncDuration, totalDuration, testSuccesses, testFailures,
                              assertSuccesses, assertFailures, exceptions,
                              testResults, exceptionResults, nestingLevel) {

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

            var durationText = timeText(totalSyncDuration)
            if(totalSyncDuration+10 < totalDuration) {
                durationText += " "+color('grey', "("+timeText(totalDuration)+" including asynchronous parts)")
            }

            if(nestingLevel == 0) {
                var resultsLine = ''

                if(name) resultsLine += color('cyan', name+' - ')



                resultsLine += color(finalColor, testSuccesses+'/'+(testSuccesses+testFailures)+' successful groups. ')+
                        color('green', assertSuccesses+' pass'+plural(assertSuccesses,"es",""))+
                        ', '+color('red', assertFailures+' fail'+plural(assertFailures))+
                        ', and '+color('magenta', exceptions+' exception'+plural(exceptions))+"."
                        +" Took "+durationText+"."

                var result = ''
                if(name) result += color('cyan', name)+'\n'
                result += addResults()
                result += '\n\n'+resultsLine
            } else {
                var result = color(finalColor, name)+':           '
                                +color(testColor, testSuccesses+'/'+total)
                                +" and "+color(exceptionColor, exceptionResults.length+" exception"+plural(exceptionResults.length))
                                +" took "+durationText
                result += addResults()
            }

            return result
        },
        assert: function(result, test) {
            if(result.success) {
                var word = "Ok!  ";
                var c = 'green'
            } else {
                var word = "Fail:";
                var c = 'red'
            }

            var linesDisplay = result.sourceLines.join("\n")
            if(result.sourceLines.length > 1) {
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

            return color(c, word)+" ["+color('grey', result.file)+" "+result.line+color('grey', ":"+result.column)+"] "
                        +color(c, linesDisplay)
                        +expectations
        },
        exception: function(e) {
            if(e.stack !== undefined) {
                var displayError = e.stack
            } else {
                var displayError = e
            }

            return color('red', 'Exception: ')
                        +color('magenta', displayError)
        },
        log: function(values) {
            return values.map(function(v) {
                return valueToString(v)
            }).join('')
        }
    })
}

function valueToMessage(value) {
    if(value instanceof Error) {
        return value.stack
    } else {
        return util.inspect(value)
    }
}

function valueToString(v) {
    if(v instanceof Error) {
        return v.stack
    } else if(typeof(v) === 'string') {
        return v
    } else {
        return util.inspect(v)
    }
}

exports.html = function(unitTest) {

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
    return '<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>'+
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
            .locationInner{\
                color:'+gray+';\
            }\
            .lineNumber{\
                color:'+white+';\
            }\
         </style>'+
        '<script type="text/javascript">                      \
             var TestDisplayer = ('+getTestDisplayer+')() \
          </script>'+
        formatBasic(unitTest, {
            group: function(name, totalSyncDuration, totalDuration, testSuccesses, testFailures,
                              assertSuccesses, assertFailures, exceptions,
                              testResults, exceptionResults, nestingLevel) {

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

                var durationText = timeText(totalSyncDuration)
                if(totalSyncDuration+10 < totalDuration) {
                    durationText += ' <span class="asyncTime">'+"("+timeText(totalDuration)+" including asynchronous parts)</span>"
                }

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

                    return titleLine+
                           '<div class="testResultsArea" id="'+mainId+'">'+
                                testResults.join('\n')+
                                exceptionResults.join('\n')+"\n"+
                           '</div>'+
                           '<div class="testResultsBar link" style="border:2px solid '+bgcolor+';" id="'+mainId+'_final">'+
                                '<div class="testResultsBarInner" style="background-color:'+bgcolor+';">'+
                                    '<div style="float:right;"><i>click on this bar</i></div>'+
                                    '<div><span class="testResultsName">'+nameLine+'</span>' + testSuccesses+'/'+total+' successful test groups. '+
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

                var linesDisplay = "<i>"+htmlEscape(result.sourceLines.join("\n")).replace(/\n/g, "<br>\n")+"</i>";
                if(result.sourceLines.length > 1) {
                    linesDisplay = "<br>\n"+linesDisplay;
                }

                return '<div style="color:'+color+';"><span >'+word+'</span>'+
                            " <span class='locationOuter'>[<span class='locationInner'>"
                                    +result.file+" line <span class='lineNumber'>"+result.line+"</span>:"
                                +result.column+"</span>]"
                            +"</span> "
                        +linesDisplay+"</div>"
            },
            exception: function(exception) {
                if(exception.stack !== undefined) {
                    var displayError = exception.stack
                } else {
                    var displayError = exception
                }

                var formattedException = htmlEscape(displayError).replace(/ /g, '&nbsp;').replace(/\n/g, "<br>\n")
                return '<span style="color:'+purple+';">Exception: '+formattedException+'</span>'
            },
            log: function(values) {
                return values.map(function(v) {
                    return htmlEscape(valueToString(v)).replace("\n", "<br>\n")
                }).join('<br>\n')

            }
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

function timeText(ms) {
    if(ms < 2000)
        return ms+"ms"
    else
        return Number(ms/1000).toPrecision(3)+'s'
}
