var http = require('http');
var fs = require('fs')
var url = require('url')

require('./build') // build the bundles

var server = http.createServer(function (request, res) {
    try {
        var requestUrl = url.parse(request.url)
        var path = requestUrl.pathname

        if(path !== '/favicon.ico') {
            console.log("got request for: "+path)

            if(path === '/') {
                path = '/testDeadunit.html'
            }

            if(path.slice(-2) === 'js') {
                res.setHeader("Content-Type", 'text/javascript')
            }
            res.writeHead(200)
            res.write(fs.readFileSync(__dirname+path))
        }
    } catch(e) {
        console.log(e.message)
    } finally {
        res.end()
    }
})

var port = 8100
server.listen(port)
console.log("listening on port "+port)
