var http = require('http');
var fs = require('fs')
var url = require('url')

var server = http.createServer(function (request, res) {
    try {
        var requestUrl = url.parse(request.url)
        var path = requestUrl.pathname

        if(path !== '/favicon.ico') {
            console.log("got request for: "+path)

            if(path === '/') {
                path = '/testDeadunit.html'
            }

            res.writeHead(200);
            res.write(fs.readFileSync(__dirname+path))
            res.end()
        }
    } catch(e) {
        console.log(e.message)
    }
})

server.listen(8000)
