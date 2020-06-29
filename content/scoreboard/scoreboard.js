const Discord = require("discord.js");
const utils = require('../../utils/utils.js');

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
		return this.channel;
	}
	
	buildScoreboard(end, msg) {
		this.sort();
		if (this.channel != null) {
            const scoreEmbed = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle(end ? "Final Score:\n" : "Current Score:\n")
            .setDescription(this.scoresToString(end));
            if (msg !== undefined) {
                scoreEmbed.addField("Change:", msg, false);
            }
// 			var channel = this.channel;
// 			channel.send(scoreEmbed);
            return scoreEmbed;
		}
	}
	
	scoresToString(end) {
 		var string = "";
		for (let i = 0, j = 1; i < this.users.length; i++) {
			if (this.scores[i] > 0 && this.users[i] !== "") {
                if (i > 0 && this.scores[i] < this.scores[i - 1])
                    j = i + 1;
				string += (j === 1 ? ":first_place:" : j === 2 ? ":second_place:" : j === 3 ? ":third_place:" : ("*" + utils.ordinal(j) + "*")) + " **" + this.users[i] + "**: " + this.scores[i] + "\n";
			}
		}
		return string;
	}
	
	addScore(user, amt) {
		var found = false;
		var toTry = user.trim();
		for (let j = 0; j < this.users.length; j++) {
			if (toTry.toLowerCase() === this.users[j].toLowerCase()) {
				found = true;
				this.scores[j] = this.scores[j] + amt < 0 ? 0 : this.scores[j] + amt;
				break;
			}
		}
		if (!found) {
            if (toTry !== "" && amt > 0) {
                this.users.push((toTry.charAt(0).toUpperCase() + toTry.slice(1).toLowerCase()));
                this.scores.push(amt);
            }
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
