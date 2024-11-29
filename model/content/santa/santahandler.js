const Santa = require('./santa.js');

class SantaHandler {
    santas = new Array();

    constructor() {}

    getSantaById(id) {
        for (let i = 0; i < this.santas.length; i++) {
            if (this.santas[i].getId() === id) {
                return this.santas[i];
            }
        }
        return null;
    }

    addSanta(channel) {
        var id = channel.id;
        var existing = this.getSantaById(id);
        if (existing !== null) {
            this.removeSanta(existing.getId());
        }
        var santa = new Santa(channel);
        this.santas.push(santa);
    }

    removeSanta(id) {
        for (let i = 0; i < this.santas.length; i++) {
            if (this.santas[i].getId() === id) {
                this.santas.splice(i, 1);
                return true;
            }
        }
        return false;
    }

}

module.exports = SantaHandler;