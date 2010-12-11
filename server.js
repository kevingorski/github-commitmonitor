var http = require('http');
var utils = require('utils');
var connect = require('connect');
var MemoryStore = require('connect/middleware/session/memory');

var displayHistory = function(request, response) {
	if(request.session.history.length) {
		response.write('<h3>Recently Viewed</h3><ol>');
		
		for(var i = 0; i < request.session.history.length; i++) {
			var item = request.session.history[i];
			
			response.write('<li><a href="http://github.com/' 
				+ item.UserName + '/' 
				+ item.Repository + '" >' 
				+ item.UserName + '/' + item.Repository + '</a></li>');
		}
		
		response.write('</ol>');
	}
};

var handlePost = function(request, response) {
	var posted = request.body;
	var github = http.createClient(80, 'github.com');
	var ghRequest = github.request('GET', 
		'/api/v2/json/commits/list/'
			+ posted.UserName + '/'
			+ posted.Repository + '/'
			+ posted.Branch,
		{'host': 'github.com'});
	
	ghRequest.on('response', function(ghr) {
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write('<html><head><title>GitHub Repository Commit Monitor</title><link rel="stylesheet" href="style.css" ></head><body>'
			+ '<h1>GitHub Repository Commit Monitor</h1>'
			+ '<form method="post" action="." enctype="application/x-www-form-urlencoded"><fieldset>'
			+ '<div><label for="UserName">User Name:</label><input type="text" id="UserName" name="UserName" '
			+ 'value="' + posted.UserName + '" /></div>'
			+ '<div><label for="Repository">Repository:</label><input type="text" id="Repository" name="Repository" '
			+ 'value="' + posted.Repository + '" /></div>'
			+ '<div><label for="Branch">Branch:</label><input type="text" id="Branch" name="Branch" '
			+ 'value="' + posted.Branch + '"/></div>'
			+ '<input id="ListCommits" type="submit" value="List Commits" />'
			+ '</fieldset></form>');
		
		displayHistory(request, response);
		
		if(ghr.statusCode == 200) {
			var githubData = '';
			var history = request.session.history;
			
			history.unshift(posted);
			
			if(history.length > 3)
				history.pop();
			
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
			response.end('<h2>That user, repository, or branch doesn\'t seem to exist.</h2></body></html>');
		}
	});
	
	ghRequest.end();
};

var handleGet = function(request, response) {
	if(!request.session.history)
		request.session.history = [];
	
	// Write out the empty form
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write('<html><head>'
		+ '<title>GitHub Repository Commit Monitor</title>'
		+ '<link rel="stylesheet" href="style.css" ></head><body>'
		+ '<h1>GitHub Repository Commit Monitor</h1>'
		+ '<form method="post" action="." enctype="application/x-www-form-urlencoded"><fieldset>'
		+ '<div><label for="UserName">User Name:</label><input type="text" id="UserName" name="UserName" /></div>'
		+ '<div><label for="Repository">Repository:</label><input type="text" id="Repository" name="Repository" /></div>'
		+ '<div><label for="Branch">Branch:</label><input type="text" id="Branch" name="Branch" value="master" /></div>'
		+ '<input id="ListCommits" type="submit" value="List Commits" />'
		+ '</fieldset></form>');
		
	displayHistory(request, response);
	
	response.end('</body></html>');
};

var server = connect.createServer();

server.use('/',
	connect.bodyDecoder(),
	connect.cookieDecoder(),
	connect.session({ 
		store: new MemoryStore({ reapInterval: 60000, maxAge:300000 })
	}),
	connect.staticProvider({ root: __dirname + '/public', cache: true }),
	connect.router(function(app) {
		app.get('/', handleGet);
		app.post('/', handlePost);
	})
);

server.listen(8124);

console.log('Server running at http://127.0.0.1:8124/');