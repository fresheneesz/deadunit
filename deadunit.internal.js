"use strict";
/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

module.exports = function(options) {
    var exports = {}

    var deadunitCore = options.deadunitCore
    var proto = require('proto')

    var defaultFormats = require('./defaultFormats')
    exports.format = require('./basicFormatter')

    exports.error = deadunitCore.error

    exports.test = proto(deadunitCore.test, function() {
        this.string = function(colorize) {
            if(colorize === undefined) colorize = false
            return defaultFormats.text(this, colorize, /*printOnTheFly=*/false, /*printLateEvents=*/false)
        }

        this.html = function() {
            return defaultFormats.html(this, false)
        }

        this.results = function() {
            arguments[0] = false
            return deadunitCore.test.results.apply(this, arguments)
        }

        options.environmentSpecificMethods.call(this)
    })

    return exports
}

