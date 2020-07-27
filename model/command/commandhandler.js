const Discord = require("discord.js");

const TriviaHandler = require('../content/trivia/triviahandler.js');
const ScoreboardHandler = require('../content/scoreboard/scoreboardhandler.js');
const utils = require('../../utils/utils.js');

const th = new TriviaHandler();
const sh = new ScoreboardHandler();

const handleUnprefixedCommand = async function(message) {
    if (th.getTriviaById(message.channel.id) !== null &&
        th.getTriviaById(message.channel.id).isActive()) {
        th.getTriviaById(message.channel.id).processGuess(message.author.toString(), message.content);
    }
}

const handleCommand = async function(message, command, args, client) {

    let member = message.member;
    let channel = message.channel;

    /************************************ MAJOR COMMANDS ********************************/

    // Handling for all "trivia" commands
    if (command.includes("trivia")) return trivia(command, args, channel, member);

    if (command === "scoreboard") return scoreboard(args, channel, member);

    if (command === "roll") return roll(args, channel);

    if (command === "ping") return ping(message, channel, client);

    if (command === "sw" || command === "stopwatch") return stopwatch(args, channel);

    if (command === "say") return say(message, args, channel);

    if (command === "uptime" || command === "up") return uptime(channel);

    if (command === "help" || command === "h") return help(args, channel);

    if (command === "score" || command === "half" || command === "penalty" || command === "penaltyhalf" || command === "sc") return score(command, args, channel, member);


    /************************************ MINOR COMMANDS ********************************/

    if (command === "lev" || command === "levenshtein") {
        var dist = utils.levRatio(args[0], args[1]);
        channel.send("The Levenshtein Distance between " + args[0] + " and " + args[1] + " is " + dist + ".");
    }

    if (command === "next") {
        if (member === null) {
            return;
        }
        if (th.getTriviaById(channel.id) !== null) {
            th.getTriviaById(channel.id).resume();
        }
    }

    if (command === "about") {
        channel.send("KingBot is created by Dylan Sherwood, based on template by Eslachance.");
    }

    if (command === "save") {
        sh.saveScoreboards();
        message.channel.send("Saved all scoreboards for all channels.");
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

          channel.send(exampleEmbed);    
    }*/
}

const trivia = function(command, args, channel, member) {
    if (member === null) {
        return;
    }
    if (command === "trivia") {
        if (sh.getScoreboardById(channel.id) !== null) {
            channel.send("Resetting scoreboard...");
        }
        sh.addScoreboard(channel.id);
        th.addTrivia(channel, sh.getScoreboardById(channel.id));
        return;
    }
    if (th.getTriviaById(channel.id) === null) {
        return;
    }
    if (command === "triviascores") {
        th.getTriviaById(channel.id).printScores();
    }
    if (command === "triviahelp") {
        th.getTriviaById(channel.id).printHelp();
    }
    if (command === "triviaend") {
        th.removeTrivia(channel.id);
        sh.removeScoreboard(channel.id)
    }
    if (command === "triviapause") {
        channel.send("Manual pausing temporarily disabled due to instability. Trivia games will automatically pause between questions.");
        //th.getTriviaById(channel.id).pauseGame();
    }
    if (command === "triviaresume") {
        th.getTriviaById(channel.id).resume();
    }
}

const scoreboard = function(args, channel, member) {
    if (member === null) {
        return;
    }
    if (args[0] === "create") {
        if (th.getTriviaById(channel.id) !== null) {
            channel.send("Scoreboard in use by an active Trivia game. Please stop the trivia game with !triviaend first to add a new scoreboard.");
            return;
        }
        sh.addScoreboard(channel.id);
        if (sh.getScoreboardById(channel.id) !== null) {
            channel.send("Created scoreboard for channel " + channel.name);
            sh.saveScoreboards();
        } else {
            channel.send("Could not create scoreboard.");
        }
    } else if (args[0] === "clear") {
        if (th.getTriviaById(channel.id) !== null) {
            channel.send("Scoreboard in use by an active Trivia game. Please stop the trivia game with !triviaend to remove the current scoreboard.");
            return;
        }
        if (sh.removeScoreboard(channel.id)) {
            channel.send("Removed scoreboard for channel " + channel.name);
            sh.saveScoreboards();
        } else {
            channel.send("Could not remove scoreboard.");
        }
    } else {
        var scoreboard = sh.getScoreboardById(channel.id);
        if (scoreboard !== null) {
            channel.send(scoreboard.buildScoreboard());
        } else {
            channel.send("Could not find scoreboard.");
        }
    }
}

