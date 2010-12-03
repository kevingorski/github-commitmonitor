var http = require('http');
var querystring = require('querystring');
var utils = require('utils');

http.createServer(function (request, response) {
	
	if(request.method === 'POST') {
		var requestBody = '';
		
		request.on('data', function(chunk) {
			requestBody += chunk.toString();
		});
		
		request.on('end', function() {
			var posted = querystring.parse(requestBody);
			
			response.writeHead(200, {'Content-Type': 'text/html'});
			
			response.end(utils.inspect(posted));
		});
		
	} else {
		// Write out the empty form
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.end('<html><head><title>GitHub Repository Commit Monitor</title></head><body>'
			+ '<h1>GitHub Repository Commit Monitor</h1>'
			+ '<form method="post" action="." enctype="application/x-www-form-urlencoded"><fieldset>'
			+ '<div><label for="UserName">User Name:</label><input type="text" id="UserName" name="UserName" /></div>'
			+ '<div><label for="Repository">Repository:</label><input type="text" id="Repository" name="Repository" /></div>'
			+ '<div><label for="Branch">Branch:</label><input type="text" id="Branch" name="Branch" value="master" /></div>'
			+ '<div><input id="ListCommits" type="submit" value="List Commits" /></div>'
			+ '</fieldset></form>'
			+ '</body></html>');
	}
	
}).listen(8124);

console.log('Server running at http://127.0.0.1:8124/');