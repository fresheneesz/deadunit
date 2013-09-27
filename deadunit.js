"use strict";
/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitCore = require('deadunit-core')
var proto = require('proto')

var defaultFormats = require('./defaultFormats')
exports.format = require('./basicFormatter')

exports.error = deadunitCore.error

exports.test = proto(deadunitCore.test, function() {
    this.string = // alias
    this.toString = function(colorize) {
        if(colorize === undefined) colorize = false
        return defaultFormats.text(this, colorize)
    }

    this.writeConsole = function() {
        console.log(defaultFormats.text(this, true))
    }

    this.html = defaultFormats.html

})




