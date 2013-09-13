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
        group: function(name, duration, totalDuration, testSuccesses, testFailures,
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

            if(nestingLevel == 0) {
                var resultsLine = color('cyan', name+' - ')+
                                    color(finalColor, testSuccesses+'/'+(testSuccesses+testFailures)+' successful groups. ')+
                        color('green', assertSuccesses+' pass'+plural(assertSuccesses,"es",""))+
                        ', '+color('red', assertFailures+' fail'+plural(assertFailures))+
                        ', and '+color('magenta', exceptions+' exception'+plural(exceptions))+"."
                        +" Took "+duration+"ms."

                var result = ''
                if(name) result += color('cyan', name)+'\n'
                result += addResults()
                result += '\n\n'+resultsLine
            } else {
                var result = color(finalColor, name)+':           '
                                +color(testColor, testSuccesses+'/'+total)
                                +" and "+color(exceptionColor, exceptions+" exception"+plural(exceptions))
                                +" took "+duration+"ms"
                if(totalDuration/duration > 2) {
                    result += " "+color('grey', "("+totalDuration+"ms including setup and teardown)")
                }
                result += addResults()
            }

            return result
        },
        assert: function(result, test) {
            if(result.success) {
                var word = "Success:";
                var c = 'green'
            } else {
                var word = "Fail:   ";
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
                    things.push("Expected "+result.expected)
                if(result.actual !== undefined)
                    things.push("Got "+result.actual)

                expectations = " - "+things.join(', ')
            }

            return color(c, word)+" "+" ["+color('grey', result.file)+" "+result.line+color('grey', ":"+result.column)+"] "
                        +color(c, linesDisplay)
                        +expectations
        },
        exception: function(e) {
            return color('red', 'Exception: ')
                        +color('magenta', e.stack)
        }
    })
}

exports.html = function() {

    var getSqoolUnitTester = function() {
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

    return '<script src="jquery.js"></script>'+
        '<style>\
            .green\
            {   color: green;\
            }                \
         </style>'+
        '<script type="text/javascript">                      \
             var SqoolUnitTester = ('+getSqoolUnitTester+')() \
          </script>'+
        formatBasic(this, {
            group: function(name, testSuccesses, testFailures, assertSuccesses, assertFailures, exceptions, testResults) {
                var nameLine = ""
                if(name)
                    nameLine = '<h1>'+name+'</h1>'

                var mainId = getMainId(name)
                var linkStyle = "cursor:pointer;";

                if(testFailures > 0 || exceptions > 0)
                {	var bgcolor="red";
                    var show = "true";
                }else
                {	var bgcolor="green";
                    var show = "false";
                }

                var initTestGroup = function(mainId, bgcolor, show) {
                    $(function()
                    {	$('#'+mainId).css({"border-color":"'+$bgcolor+'"});
                        SqoolUnitTester.onToggle(show, bgcolor, '#'+mainId);

                        $('#'+mainId+'_final').click(function()
                        {	SqoolUnitTester.onToggle($('#'+mainId).css("display") == "none", bgcolor, '#'+mainId);
                        });
                    });
                }

                return nameLine+
                       '<div id="'+mainId+'">'+
                            testResults.join('\n')+
                       '</div>'+
                       '<div style="border:2px solid '+bgcolor+';background-color:white;color:white;margin:4px 0;padding: 1px 3px;'+linkStyle+'" id="'+mainId+'_final">'+
                            '<div style="background-color:'+bgcolor+';color:white;margin:4px 0;padding: 1px 3px">'+
                                '<div style="float:right;"><i>click on this bar</i></div>'+
                                testSuccesses+'/'+(testSuccesses+testFailures)+' test groups fully successful+ '+
                                '<b>'+assertSuccesses+'</b> pass'+plural(assertSuccesses,"es","")+
                                ', <b>'+assertFailures+'</b> fail'+plural(assertFailures)+
                                ', and <b>'+exceptions+'</b> exception'+plural(exceptions)+"+"+
                            '</div>'+
                       '</div>'+

                       '<script>;('+initTestGroup+')('+mainId+', '+bgcolor+', '+show+')</script>'+
                       '</div>'
            },
            test: function(name, resultSuccesses, resultFailures, resultExceptions, assertResults, exceptionResults) {
                var total = resultSuccesses+resultFailures

                var mainId = getMainId(name)
                var n = getNewNumber()
                var linkStyle = "cursor:pointer;";

                var testId = mainId+n

                if(resultFailures > 0 || resultExceptions > 0) {
                    var bgcolor="red";
                    var show = "true";
                } else {
                    var bgcolor="green";
                    var show = "false";
                }

                var initTest = function(mainId, bgcolor, show) {
                    $(function()
                    {	$('#'+mainId).css({borderColor:bgcolor});
                        SqoolUnitTester.onToggle(show, bgcolor, '#'+mainId+n+'_inner', '#'+mainId+n);

                        $('.'+mainId+n+'_status').click(function()
                        {	SqoolUnitTester.onToggle
                            (	$('#'+mainId+n+'_inner').css("display") == "none",
                                bgcolor,
                                '#'+mainId+n+'_inner',
                                '#'+mainId+n+''
                            );
                        });
                    });
                }

                return '<div id="'+mainId+n+'" style="margin:1px;">'+
                            '<div id="'+testId+'_inner">'+
                                '<h2 class="'+testId+'_status" style="'+linkStyle+'">'+name+'</h2>'+
                                assertResults.join('\n')+"\n"+
                                exceptionResults.join('\n')+"\n"+
                            '</div>'+
                            '<div style="background-color:'+bgcolor+';color:white;margin:4px 0;padding: 1px 3px;'+linkStyle+'" class="'+mainId+n+'_status">'+
                                "<b>"+name+"</b>"+': &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+
                                resultSuccesses+'/'+total+" and "+resultExceptions+" exception"+plural(resultExceptions)+"+"+
                            '</div>'+
                            '<script>;('+initTest+')('+mainId+', '+bgcolor+', '+show+')</script>'+
                      '</div>';
            },
            assert: function(result) {
                if(false === result.success) {
                    var color = "red";
                    var word = "Fail";
                } else {
                    var color = "green";
                    var word = "Success";
                }

                var linesDisplay = "'<i>"+result.sourceLines.join("<br>\n")+"</i>'";
                if(result.sourceLines.length > 1) {
                    linesDisplay = "<br>\n"+linesDisplay;
                }

                return '<div><span style="color:'+color+';">'+word+':</span> '+result.function+
                        " at ["+result.file+" line "+result.line+"] "+linesDisplay+"</div>";
            },
            exception: function(exception) {
                return '<span style="color:red;">Exception:</span> '+exception.stack;
            }
        })
}

var getMainId = function(name) {
    return 'unitTest_'+name.replace(/[^a-zA-Z]/g, "") // get rid of all characters except letters
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