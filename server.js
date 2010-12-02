var http = require('http');

http.createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end('<html><body>'
		+ '<h1>GitHub Repository Commit Monitor</h1>'
		+ '<form method="post" action="."><fieldset>'
		+ '<div><label for="UserName">User Name:</label><input type="text" id="UserName" name="UserName" /></div>'
		+ '<div><label for="Repository">Repository:</label><input type="text" id="Repository" name="Repository" /></div>'
		+ '<div><label for="Branch">Branch:</label><input type="text" id="Branch" name="Branch" value="master" /></div>'
		+ '<div><input id="ListCommits" type="submit" value="List Commits" /></div>'
		+ '</fieldset></form>'
		+ '</body></html>');
}).listen(8124);

console.log('Server running at http://127.0.0.1:8124/');