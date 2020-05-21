class Scoreboard {
	
	scores = new Array();
	users = new Array();
	
	channel = null;
	
	constructor(channel, scores, users) {
		if (scores !== null) {
			this.scores = scores;
		}
		if (users !== null) {
			this.users = users;
		}
		this.channel = channel;	
	}
	
	getId() {
		return this.channel.id;
	}
	
	printScores(end) {
		this.sort();
		if (this.channel != null) {
			var channel = this.channel;
			channel.send("```" + this.scoresToString(end) + "```");
		}
	}
	
	scoresToString(end) {
		var string = end ? "Final Score:\n" : "Current Score:\n";
		for (let i = 0; i < this.users.length; i++) {
			if (this.scores[i] > 0 && this.users[i] !== "") {
				string += this.users[i] + ": " + this.scores[i] + "\n";
			}
		}
		return string;
	}
	
	addScore(user, amt) {
		var found = false;
		for (let j = 0; j < this.users.length; j++) {
			if (this.users[j].toLowerCase() === user.toLowerCase()) {
				found = true;
				this.scores[j] = this.scores[j] + amt;
				break;
			}
		}
		if (!found) {
			this.users.push(user.charAt(0).toUpperCase() + user.slice(1).toLowerCase());
			this.scores.push(amt);
		}
	}
	
	addScores(users, amt) {
		for (let i = 0; i < users.length; i++) {
			this.addScore(users[i], amt);
		}
	}
	
	sort() {
		var len = this.scores.length;

		for (var i = 0; i < len; i++) {
			for (var j = 0; j < len - i - 1; j++) {
				if (this.scores[j] < this.scores[j + 1]) {
					// swap scores
					var tempScore = this.scores[j];
					this.scores[j] = this.scores[j + 1];
					this.scores[j + 1] = tempScore;
					// swap users
					var tempUser = this.users[j];
					this.users[j] = this.users[j + 1];
					this.users[j + 1] = tempUser;
				}
			}
		}
	}
	
	toJson() {
		return {
			scores: this.scores,
			users: this.users,
			channel: this.channel
		};
	}
}

module.exports = Scoreboard;
