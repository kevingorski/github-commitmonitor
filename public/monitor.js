var GHCMonitor = (function() {
	var lastCommitId,
		pendingCommits = 0,
		userName,
		repository,
		branch,
		repoPath,
		fakeCommits = [],
		pollingHandle;
	
	function handleNewCommits(newCommits) {
		var content = '';
		
		if(pendingCommits == 0) $('#MarkAllRead').show();
		
		pendingCommits += newCommits.length;
		lastCommitId = newCommits[0].id;
		
		$('h1').text(
			document.title = '(' + pendingCommits + ') GitHub Commit Monitor: ' + repoPath);
		
		$(newCommits).each(function() {
			content += '<li data-commit-id="' + this.id + '" class="Unread">'
				+ '<a href="http://github.com' + this.url + '">'
					+ this.committed_date
					+ '</a> - ' + this.author.name + ' : ' + this.message;
		});
		
		$('#Commits').prepend(content);
		
		markUpdated();
	}
	
	function markUpdated() {
		$('#LastUpdated').text('Last updated at ' + new Date().toLocaleTimeString());
	}
	
	function queryCommitLog() {
		if(fakeCommits.length) {
			var tempCommitId = lastCommitId;
			
			handleNewCommits(fakeCommits);
			
			fakeCommits = [];
			lastCommitId = tempCommitId;
			
			return;
		}
		
		var url = 'http://github.com/api/v2/json/commits/list/' + repoPath;
			
		$.ajax({
			url: url, 
			dataType: 'jsonp',
			success: function(data) {
				var commits = data.commits,
					index = 0,
					newCommits;

				while(index < commits.length && commits[index].id != lastCommitId) index++;

				if(!index) {
					markUpdated();
					
					return;
				}
				
				handleNewCommits(commits.slice(0, index));
			}
		});
	}
	
	function markAllRead() {
		pendingCommits = 0;
		
		$('h1').text(
			document.title = 'GitHub Commit Monitor: ' + repoPath);

		$('#Commits li.Unread').removeClass('Unread');
		
		$('#MarkAllRead').hide();
	}
	
	function ISODateString(d){
		function pad(n){return n<10 ? '0'+n : n}
		
		return d.getUTCFullYear()+'-'
			+ pad(d.getUTCMonth()+1)+'-'
			+ pad(d.getUTCDate())+'T'
			+ pad(d.getUTCHours())+':'
			+ pad(d.getUTCMinutes())+':'
			+ pad(d.getUTCSeconds())+'-00:00';
	}
	
	function generateFakeCommit() {
		// From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
		var id = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		
		fakeCommits.push({
			"parents": [{
				"id": "e3be659a93ce0de359dd3e5c3b3b42ab53029065"
			}],
			"author": {
				"name": "Fake User",
				"login": "fakelogin",
				"email": "fake@email.com"
			},
			"url": "/" + userName + "/" + repository + "/commit/" + id,
			"id": id,
			"committed_date": ISODateString(new Date()),
			"authored_date": ISODateString(new Date()),
			"message": "Fake commit",
			"tree": "a6a09ebb4ca4b1461a0ce9ee1a5b2aefe0045d5f",
			"committer": {
				"name": "Fake User",
				"login": "fakelogin",
				"email": "fake@email.com"
			}
		});
		
		queryCommitLog();
	}
	
	return {
		init : function() {
			var commitList = $('#Commits'),
				commitListItem = commitList.find('li:first');

			if(!commitListItem.length) return;

			lastCommitId = commitListItem.data('commit-id');
			userName = commitList.data('UserName');
			repository = commitList.data('Repository');
			branch = commitList.data('Branch');
			repoPath = userName + '/' + repository + '/' + branch
			
			$('#ListCommits').after(
				$('<input id="ShowTestCommit" type="submit" value="Show Test Commit" />')
					.click(function(event) {
						generateFakeCommit();
						
						event.preventDefault();
					}));
			
			$('#LastUpdated').after(
				$('<a id="MarkAllRead" href="#">Mark all read</a>')
					.click(function(event) {
						markAllRead();
						
						event.preventDefault();
					}).hide());

			pollingHandle = setInterval(queryCommitLog, 10 * 1000);
		}
	};
})();

$(function() {
	GHCMonitor.init();
});