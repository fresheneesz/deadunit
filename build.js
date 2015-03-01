var header = '/*Copyright 2014 Billy Tetrud - MIT license, free for any use*/'


var path = require("path")

var buildModule = require("build-modules")
var colors = require("colors/safe")



//var copyright = '/* Copyright (c) 2015 Billy Tetrud - Free to use for any purpose: MIT License*/'

exports.build = function() {
    doyourthang(false)
}
exports.buildAndWatch = function() {
    doyourthang(true)
}

exports.buildAndWatch()


function doyourthang(watch) {                           // todo: put minify back to true
    build("deadunit.browser", watch, {name: 'deadunit', minify: false, header: header, output: {path:__dirname+'/browserPackage/', name: "deadunit.browser.gen.umd.js"}})
    build("test/deadunitTests.js", watch, {name: 'deadunitTests', header: header, minify: false, output: {path: __dirname+'/test/generated/', name: "deadunitTests.browser.umd.js"}})
}

function build(relativeModulePath, watch, options) {
    var emitter = buildModule(path.join(__dirname, relativeModulePath), {
        watch: watch/*, header: copyright*/, name: options.name, minify: options.minify !== false,
        output: options.output
    })
    emitter.on('done', function() {
       console.log((new Date())+" - Done building "+relativeModulePath+"!")
    })
    emitter.on('error', function(e) {
       console.log(e)
    })
    emitter.on('warning', function(w) {
       console.log(colors.grey(w))
    })
}
