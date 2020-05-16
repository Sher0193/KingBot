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
		if (this.channel != null) {
			var channel = this.channel;
			channel.send("```" + this.scoresToString(end) + "```");
		}
	}
	
	scoresToString(end) {
		var string = end ? "Final Score:\n" : "Current Score:\n";
		for (let i = 0; i < this.users.length; i++) {
			if (this.scores[i] > 0) {
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
	
	toJson() {
		return {
			scores: this.scores,
			users: this.users,
			channel: this.channel
		};
	}
}

module.exports = Scoreboard;
