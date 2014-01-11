"use strict";
/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitCore = require('deadunit-core')
var proto = require('proto')

var defaultFormats = require('./defaultFormats')
exports.format = require('./basicFormatter')

exports.error = deadunitCore.error

exports.test = proto(deadunitCore.test, function() {
    this.string = function(colorize) {
        if(colorize === undefined) colorize = false
        return defaultFormats.text(this, colorize, /*printOnTheFly=*/false, 0)
    }

    this.html = function() {
        return defaultFormats.html(this)
    }

    this.writeConsole = function(hangingTimeout) {
        if(hangingTimeout === undefined) hangingTimeout = 100

        return defaultFormats.text(this, true, /*printOnTheFly=*/true, hangingTimeout).then(function(finalResults) {
            console.log('\nFinal test results:')
            console.log(finalResults)
        })
    }
})




