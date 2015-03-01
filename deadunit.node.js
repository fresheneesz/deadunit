"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitInternal = require("./deadunit.internal")
var defaultFormats = require('./defaultFormats')
var color = require("colors/safe")

module.exports = deadunitInternal({
    deadunitCore: require('deadunit-core/src/deadunitCore.node'),

    environmentSpecificMethods: function() {

        this.string = function(colorize) {
            if(colorize === true) var colorModule = color
            return defaultFormats.text(this, colorModule, /*printOnTheFly=*/false, /*printLateEvents=*/false)
        }

        this.writeConsole = function(hangingTimeout) {
            if(hangingTimeout === undefined) hangingTimeout = 100

            var test = this
            return defaultFormats.text(this, require('colors/safe'), /*printOnTheFly=*/true, /*printLateEvents=*/true).then(function(finalResults) {
                console.log('\nFinal test results:')
                console.log(finalResults)

                if(hangingTimeout !== 0) {
                    setTimeout(function() {
                        var name = test.results().name
                        console.log(color.red("Script is hanging (lasted more than "+hangingTimeout+"ms after test "
                                    +"\""+name+"\" finished printing)"))
                    }, hangingTimeout).unref() // note: unref is only available in node.js
                }
            })
        }
    }
})