const roll = function(args, channel) {
    if (args[0] !== undefined && (args[0].toLowerCase() === "s" || args[0].toLowerCase() === "scattergories")) {
        let valid_scattegory_letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T", "W"];
        let roll = Math.floor(Math.random() * valid_scattegory_letters.length);
        channel.send(":capital_abcd: **" + valid_scattegory_letters[roll] + "**");
        return;
    }
    let high = 6,
        low = 1;
    if (!isNaN(args[0])) {
        let arg0 = parseInt(args[0]);
        if (!isNaN(args[1])) {
            let arg1 = parseInt(args[1]);
            high = arg0 > arg1 ? arg0 : arg1;
            low = arg0 < arg1 ? arg0 : arg1;
        } else {
            high = arg0 > low ? arg0 : low;
            low = arg0 < low ? arg0 : low;
        }
    }
    let range = Math.floor((Math.random() * (high - low + 1)));
    let roll = range + low;
    channel.send("(" + low + " -> " + high + ") :game_die: " + roll);
}

const ping = async function(message, channel, client) {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-tripiiiiiiiiuuuuu)
    const m = await channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
}

const stopwatch = async function(args, channel) {
    if (isNaN(args[0])) return;
    if (args[0] % 5 != 0 || args[0] < 0) {
        channel.send("Time must be a denomination of 5" + (args[0] < 0 ? " (and greater than 0)." : "."));
        return;
    }
    if (parseInt(args[0]) > 60) {
        channel.send("Please keep time under 1 minute (60 seconds)");
        return;
    }
    var time = parseInt(args[0]);
    var delay;
    const m = await channel.send(time + " seconds remain.");
    for (delay = 5000; time > 0; time -= 5, delay += 5000) {
        setTimeout(function() {
            time -= 5;
            m.edit(time + " seconds remain.");
        }, delay);
    }
    time = parseInt(args[0]);
}

const say = function(message, args, channel) {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o => {});
    // And we get the bot to say the thing: 
    channel.send(sayMessage);
}

const uptime = function(channel) {
    let curTime = new Date().getTime();
    let uptime = curTime - launchTime;

    let days = Math.floor(uptime / 86400000);
    uptime %= 86400000;

    let hours = Math.floor(uptime / 3600000);
    uptime %= 3600000;

    let minutes = Math.floor(uptime / 60000);

    //TODO: format method in utils
    channel.send("Kingbot has been online for " + (days > 0 ? (days + " day" + (days === 1 ? "" : "s") + ", ") : "") + (hours > 0 ? (hours + " hour" + (hours === 1 ? "" : "s") + ", ") : "") + minutes + " minute" + (minutes === 1 ? ("") : "s") + ".");
}

const help = function(args, channel) {
    let helpString = "Something went wrong. Contact admin.";
    let commandList = "";
    let list = require("../../data/help.json");
    let config = require("../../config.json");
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
            channel.send(scoreEmbed);
            return;
        }
    }
    channel.send(helpString);
}

const score = function(command, args, channel, member) {
    if (member === null) {
        return;
    }
    if (args[0] === undefined) {
        channel.send("Please enter a list of names separated by commas e.g. \"!score Crosby, Stills, Nash, Young\"");
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
    var scoreboard = sh.getScoreboardById(channel.id);
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
            channel.send("Could not find scoreboard.");
            return;
        }

    }
    if (success !== "") {
        channel.send(scoreboard.buildScoreboard(false, success));
    }
}

exports.handleUnprefixedCommand = handleUnprefixedCommand;
exports.handleCommand = handleCommand;
exports.scoreboardHandler = sh;
