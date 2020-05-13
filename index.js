// Load up the discord.js library
const Discord = require("discord.js");
const fs = require('fs'); 

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const TIMER_RESUME = false;

class Trivia {
	
	active = false;
	acceptAnswers = false;
	pause = false;
	
	channel = null;
	
	list = null;
	currentQuestion = 0;
	
	guessers = null;
	
	channel = null;
	
	scoreboard = null;
	
	constructor(channel) {
		this.channel = channel;
		this.scoreboard = new Scoreboard(channel, null, null);
	}
	
		
	getId() {
		return this.channel.id;
	}
	
	printScores(end) {
		if (!this.active) {
			return;
		}
		this.scoreboard.printScores(end);
	}
	
	printHelp() {
		if (!this.active) {
			return;
		}
		var string = "Trivia Commands:\nEnd: !triviaend\nScores: !trivascores";
		this.channel.send("```" + string + "```");
	}
	
	start() {
		if (this.active) {
			return;
		}
		this.active = true;
		this.list = require("./questions.json");
		if (this.list !== null) {
			this.channel.send("**Beginning Trivia Game!**\n```Answers accepted after the word \"go\"...```");
			//this.run();
		} else {
			this.active = false;
			this.channel.send("```No active question list found...```");
		}
	}
	
	run() {
		var trivia = this;
		setTimeout(function(){trivia.askQuestion();}, 3000);
	}
	
	askQuestion() {
		if (!this.active || this.pause) {
			return;
		}
		var trivia = this;
		var cq = this.list[this.currentQuestion];
		var q = "**Question " + (this.currentQuestion + 1) + "**: " + cq["question"];
		var hint = "";
		if (cq["type"] === "multiple") { 
			hint += "```Hint! Only answer with the letter for the correct answer: eg \"B\" for option B).```";
		} else if (cq["type"] === "truth") {
			hint += "```Hint! Only answer with whether the question is true or false: eg \"true\" if the question is true.```";
		}
		this.channel.send(q + "\n" + hint);
		setTimeout(function(){trivia.startAcceptAnswers();}, 30000);
	}
	
	startAcceptAnswers() {
		if (!this.active || this.pause) {
			return;
		}
		var trivia = this;
		this.acceptAnswers = true;
		this.channel.send("**GO!!!**");
		setTimeout(function(){trivia.revealAnswer();}, 10000);
	}
	
	revealAnswer() {
		if (!this.active || this.pause) {
			return;
		}
		var trivia = this;
		this.acceptAnswers = false;
		var update = "```The correct answer was: \"" + this.list[this.currentQuestion]["answer"] + "\"";
		
		if (this.guessers !== null) {
			update += ("\nCorrect answers from: " + this.guessersToString() + "```");
		} else {
			update += "```";
		}
		this.channel.send(update);
		this.addScores();
		this.guessers = null;
		this.currentQuestion++;
		if (this.currentQuestion >= this.list.length) {
			this.end();
		} else {
			this.printScores();
			if (TIMER_RESUME) {
				setTimeout(function(){trivia.askQuestion()}, 30000);
			} else {
				this.pause = true;
				this.channel.send("Use ``!next`` to move on to the next question, or ``!triviaend`` to end the game...");
			}
		}
	}
	
	guessersToString() {
		var string = "";
		if (this.guessers !== null) {
			for (let i = 0; i < this.guessers.length; i++) {
				if (i > 0) {
					string += ", ";
				}
				string += this.guessers[i];
			}
		}
		return string;
	}
	
	processGuess(guesser, guess) {
		if (!this.active || !this.acceptAnswers) {
			return;
		}
		var cq = this.list[this.currentQuestion];
		var answers = cq["answers"];
		if (cq["type"] === "multiple") {
			if (this.checkMultiple(guess.toLowerCase(), cq["answer"].toLowerCase())) {
				this.addCorrect(guesser);
			}
		} else if (cq["type"] === "truth") {
			if (this.checkTruth(guess.toLowerCase(), cq["answer"].toLowerCase())) {
				this.addCorrect(guesser);
			}

		} else {
			for (let i = 0; i < answers.length; i++) {
				var a = answers[i];
				if (cq["type"] === "regular") {
					if (levDist(guess.toLowerCase(), a["answer"].toLowerCase()) <= 1) {
						this.addCorrect(guesser);
						break;
					}
				}
			}
		}
	}
	
