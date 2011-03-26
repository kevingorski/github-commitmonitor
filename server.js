var http = require('http'),
	express = require('express'),
	assetManager = require('connect-assetmanager'),
	MongoStore = require('connect-mongo'),
	Log = require('log'),
	log = new Log(),
	development = require('./configuration/development'),
	production = require('./configuration/production');


function getCommits(req, res, userName, repository, branch) {
	var history = req.session.history || [],
		github = http.createClient(80, 'github.com'),
		repoPath = userName + '/'
			+ repository + '/'
			+ branch,
		ghRequest = github.request('GET', 
			'/api/v2/json/commits/list/' + repoPath,
			{'host': 'github.com'}),
		posted = {
			'UserName': userName,
			'Repository': repository,
			'Branch': branch
		};
		
	// If we had to create a new array, assign it to the current session
	if(!history.length) req.session.history = history;
	
	log.notice('[GitHub] Searching for ' + repoPath);
	
	ghRequest.on('response', function(ghr) {
		if(ghr.statusCode == 200) {
			var githubData = '';
				
			ghr.on('data', function(chunk) {
				githubData += chunk;
			});
			
			ghr.on('end', function() {
				if(!history.length 
					|| history[0].UserName != posted.UserName
					|| history[0].Repository != posted.Repository
					|| history[0].Branch != posted.Branch)
					history.unshift(posted);

				if(history.length > 3)
					history.pop();

				req.title = 'GitHub Commit Monitor: ' + repoPath;

				res.render('index', { 
					posted: posted, 
					commits: JSON.parse(githubData).commits
				});
			});
		} else {
			req.flash('error', 'That user, repository, or branch doesn\'t seem to exist.');
			res.render('index', { posted: posted, commits: [] });
			
			log.warning('[GitHub] Response ' + ghr.statusCode + ' for ' + repoPath);
		}
	});
	
	ghRequest.end();
}

var handlePost = function(req, res) {
	var posted = req.body;
	
	getCommits(
		req,
		res,
		posted.UserName, 
		posted.Repository, 
		posted.Branch);
};

var handleGet = function(req, res) {
	if(!req.session.history)
		req.session.history = [];
	
	res.render('index', { posted: { Branch: 'master'}, commits: []});
};

var server = express.createServer(
	express.bodyParser(),
	express.cookieParser()
);

// Server Configuration	
development.addConfiguration(server, log);
production.addConfiguration(server, log);
	
server.use(express.static(__dirname + '/public'));

server.error(function(err, req, res){
	log.error(err);
	
	res.render('index', { posted: {}, commits: []});
});

server.dynamicHelpers({ 
	flashMessages: function(req) { 
		return function() {
			return req.flash('error');
		};
	},
	title: function(req) { return req.title || 'GitHub Commit Monitor'; },
	history: function(req) { return req.session ? req.session.history || [] : []; }
});

server.set('views', __dirname + '/views');
server.set('view engine', 'jade');

// Routing
server.get('/', handleGet);
server.post('/', handlePost);
server.get('/:UserName/:Repository/:Branch?', function(req, res) {
	getCommits(
		req,
		res,
		req.params.UserName, 
		req.params.Repository, 
		req.params.Branch || 'master');
});


server.listen(8124);

log.info('Server running at http://127.0.0.1:8124/');