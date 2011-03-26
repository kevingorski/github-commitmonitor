var http = require('http'),
	express = require('express'),
	Log = require('log'),
	log = new Log(),
	commits = require('./commits'),
	development = require('./configuration/development'),
	production = require('./configuration/production');


// Express Server
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

commits.config(log);


// Views and helpers
server.set('views', __dirname + '/views');
server.set('view engine', 'jade');

server.dynamicHelpers({ 
	flashMessages: function(req) { 
		return function() {
			return req.flash('error');
		};
	},
	title: function(req) { return req.title || 'GitHub Commit Monitor'; },
	history: function(req) { return req.session ? req.session.history || [] : []; }
});


// Routing
server.get('/', commits.get);
server.post('/', commits.post);
server.get('/:UserName/:Repository/:Branch?', commits.detail);


server.listen(8124);

log.info('Server running at http://127.0.0.1:8124/');