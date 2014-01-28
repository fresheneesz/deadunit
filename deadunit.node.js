"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitInternal = require("./deadunit.internal")
var defaultFormats = require('./defaultFormats')

module.exports = deadunitInternal({
    deadunitCore: require('deadunit-core/deadunitCore.node'),

    environmentSpecificMethods: function() {
        this.writeConsole = function(hangingTimeout) {
            if(hangingTimeout === undefined) hangingTimeout = 100

            return defaultFormats.text(this, true, /*printOnTheFly=*/true, hangingTimeout, false).then(function(finalResults) {
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