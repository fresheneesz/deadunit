var build = require('build-modules')

build(__dirname+'/browserPackage/', 'deadunit.browser.gen', '/*Copyright 2014 Billy Tetrud - MIT license, free for any use*/',
    __dirname+"/deadunit.browser.js", {},
    function(e) {
        if(e === undefined) {
        console.log('done building browser package')
    } else {
        console.log(e.stack)
        process.exit(1)
    }
})

build(__dirname+'/test/generated/', 'deadunitTests.browser', '/*Copyright 2014 Billy Tetrud - MIT license, free for any use*/',
    __dirname+"/test/deadunitTests.js", {debug:true},
    function(e) {
        if(e === undefined) {
        console.log('done building browser tests')
    } else {
        console.log(e.stack)
        process.exit(1)
    }
})