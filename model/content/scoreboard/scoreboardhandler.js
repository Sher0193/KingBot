const Scoreboard = require('../scoreboard/scoreboard.js');
const fs = require('fs');

class ScoreboardHandler {
    scoreboards = new Array();

    constructor() {}

    getScoreboardById(id) {
        for (let i = 0; i < this.scoreboards.length; i++) {
            if (this.scoreboards[i].getId() === id) {
                return this.scoreboards[i];
            }
        }
        return null;
    }

    addScoreboard(channel) {
        var id = channel;
        var existing = this.getScoreboardById(id);
        if (existing !== null) {
            this.removeScoreboard(existing.getId());
        }
        this.scoreboards.push(new Scoreboard(id, null, null));
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
            }
        }
        jsonSave += "]";
        fs.writeFile('data/sbsave.json', jsonSave, function(err) {
            if (err) throw err;
            //console.log('Saved!');
        });
    }

    loadScoreboards() {
        var boards = require("../../../data/sbsave.json");
        var count = 0;

        for (let i = 0; i < boards.length; i++) {
            var channel = boards[i]["channel"];
            if (channel === null) {
                continue;
            }
            var sb = new Scoreboard(boards[i]["channel"], boards[i]["scores"], boards[i]["users"]);
            if (this.getScoreboardById(sb.getId()) === null) {
                this.scoreboards.push(sb);
                count++;
            }
        }
        if (count > 0) {
            console.log("Loaded " + count + " scoreboards.");
        }
    }
}

module.exports = ScoreboardHandler;
