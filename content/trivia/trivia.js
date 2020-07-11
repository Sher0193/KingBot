const Scoreboard = require('../scoreboard/scoreboard.js');
const utils = require('../../utils/utils.js');

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

    constructor(channel, scoreboard) {
        this.channel = channel;
        this.scoreboard = scoreboard;
    }


    getId() {
        return this.channel.id;
    }

    printScores(end, msg) {
        if (!this.active) {
            return;
        }
        if (msg !== "") {
            this.channel.send(this.scoreboard.buildScoreboard(end, msg));
        } else {
            this.channel.send(this.scoreboard.buildScoreboard(end));
        }
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
        this.list = require("../../data/questions.json");
        if (this.list !== null) {
            this.channel.send("**Beginning Trivia Game!**\n```Answers accepted after the word \"go\"...```");
        } else {
            this.active = false;
            this.channel.send("```No active question list found...```");
        }
    }

    run() {
        var trivia = this;
        setTimeout(function() {
            trivia.askQuestion();
        }, 3000);
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
        setTimeout(function() {
            trivia.startAcceptAnswers();
        }, 30000);
    }

    startAcceptAnswers() {
        if (!this.active || this.pause) {
            return;
        }
        var trivia = this;
        this.acceptAnswers = true;
        this.channel.send("**GO!!!**");
        setTimeout(function() {
            trivia.revealAnswer();
        }, 10000);
    }

    revealAnswer() {
        if (!this.active || this.pause) {
            return;
        }
        var trivia = this;
        this.acceptAnswers = false;
        var update = "The correct answer was: **" + this.list[this.currentQuestion]["answer"] + "**";
        var victors = "";
        if (this.guessers !== null) {
            victors += ("\nCorrect answers from: " + this.guessersToString() + ".");
        }
        this.channel.send(update);
        this.addScores();
        this.guessers = null;
        this.currentQuestion++;
        if (this.currentQuestion >= this.list.length) {
            this.end();
        } else {
            this.printScores(false, victors);
            if (TIMER_RESUME) {
                setTimeout(function() {
                    trivia.askQuestion()
                }, 30000);
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
                if (this.checkAns(guess, a)) {
                    this.addCorrect(guesser);
                    break;
                }
            }
        }
    }

    checkAns(guess, answer) {

        guess = this.formatAns(guess);
        answer = this.formatAns(answer);

        for (let i = 0; i < guess.length; i++) {
            for (let j = i; j < guess.length; j++) {
                let toTest = guess.slice(i, j);
                if (utils.levRatio(toTest, answer) <= 0.2)
                    return true;
            }
        }
    }

    formatAns(ans) {

        ans = ans.toLowerCase();

        let removes = ["the ", "a ", "an ", "these ", "those "];
        for (let i = 0; i < removes.length; i++) {
            let index = ans.search(removes[i]);
            if (index > 0)
                continue;
            let count = removes[i].length;
            if (index >= 0) {
                ans = ans.slice(0, index) + " " + ans.slice(index + count);
            }
        }

        ans = ans.trim();
        ans = ans.replace("  ", " ");
        return ans;
    }

    checkMultiple(guess, answer) {
        return (utils.levDist(guess, answer) <= 1 ||
            (guess.length < 3 && guess.charAt(0) === answer.charAt(0)) ||
            utils.levDist(guess, answer.substring(4)) <= 1);
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

module.exports = Trivia;