var GHCMonitor = (function() {
	var lastCommitId,
		userName,
		repository,
		branch,
		pollingHandle;
	
	function queryCommitLog() {
		var url = 'http://github.com/api/v2/json/commits/list/' + userName + '/' + repository + '/' + branch
		$.ajax({
			url: url, 
			dataType: 'jsonp',
			success: function(data) {
				var index = data.commits.indexOf(lastCommitId),
					newCommits;

				if(!index) return;
				
				newCommits = data.commits.slice(0, index);
				
				lastCommitId = newCommits[0].id;
				
				// TODO: Do something with newCommits
			}
		});
	}
	
	return {
		init : function() {
			var commitList = $('#commits'),
				commitListItem = commitList.find('li:first');

			if(!commitListItem.length) return;

			lastCommitId = commitListItem.data('commit-id');
			userName = commitList.data('UserName');
			repository = commitList.data('Repository');
			branch = commitList.data('Branch');

			pollingHandle = setInterval(queryCommitLog, 10 * 1000);
		}
	};
})();

$(function() {
	GHCMonitor.init();
});