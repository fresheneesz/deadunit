"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitInternal = require("./deadunit.internal")
var defaultFormats = require('./defaultFormats')
var color = require("colors/safe")

module.exports = deadunitInternal({
    deadunitCore: require('deadunit-core/deadunitCore.node'),

    environmentSpecificMethods: function() {

        this.string = function(colorize) {
            if(colorize === true) var colorModule = color
            return defaultFormats.text(this, colorModule, /*printOnTheFly=*/false, /*printLateEvents=*/false)
        }

        this.writeConsole = function(hangingTimeout) {
            if(hangingTimeout === undefined) hangingTimeout = 100

            return defaultFormats.text(this, require('colors/safe'), /*printOnTheFly=*/true, /*printLateEvents=*/true).then(function(finalResults) {
                console.log('\nFinal test results:')
                console.log(finalResults)

                if(hangingTimeout !== 0) {
                    setTimeout(function() {
                        console.log(color.red("Script is hanging (lasted more than "+hangingTimeout+"ms after test "
                                    +"\""+finalResults.name+"\" finished printing)"))
                    }, hangingTimeout).unref() // note: unref is only available in node.js
                }
            })
        }
    }
})
