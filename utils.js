
var util = require("util")

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