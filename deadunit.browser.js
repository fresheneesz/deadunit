"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitInternal = require("./deadunit.internal")
var Future = require('async-future')

module.exports = deadunitInternal({
    deadunitCore: require('../deadunitCore/deadunitCore.browser'),

    environmentSpecificMethods: function() {
        var red = 'rgb(200,30,30)'

        var warningWritten = false
        function warnAboutLateEvents(jqueryElement) {
            if(!warningWritten) {
                jqueryElement.append(
                    '<div style="color:'+red+'">Test results were accessed before asynchronous parts of tests were fully complete.</div>'
                )
                warningWritten = true
            }
        }

        function writeLateEvent(written, ended, jqueryElement, event, manager) {
            if(ended) {
                written.then(function() {
                    warnAboutLateEvents(jqueryElement)
                    jqueryElement.append(
                        '<div style="color:'+red+'">'+JSON.stringify(event)+'</div>'
                    )
                })
            }
        }

        // writes html on the current (browser) page
        this.writeHtml = function(jqueryElement) {
            var f = new Future, test = this, ended = false, written = new Future
            test.events({
                end: function() {
                    ended = true
                    test.html(false).then(function(output) {
                        jqueryElement.append(output)
                        written.return()
                        f.return()
                    })
                },

                assert: function(event) {
                    writeLateEvent(written, ended, jqueryElement, event, test.manager)
                },
                exception: function(event) {
                    writeLateEvent(written, ended, jqueryElement, event, test.manager)
                },
                log: function(event) {
                    writeLateEvent(written, ended, jqueryElement, event, test.manager, event.parent, event.time)
                }
            })
            return f
        }

    }
})
