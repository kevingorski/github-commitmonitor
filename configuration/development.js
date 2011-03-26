var express = require('express'),
	Log = require('log');

exports.addConfiguration = function(server, log) {
	server.configure('development', function() {
		log.level = Log.INFO;

		server.use(express.session({
			secret: 'GHCMNNFTW'
		}));
		server.use(express.logger());
	});
};