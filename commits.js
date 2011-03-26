var http = require('http'),
	log;

exports.config = function(logger) {
	log = logger;
}

exports.get = function(req, res) {
	if(!req.session.history)
		req.session.history = [];
	
	res.render('index', { posted: { Branch: 'master'}, commits: []});
};

exports.post = function(req, res) {
	var posted = req.body;
	
	getCommits(
		req,
		res,
		posted.UserName, 
		posted.Repository, 
		posted.Branch);
};

exports.detail = function(req, res) {
	getCommits(
		req,
		res,
		req.params.UserName, 
		req.params.Repository, 
		req.params.Branch || 'master');
};


// Private Functionality
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