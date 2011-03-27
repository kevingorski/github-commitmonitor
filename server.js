var http = require('http'),
	express = require('express'),
	Log = require('log'),
	log = new Log(),
	gravatar = require('gravatar'),
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
	history: function(req) { return req.session ? req.session.history || [] : []; },
	getGravatar: function() { 
		return function(email) {
			return gravatar.url(email, {s:'50', d:'mm', r:'pg'});
		};
	},
	reformatDate: function() {
		function pad(number) {
			return number > 9 ? number : '0' + number;
		};
		
		return function(dateString) {
			var date = new Date(dateString);
			
			return date.getFullYear() + '-' + pad(date.getMonth()) + '-' + pad(date.getDate()) + ' ' + 
				pad(date.getHours()) + ':' + pad(date.getMinutes());
		};
	}
});


// Routing
server.get('/', commits.get);
server.post('/', commits.post);
server.get('/:UserName/:Repository/:Branch?', commits.detail);


server.listen(8124);

log.info('Server running at http://127.0.0.1:8124/');