	checkMultiple(guess, answer) {
		return (levDist(guess, answer) <= 1
					|| (guess.length < 3 && guess.charAt(0) === answer.charAt(0))
					|| levDist(guess, answer.substring(4)) <= 1);
	}
	
	checkTruth(guess, answer) {
		return (guess.charAt(0) === answer.charAt(0));
	}
	
	addCorrect(guesser) {
		if (!this.active) {
			return;
		}
		if (this.guessers !== null) {
			var found = false;
			for (let i = 0; i < this.guessers.length; i++) {
				if (this.guessers[i] === guesser) {
					found = true;
					break;
				}
			}
			if (!found) {
				this.guessers.push(guesser);
			}
		} else {
			this.guessers = [guesser];
		}			
	}
	
	addScores() {
		if (!this.active) {
			return;
		}
		if (this.guessers != null) {
			for (let i = 0; i < this.guessers.length; i++) {
				var guesser = this.guessers[i];
				this.scoreboard.addScore(guesser, 1);
			}
		}
	}
	
	end() {
		if (!this.active) {
			return;
		}
		this.printScores(true);
		this.users = new Array("default");
		this.scores = new Array("default");
		this.active = false;
		this.pause = false;
		this.acceptAnswers = false;
		this.currentQuestion = 0;
		this.list = null;
		this.scoreboard = null;
	}
	
	pauseGame() {
		this.pause = true;
	}
	
	resume() {
		if (this.pause || this.currentQuestion === 0) {
			this.pause = false;
			this.askQuestion();
		}
	}
	
	isActive() {
		return this.active;
	}
	
	getScoreboard() {
		return this.scoreboard;
	}
	
}

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
		fs.writeFile('sbsave.json', jsonSave, function (err) {
			if (err) throw err;
			//console.log('Saved!');
		}); 
	}
	
	loadScoreboards() {
		var boards = require("./sbsave.json");
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

const levDist = function(s, t) {
		var d = []; //2d matrix

		// Step 1
		var n = s.length;
		var m = t.length;

		if (n == 0) return m;
		if (m == 0) return n;

		//Create an array of arrays in javascript (a descending loop is quicker)
		for (var i = n; i >= 0; i--) d[i] = [];

		// Step 2
		for (var i = n; i >= 0; i--) d[i][0] = i;
		for (var j = m; j >= 0; j--) d[0][j] = j;

		// Step 3
		for (var i = 1; i <= n; i++) {
			var s_i = s.charAt(i - 1);

			// Step 4
			for (var j = 1; j <= m; j++) {

				//Check the jagged ld total so far
				if (i == j && d[i][j] > 4) return n;

				var t_j = t.charAt(j - 1);
				var cost = (s_i == t_j) ? 0 : 1; // Step 5

				//Calculate the minimum
				var mi = d[i - 1][j] + 1;
				var b = d[i][j - 1] + 1;
				var c = d[i - 1][j - 1] + cost;

				if (b < mi) mi = b;
				if (c < mi) mi = c;

				d[i][j] = mi; // Step 6

				//Damerau transposition
				if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
					d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
				}
			}
		}

		// Step 7
		return d[n][m];
	}
	
