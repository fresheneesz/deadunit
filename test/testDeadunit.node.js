"use strict";

var fs = require("fs")

var Unit = require('../deadunit.node')

var deadunitTests = require("./deadunitTests")

var folder = __dirname+'/generated/'


//*
deadunitTests.getTests(Unit, {
    env: 'node',

    printTestOutput: function(test, name, timeout) {
        return test.writeConsole(timeout)
        .then(function() {
            return test.html()
        }).then(function(html){
            fs.writeFileSync(folder+name+".html", html)
        })
    },

    print: function print(str) {
        console.log(str)
    },
    reset: function() {}
})
//*/