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
			var github = http.createClient(80, 'github.com');
			var request = github.request('GET', 
				'/api/v2/json/commits/list/'
					+ posted.UserName + '/'
					+ posted.Repository + '/'
					+ posted.Branch,
				{'host': 'github.com'});
			
			request.on('response', function(ghr) {
				ghr.setEncoding('utf8');
				
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write('<html><head><title>GitHub Repository Commit Monitor</title></head><body>'
					+ '<h1>GitHub Repository Commit Monitor</h1>'
					+ '<form method="post" action="." enctype="application/x-www-form-urlencoded"><fieldset>'
					+ '<div><label for="UserName">User Name:</label><input type="text" id="UserName" name="UserName" '
					+ 'value="' + posted.UserName + '" /></div>'
					+ '<div><label for="Repository">Repository:</label><input type="text" id="Repository" name="Repository" '
					+ 'value="' + posted.Repository + '" /></div>'
					+ '<div><label for="Branch">Branch:</label><input type="text" id="Branch" name="Branch" '
					+ 'value="' + posted.Branch + '"/></div>'
					+ '<div><input id="ListCommits" type="submit" value="List Commits" /></div>'
					+ '</fieldset></form>');
				
				if(ghr.statusCode == 200) {
					var githubData = '';
					
					ghr.on('data', function(chunk) {
						githubData += chunk;
					});
					
					ghr.on('end', function() {
						var data = JSON.parse(githubData);
					
						response.write('<a href="http://github.com/' 
							+ posted.UserName + '/' 
							+ posted.Repository + '" >' 
							+ posted.UserName + '/' + posted.Repository + '</a>');
					
						response.write('<ul>');
						
						for (var i = 0; i < data.commits.length; i++) {
							var commit = data.commits[i];
	
							response.write('<li><a href="http://github.com' + commit.url + '">' 
								+ commit.committed_date + '</a> - ' + commit.author.name
								+ ': ' + commit.message + '</li>');
						}
						
						response.end('</ul></body></html>');
					});
				} else {
					response.write('<h2>Failed</h2>');
					
					response.end(utils.inspect(posted));
				}
			});
			
			request.end();
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