const trivia = new Trivia();
const th = new TriviaHandler();

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  th.loadScoreboards();
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  //client.user.setActivity(`King family bot.`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  if(th.getTriviaById(message.channel.id) !== null
	&& th.getTriviaById(message.channel.id).isActive()) {
		th.getTriviaById(message.channel.id).processGuess(message.member.user.username, message.content);
  }
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command.includes("trivia")) {
	if (message.member === null) {
		return;
	}
	if (command === "trivia") {
		th.addTrivia(message.channel);
		return;
	}
	if (th.getTriviaById(message.channel.id) === null) {
		return;
	}
	if (command === "triviascores") {
		th.getTriviaById(message.channel.id).printScores();
	}
	if (command === "triviahelp") {
		th.getTriviaById(message.channel.id).printHelp();
	}
	if (command === "triviaend") {
		th.removeTrivia(message.channel.id);
	}
	if (command === "triviapause") {
		message.channel.send("Manual pausing temporarily disabled due to instability. Trivia games will automatically pause between questions.");
		//th.getTriviaById(message.channel.id).pauseGame();
	}
	if (command === "triviaresume") {
		th.getTriviaById(message.channel.id).resume();
	}
  }

  if (command === "about") {
  	message.channel.send("KingBot is created by Dylan Sherwood, based on template by Eslachance.");
  }
  
  if (command === "scoreboard") {
	if (message.member === null) {
			return;
	}
	if (args[0] === "create") {
		if (th.getTriviaById(message.channel.id) !== null) {
			message.channel.send("Scoreboard in use by an active Trivia game. Please stop the trivia game with !triviaend first to add a new scoreboard.");
			return;
		}
		th.addScoreboard(message.channel);
		if (th.getScoreboardById(message.channel.id) !== null) {
				message.channel.send("Created scoreboard for channel " + message.channel.name);
				th.saveScoreboards();
		} else {
				message.channel.send("Could not create scoreboard.");
		}
	} else if (args[0] === "clear") {
		if (th.getTriviaById(message.channel.id) !== null) {
			message.channel.send("Scoreboard in use by an active Trivia game. Please stop the trivia game with !triviaend to remove the current scoreboard.");
			return;
		}
		if (th.removeScoreboard(message.channel.id)) {
			message.channel.send("Removed scoreboard for channel " + message.channel.name);
			th.saveScoreboards();
		} else {
			message.channel.send("Could not remove scoreboard.");
		}
	} else {
		if (th.getTriviaById(message.channel.id) !== null) {
			th.getTriviaById(message.channel.id).getScoreboard().printScores();
		} else {
			var scoreboard = th.getScoreboardById(message.channel.id);
			if (scoreboard !== null) {
				scoreboard.printScores();
			} else {
				message.channel.send("Could not find scoreboard.");
			}
		}
	}
  }
  
  if(command === "lev") {
	var dist = levDist(args[0], args[1]);
	message.channel.send("The Levenshtein Distance between " + args[0] + " and " + args[1] + " is " + dist + ".");
  }
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
  if (command === "save") {
	th.saveScoreboards();
	message.channel.send("Saved all scoreboards for all channels.");
  }
  
  if (command === "next") {
		if (th.getTriviaById(message.channel.id) !== null) {
			th.getTriviaById(message.channel.id).resume();
		}
  }

  if (command === "help") {
	helpString = "Something went wrong. Contact admin.";
	if (args[0] === undefined) {
		args.push("default");
	}
	switch (args[0]) {
		case "help": 
			helpString = "Use \"!help\" to view an explanation for the various functions of Kingbot. Use \"!help [command]\" to view an explanation for that command.";
			break;
		case "score": 
			helpString = "**BASICS**\nUse \"!score\" to add points for a list of users to the channel's scoreboard. A scoreboard must have been created for the channel with \"!scoreboard create\".\n\"!score\" requires a comma-separated list of names, such as \"!score Crosby, Stills, Nash, Young\".\n**MULTIPLE POINT VALUES**\nBy default, \"!score\" will award one point. In addition, \"!half\" will award 0.5 points, \"!penalty\" will award -1 point, and \"!penaltyhalf\" will award -0.5 points.\nYou may precede a list of names with a number and colon to award that value to the following list, such as \"!score 5: Crosby, Stills, Nash, Young\", which will award 5 points. You may mix point values in a single command, such as \"!score 5: Crosby, Stills 10: Nash, Young\", which will award 5 to Crosby and Stills, then 10 to Nash and Young.";
			break;
		case "scoreboard":
			helpString = "**BASICS**\n\"!scoreboard\" displays the current score for this channel's scoreboard.\n**CREATING A SCOREBOARD FOR THE CHANNEL**\nSimply use the command \"!scoreboard create\" to create a scoreboard. If one exists already, this command will overwrite the previous board.\n**CLEARING THE SCOREBOARD**\nThe current scoreboard may be erased from this channel with \"!scoreboard clear\".";
		case "say":
			helpString = "The \"!say\" command will make KingBot echo a given statement, such as \"!say Hello, I'm KingBot!\". If you have given KingBot sufficient permissions, the original command will be deleted, leaving only KingBot's echo.";
			break;
		case "ping":
			helpString = "KingBot will measure and output the time it takes in milliseconds to receive a response from its server.";
			break;
		case "lev":
			helpString = "A debugging command. Measures the morphological distance between two words using the Levenschtein Distance algorithm.";
			break;
		case "trivia":
			helpString = "Begins a Trivia game. Contestants must wait for KingBot to say \"GO\" after delivering a question before submitting their answers. A trivia game will override the channel's scoreboard. The command \"!next\" must be used between questions to advance to the next one.\nGenerally unstable WIP.";
			break;
		case "about":
			helpString = "Outputs information about the bot.";
			break;
		default: helpString = "**COMMANDS** ```!scoreboard\n!score\n!trivia\n!say\n!lev\n!ping\n!help\n!about``` Type \"!help [command]\" to learn more about a command, eg \"!help help\".";
	}
	message.channel.send(helpString);
  }
  
  if (command === "score" || command === "half" || command === "penalty" || command === "penaltyhalf") {
	if (args[0] === undefined) {
		message.channel.send("Please enter a list of names separated by commas e.g. \"!score Crosby, Stills, Nash, Young\"");
		return;
	} else {
		arrs = new Array();
		amts = new Array();
		for (let i = args.length - 1; i >= 0; i--) {
			if (args[i].charAt(args[i].length - 1) === ":") {
				amtstring = args[i].slice(0, -1);
				if (!isNaN(amtstring) && amtstring !== "") {
					amts.push(parseFloat(amtstring));
					arrs.push(args.splice(i + 1, args.length - i));
					args.splice(i, 1);
				} else {
					return;
				}
			} else if (i === 0) {
				amts.push(1);
				arrs.push(args);
			}
		}
	}
	var scoreboard = th.getScoreboardById(message.channel.id);
	var success = "";
	for (let i = 0; i < arrs.length; i++) {
		var amt = amts[i];
		amt = command === "penalty" ? amt * -1 : command === "half" ? amt * 0.5 : command === "penaltyhalf" ? amt * -0.5 : amt;
		newargs = arrs[i].join(" ").split(", ");
		var points = amt === 1 ? "point" : "points";
		success += "Added " + amt + " " + points + " for ";
		for (let i = 0; i < newargs.length; i++) {
			success += newargs[i];
			if (i < newargs.length - 1) {
				success += ", ";
			} else {
				success += ".\n";
			}
		}
		if (th.getTriviaById(message.channel.id) !== null) {
			th.getTriviaById(message.channel.id).getScoreboard().addScores(newargs, amt);
		} else {
			if (scoreboard !== null) {		
				scoreboard.addScores(newargs, amt);
				th.saveScoreboards();

			} else {
				message.channel.send("Could not find scoreboard.");
				return;
			}
		}

	}
	if (success !== "") {
		message.channel.send(success);	
	}
	if (th.getTriviaById(message.channel.id) !== null) {
		th.getTriviaById(message.channel.id).getScoreboard().printScores();
	} else {
		scoreboard.printScores();
	}

	/*var amt = 1;
	if (!isNaN(args[0])) {
		amt = parseFloat(args.shift());
	}
	amt = command === "penalty" ? amt * -1 : command === "half" ? amt * 0.5 : command === "penaltyhalf" ? amt * -0.5 : amt;
	newargs = args.join(" ").split(", ");
	var points = amt === 1 ? "point" : "points";
	var success = "Added " + amt + " " + points + " for ";
	for (let i = 0; i < newargs.length; i++) {
		success += newargs[i];
		if (i < newargs.length - 1) {
			success += ", ";
		} else {
			success += ".";
		}
	}
	if (th.getTriviaById(message.channel.id) !== null) {
		th.getTriviaById(message.channel.id).getScoreboard().addScores(newargs, amt);
		message.channel.send(success);
		th.getTriviaById(message.channel.id).getScoreboard().printScores();
	} else {
		var scoreboard = th.getScoreboardById(message.channel.id);
		if (scoreboard !== null) {		
			scoreboard.addScores(newargs, amt);
			message.channel.send(success);
			scoreboard.printScores();
			th.saveScoreboards();

		} else {
			message.channel.send("Could not find scoreboard.");
		}
	}*/
  }
  
  /*if(command === "penalty" || command === "penaltyhalf") {
	var amt = command === "penalty" ? 1 : 0.5;
	if (args[0] === undefined) {
		message.channel.send("Please enter a list of names separated by commas e.g. \"!score Crosby, Stills, Nash, Young\"");
		return;
	}
	newargs = args.join(" ").split(", ");
	if (th.getTriviaById(message.channel.id) !== null) {
		th.getTriviaById(message.channel.id).getScoreboard().removeScores(newargs, amt);
		th.getTriviaById(message.channel.id).getScoreboard().printScores();
	} else {
		var scoreboard = th.getScoreboardById(message.channel.id);
		if (scoreboard !== null) {		
			scoreboard.removeScores(newargs, amt);
			scoreboard.printScores();

		} else {
			message.channel.send("Could not find scoreboard.");
		}
	}
  }*/
  
  /*if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  
  if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    
    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }*/
});

client.login(config.token);
