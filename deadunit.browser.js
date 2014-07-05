"use strict";
/* Copyright (c) 2014 Billy Tetrud - Free to use for any purpose: MIT License*/

var deadunitInternal = require("./deadunit.internal")
var Future = require('async-future')

module.exports = deadunitInternal({
    deadunitCore: require('deadunit-core/deadunitCore.browser'),

    environmentSpecificMethods: function() {
        var red = 'rgb(200,30,30)'

        var warningWritten = false
        function warnAboutLateEvents(domNode) {
            if(!warningWritten) {
                append(domNode, "Test results were accessed before asynchronous parts of tests were fully complete.", {style: "color: red;"})
                warningWritten = true
            }
        }

        function writeLateEvent(written, ended, domNode, event, manager) {
            if(ended) {
                written.then(function() {
                    warnAboutLateEvents(domNode)
                    append(domNode, JSON.stringify(event), {style: "color: red;"})
                })
            }
        }

        // writes html on the current (browser) page
        this.writeHtml = function(domNode) {
            if(domNode === undefined) domNode = document.body

            var f = new Future, test = this, ended = false, written = new Future
            test.events({
                end: function() {
                    ended = true
                    test.html(false).then(function(output) {
                        append(domNode, output)
                        written.return()
                        f.return()
                    })
                },

                assert: function(event) {
                    writeLateEvent(written, ended, domNode, event, test.manager)
                },
                exception: function(event) {
                    writeLateEvent(written, ended, domNode, event, test.manager)
                },
                log: function(event) {
                    writeLateEvent(written, ended, domNode, event, test.manager, event.parent, event.time)
                }
            })
            return f
        }

    }
})

function append(domNode, content, attributes) {
    if(domNode.setAttributeNode === undefined || domNode.appendChild === undefined)
        console.log("Object that is not a dom node passed to 'append' (jquery objects aren't supported anymore): "+domNode)
    if(attributes ===  undefined) attributes = {}

    /*var div = document.createElement('div')
        div.innerHTML = content
    for(var attribute in attributes) {
        var a = document.createAttribute(attribute)
            a.nodeValue = attributes[attribute]
        domNode.setAttributeNode(a);
    }

    domNode.appendChild(div)
    */
    $(domNode).append(content)
}