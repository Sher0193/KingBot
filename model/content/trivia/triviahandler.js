const Scoreboard = require('../scoreboard/scoreboard.js');
const Trivia = require('./trivia.js');
const fs = require('fs');

class TriviaHandler {
    scoreboards = new Array();
    trivias = new Array();

    constructor() {}

    getTriviaById(id) {
        for (let i = 0; i < this.trivias.length; i++) {
            if (this.trivias[i].getId() === id) {
                return this.trivias[i];
            }
        }
        return null;
    }

    addTrivia(channel, scoreboard) {
        var id = channel.id;
        var existing = this.getTriviaById(id);
        if (existing !== null) {
            this.removeTrivia(existing.getId());
        }
        var trivia = new Trivia(channel, scoreboard);
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

}

module.exports = TriviaHandler;