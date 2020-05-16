const Scoreboard = require('../scoreboard/scoreboard.js');
const Trivia = require('./trivia.js');
const fs = require('fs'); 

class TriviaHandler {
	scoreboards = new Array();
	trivias = new Array();
	
	constructor() {
	}
	
	getTriviaById(id) {
		for (let i = 0; i < this.trivias.length; i++) {
			if (this.trivias[i].getId() === id) {
				return this.trivias[i];
			}
		}
		return null;
	}
	
	addTrivia(channel) {
		var id = channel.id;
		var existing = this.getTriviaById(id);
		if (existing !== null) {
			this.removeTrivia(existing.getId());
		}
		existing = this.getScoreboardById(id);
		if (existing !== null) {
			channel.send("Resetting scoreboard...");
			this.removeScoreboard(existing.getId());
		}
		var trivia = new Trivia(channel);
		this.trivias.push(trivia);
		trivia.start();
	}
	
	removeTrivia(id) {
		for (let i = 0; i < this.trivias.length; i++) {
			if (this.trivias[i].getId() === id) {
				this.trivias[i].end();
				this.trivias.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	
	getScoreboardById(id) {
		for (let i = 0; i < this.scoreboards.length; i++) {
			if (this.scoreboards[i].getId() === id) {
				return this.scoreboards[i];
			}
		}
		return null;
	}
	
	addScoreboard(channel) {
		var id = channel.id;
		var existing = this.getScoreboardById(id);
		if (existing !== null) {
			this.removeScoreboard(existing.getId());
		}
		this.scoreboards.push(new Scoreboard(channel, null, null));
	}
	
	removeScoreboard(id) {
		for (let i = 0; i < this.scoreboards.length; i++) {
			if (this.scoreboards[i].getId() === id) {
				this.scoreboards.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	
	saveScoreboards() {
		var jsonSave = "[";
		for (let i = 0; i < this.scoreboards.length; i++) {
			jsonSave += JSON.stringify(this.scoreboards[i]);
			if (i != this.scoreboards.length - 1) {
				jsonSave += ",";
			} else {
				jsonSave += "]"
			}
		}
		fs.writeFile('data/sbsave.json', jsonSave, function (err) {
			if (err) throw err;
			//console.log('Saved!');
		}); 
	}
	
	loadScoreboards(client) {
		var boards = require("../../data/sbsave.json");
		var count = 0;
		
		for (let i = 0; i < boards.length; i++) {
			var channel = client.channels.get(boards[i]["channel"]["id"]);
			if (channel === null) {
				continue;
			}
			this.scoreboards.push(new Scoreboard(client.channels.get(boards[i]["channel"]["id"]), boards[i]["scores"], boards[i]["users"]));
			count++;
		}
		if (count > 0) {
			console.log("Loaded " + count + " scoreboards.");
		}
	}
}

module.exports = TriviaHandler;
