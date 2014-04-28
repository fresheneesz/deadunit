"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitInternal = require("./deadunit.internal")
var defaultFormats = require('./defaultFormats')

module.exports = deadunitInternal({
    deadunitCore: require('deadunit-core/deadunitCore.node'),

    environmentSpecificMethods: function() {

        this.string = function(colorize) {
            if(colorize === undefined) colorize = require("colors/safe")
            return defaultFormats.text(this, colorize, /*printOnTheFly=*/false, /*printLateEvents=*/false)
        }

        this.writeConsole = function(hangingTimeout) {
            if(hangingTimeout === undefined) hangingTimeout = 100

            return defaultFormats.text(this, require('colors/safe'), /*printOnTheFly=*/true, false).then(function(finalResults) {
                console.log('\nFinal test results:')
                console.log(finalResults)

                if(hangingTimeout !== 0) {
                    setTimeout(function() {
                        console.log(("Script is hanging (lasted more than "+hangingTimeout+"ms after test "
                                    +"\""+finalResults.name+"\" finished printing)").red)
                    }, hangingTimeout).unref() // note: unref is only available in node.js
                }
            })
        }
    }
})
