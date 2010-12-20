var http = require('http');
var express = require('express');

var handlePost = function(request, response) {
	var posted = request.body;
	var history = request.session.history;
	var github = http.createClient(80, 'github.com');
	var ghRequest = github.request('GET', 
		'/api/v2/json/commits/list/'
			+ posted.UserName + '/'
			+ posted.Repository + '/'
			+ posted.Branch,
		{'host': 'github.com'});
	
	ghRequest.on('response', function(ghr) {
		if(ghr.statusCode == 200) {
			var githubData = '';
			
			history.unshift(posted);
			
			if(history.length > 3)
				history.pop();
			
			ghr.on('data', function(chunk) {
				githubData += chunk;
			});
			
			ghr.on('end', function() {
				var data = JSON.parse(githubData);
				
				response.render('index', { locals: { posted: posted, commits: data.commits }});
			});
		} else {
			request.flash('error', 'That user, repository, or branch doesn\'t seem to exist.');
			response.render('index', { locals: { posted: posted, commits: [] }});
		}
	});
	
	ghRequest.end();
};

var handleGet = function(request, response) {
	if(!request.session.history)
		request.session.history = [];
	
	response.render('index', { locals: { posted: { Branch: 'master'}, commits: []}});
};

var server = express.createServer(
	express.bodyDecoder(),
	express.cookieDecoder(),
	express.session(),
	express.staticProvider({ root: __dirname + '/public', cache: true })
);

server.dynamicHelpers({ 
	flashMessages: function(request) { 
		return function() {
			return request.flash('error');
		};
	},
	history: function(request) { return request.session.history; }
});
server.set('views', __dirname + '/views');
server.set('view engine', 'jade');

server.get('/', handleGet);
server.post('/', handlePost);

server.listen(8124);

console.log('Server running at http://127.0.0.1:8124/');