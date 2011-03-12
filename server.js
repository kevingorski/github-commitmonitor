var http = require('http'),
	express = require('express'),
	assetManager = require('connect-assetmanager'),
	// CookieStore = require('cookie-sessions'),
	MongoDBStore = require('connect-mongodb'),
	fs = require('fs'),
	Log = require('log'),
	log = new Log();

var handlePost = function(request, response) {
	var posted = request.body;
	var history = request.session.history || [];
	var github = http.createClient(80, 'github.com');
	var repoPath = posted.UserName + '/'
		+ posted.Repository + '/'
		+ posted.Branch;
	var ghRequest = github.request('GET', 
		'/api/v2/json/commits/list/' + repoPath,
		{'host': 'github.com'});
	
	log.notice('[GitHub] Searching for ' + repoPath);
	
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
				
				request.title = 'GitHub Commit Monitor: ' + repoPath;
				
				response.render('index', { 
					posted: posted, 
					commits: data.commits
				});
			});
		} else {
			request.flash('error', 'That user, repository, or branch doesn\'t seem to exist.');
			response.render('index', { posted: posted, commits: [] });
			
			log.warning('[GitHub] Response ' + ghr.statusCode + ' for ' + repoPath);
		}
	});
	
	ghRequest.end();
};

var handleGet = function(request, response) {
	if(!request.session.history)
		request.session.history = [];
	
	response.render('index', { posted: { Branch: 'master'}, commits: []});
};

var server = express.createServer(
	express.bodyParser(),
	express.cookieParser()
);
	
server.configure('development', function() {
	log.level = Log.INFO;

	server.use(express.session({
		secret: 'GHCMNNFTW'
		// , store: CookieStore({secret: 'GHCMNNFTW'})
	}));
	server.use(express.logger());
	server.use(express.static(__dirname + '/public'));
});
	
server.configure('production', function() {
	log.level = Log.WARNING;
	log.stream = fs.createWriteStream('log/GitHubCommitMonitor.log', { flags: 'a' });

	server.use(express.session({
		secret: 'GHCMNNFTW',
		store: MongoDBStore({
			url: process.env['DUOSTACK_DB_MONGODB'],
			maxAge: 300000
		})
	}));
	server.use(express.gzip());
	server.use(assetManager({ 
		css: { 
			dataType: 'css',
			path: __dirname + '/public/',
			files: ['style.css'],
			route: /\/style.css/
		}
	}));
	server.use(express.staticProvider(__dirname + '/public', {maxAge: 86400000}));
});
	
server.error(function(err, req, res){
	log.error(err);
	
	res.render('index');
});

server.dynamicHelpers({ 
	flashMessages: function(request) { 
		return function() {
			return request.flash('error');
		};
	},
	title: function(request) { return request.title || 'GitHub Commit Monitor'; },
	history: function(request) { return request.session.history || []; }
});
server.set('views', __dirname + '/views');
server.set('view engine', 'jade');

server.get('/', handleGet);
server.post('/', handlePost);

server.listen(8124);

log.info('Server running at http://127.0.0.1:8124/');