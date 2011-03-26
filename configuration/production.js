var express = require('express'),
	Log = require('log'),
	path = require('path'),
	assetManager = require('connect-assetmanager'),
	MongoStore = require('connect-mongo'),
	parseUrl = require('url').parse,
	fs = require('fs');

exports.addConfiguration = function(server, log) {
	server.configure('production', function() {
		var db_uri = parseUrl(process.env['DUOSTACK_DB_MONGODB']);
	
		log.level = Log.WARNING;
		log.stream = fs.createWriteStream('log/GitHubCommitMonitor.log', { flags: 'a' });

		server.use(express.session({
			secret: 'GHCMNNFTW',
			store: new MongoStore({
				db: db_uri.pathname.substr(1),
				host: db_uri.hostname,
				port: parseInt(db_uri.port),
				username: db_uri.auth.split(':')[0],
				password: db_uri.auth.split(':')[1]
			})
		}));
		server.use(assetManager({ 
			css: { 
				dataType: 'css',
				path: path.normalize(__dirname + '/../public/'),
				files: ['style.css'],
				route: /\/style.css/
			}
		}));
	});
};