const utils = require('./utils/utils.js');
const TriviaHandler = require('./content/trivia/triviahandler.js');
const ScoreboardHandler = require('./content/scoreboard/scoreboardhandler.js');

// Set launch time for uptime calc
const launchTime = new Date().getTime();

// Load up the discord.js library
const Discord = require("discord.js");

// Discord Client
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

if (config.daemon) {
    const daemonizeProcess = require('daemonize-process');
    daemonizeProcess();
}

const th = new TriviaHandler();
const sh = new ScoreboardHandler();

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    sh.loadScoreboards();
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user.setActivity(`!help`);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    //client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    //client.user.setActivity(`Serving ${client.guilds.size} servers`);
});


client.on("message", async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    if (th.getTriviaById(message.channel.id) !== null &&
        th.getTriviaById(message.channel.id).isActive()) {
        th.getTriviaById(message.channel.id).processGuess(message.author.toString(), message.content);
    }

    // Also good practice to ignore any message that does not start with our prefix, 
    // which is set in the configuration file.
    if (message.content.indexOf(config.prefix) !== 0) return;

    // Here we separate our "command" name, and our "arguments" for the command. 
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Handling for all "trivia" commands
    if (command.includes("trivia")) {
        if (message.member === null) {
            return;
        }
        if (command === "trivia") {
            if (sh.getScoreboardById(message.channel.id) !== null) {
                message.channel.send("Resetting scoreboard...");
            }
            sh.addScoreboard(message.channel.id);
            th.addTrivia(message.channel, sh.getScoreboardById(message.channel.id));
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
            sh.removeScoreboard(message.channel.id)
        }
        if (command === "triviapause") {
            message.channel.send("Manual pausing temporarily disabled due to instability. Trivia games will automatically pause between questions.");
            //th.getTriviaById(message.channel.id).pauseGame();
        }
        if (command === "triviaresume") {
            th.getTriviaById(message.channel.id).resume();
        }
    }

    if (command === "next") {
        if (th.getTriviaById(message.channel.id) !== null) {
            th.getTriviaById(message.channel.id).resume();
        }
    }

    if (command === "about") {
        message.channel.send("KingBot is created by Dylan Sherwood, based on template by Eslachance.");
    }


    //Left In As Convenient Embed Example
    /*if (command === "embed") {
    
      const exampleEmbed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('Some title')
          .setURL('https://discord.js.org/')
          .setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
          .setDescription('Some description here')
          .setThumbnail('https://i.imgur.com/wSTFkRM.png')
          .addFields(
              { name: 'Regular field title', value: 'Some value here' },
              { name: '\u200B', value: '\u200B' },
              { name: 'Inline field title', value: 'Some value here', inline: true },
              { name: 'Inline field title', value: 'Some value here', inline: true },
          )
          .addField('Inline field title', 'Some value here', true)
          .setImage('https://i.imgur.com/wSTFkRM.png')
          .setTimestamp()
          .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');

          message.channel.send(exampleEmbed);    
    }*/

    if (command === "scoreboard") {
        if (message.member === null) {
            return;
        }
        if (args[0] === "create") {
            if (th.getTriviaById(message.channel.id) !== null) {
                message.channel.send("Scoreboard in use by an active Trivia game. Please stop the trivia game with !triviaend first to add a new scoreboard.");
                return;
            }
            sh.addScoreboard(message.channel.id);
            if (sh.getScoreboardById(message.channel.id) !== null) {
                message.channel.send("Created scoreboard for channel " + message.channel.name);
                sh.saveScoreboards();
            } else {
                message.channel.send("Could not create scoreboard.");
            }
        } else if (args[0] === "clear") {
            if (th.getTriviaById(message.channel.id) !== null) {
                message.channel.send("Scoreboard in use by an active Trivia game. Please stop the trivia game with !triviaend to remove the current scoreboard.");
                return;
            }
            if (sh.removeScoreboard(message.channel.id)) {
                message.channel.send("Removed scoreboard for channel " + message.channel.name);
                sh.saveScoreboards();
            } else {
                message.channel.send("Could not remove scoreboard.");
            }
        } else {
            var scoreboard = sh.getScoreboardById(message.channel.id);
            if (scoreboard !== null) {
                message.channel.send(scoreboard.buildScoreboard());
            } else {
                message.channel.send("Could not find scoreboard.");
            }
        }
    }

    if (command === "roll") {
        if (!isNaN(args[0])) {
            var num = Math.ceil((Math.random() * args[0]));
            message.channel.send("(1-" + args[0] + ") :game_die: " + num);
        } else {
            var num = Math.ceil((Math.random() * 6));
            message.channel.send("(1-6) :game_die: " + num);
        }
    }

    if (command === "lev" || command === "levenshtein") {
        var dist = utils.levRatio(args[0], args[1]);
        message.channel.send("The Levenshtein Distance between " + args[0] + " and " + args[1] + " is " + dist + ".");
    }

    if (command === "ping") {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-tripiiiiiiiiuuuuu)
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    }

    if (command === "sw" || command === "stopwatch") {
        if (isNaN(args[0])) return;
        if (args[0] % 5 != 0 || args[0] < 0) {
            message.channel.send("Time must be a denomination of 5" + (args[0] < 0 ? " (and greater than 0)." : "."));
            return;
        }
        if (parseInt(args[0]) > 60) {
            message.channel.send("Please keep time under 1 minute (60 seconds)");
            return;
        }
        var time = parseInt(args[0]);
        var delay;
        const m = await message.channel.send(time + " seconds remain.");
        for (delay = 5000; time > 0; time -= 5, delay += 5000) {
            setTimeout(function() {
                time -= 5;
                m.edit(time + " seconds remain.");
            }, delay);
        }
        time = parseInt(args[0]);
    }

    if (command === "say") {
        // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
        // To get the "message" itself we join the `args` back into a string with spaces: 
        const sayMessage = args.join(" ");
        // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
        message.delete().catch(O_o => {});
        // And we get the bot to say the thing: 
        message.channel.send(sayMessage);
    }

    if (command === "save") {
        sh.saveScoreboards();
        message.channel.send("Saved all scoreboards for all channels.");
    }

    if (command === "uptime" || command === "up") {
        let curTime = new Date().getTime();
        let uptime = curTime - launchTime;

        let days = Math.floor(uptime / 86400000);
        uptime %= 86400000;

        let hours = Math.floor(uptime / 3600000);
        uptime %= 3600000;

        let minutes = Math.floor(uptime / 60000);

        //TODO: format method in utils
        message.channel.send("Kingbot has been online for " + (days > 0 ? (days + " day" + (days === 1 ? "" : "s") + ", ") : "") + (hours > 0 ? (hours + " hour" + (hours === 1 ? "" : "s") + ", ") : "") + minutes + " minute" + (minutes === 1 ? ("") : "s") + ".");
    }

    if (command === "help" || command === "h") {
        let helpString = "Something went wrong. Contact admin.";
        let commandList = "";
        let list = require("./data/help.json");
        let i = 0;
        if (args[0] === undefined) {
            args.push("default");
        }
        if (list !== null) {
            for (i = 0; i < list.length; i++) {
                commandList += ("\n" + config.prefix + list[i]["command"]);
                if (args[0] === list[i]["command"]) {
                    helpString = list[i]["explanation"];
                    break;
                }
            }
            if (i >= list.length) {
                const scoreEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Commands")
                    .setDescription(commandList)
                    .setFooter('Type \"!help [command]\" to learn more about a command, eg \"!help help\".');
                var channel = this.channel;
                message.channel.send(scoreEmbed);
                return;
            }
        }
        message.channel.send(helpString);
    }

    if (command === "score" || command === "half" || command === "penalty" || command === "penaltyhalf" || command === "sc") {
        if (args[0] === undefined) {
            message.channel.send("Please enter a list of names separated by commas e.g. \"!score Crosby, Stills, Nash, Young\"");
            return;
        } else {
            arrs = new Array();
            amts = new Array();
            for (let i = args.length - 1; i >= 0; i--) {
                if (args[i].charAt(args[i].length - 1) === ":" || !isNaN(args[i])) { // add passed number to amts, number: is legacy
                    if (args[i].charAt(args[i].length - 1) == ":") {
                        amtstring = args[i].slice(0, -1);
                    } else {
                        amtstring = args[i];
                    }
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
        var scoreboard = sh.getScoreboardById(message.channel.id);
        var success = "";
        for (let i = 0; i < arrs.length; i++) {
            var amt = amts[i];
            amt = command === "penalty" ? amt * -1 : command === "half" ? amt * 0.5 : command === "penaltyhalf" ? amt * -0.5 : amt;
            newargs = arrs[i].join(" ").split(",");
            var points = amt === 1 ? "point" : "points";
            var next = "Added " + amt + " " + points + " for ";
            let j, k;
            for (j = 0, k = 0; j < newargs.length; j++) {
                if (newargs[j] === "")
                    continue;
                if (j != 0)
                    next += ", ";
                next += newargs[j].trim();
                k++;
            }
            if (k === 0)
                continue;
            next += ".\n";
            success += next;
            if (scoreboard !== null) {
                scoreboard.addScores(newargs, amt);
                sh.saveScoreboards();

            } else {
                message.channel.send("Could not find scoreboard.");
                return;
            }

        }
        if (success !== "") {
            message.channel.send(scoreboard.buildScoreboard(false, success));
        }
    }
});

client.login(config.token);