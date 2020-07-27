class Group {

    groups = new Array();

    channel = null;

    constructor(channel, groups) {
        if (groups != null) {
            this.groups = groups;
        }
        this.channel = channel;
    }

    createArray(length) {
        this.groups = new Array(length || 0, i = length);

        if (arguments.length > 1) {
            var args = Array.prototype.slice.call(arguments, 1);
            while (i--) this.groups[length - 1 - i] = createArray.apply(this, args);
        }
        return this.groups;
    }

    getId() {
        return this.channel.id;
    }

    printGroups() {}

    groupsToString(end) {}

    toJson() {
        return {
            scores: this.scores,
            users: this.users,
            channel: this.channel
        };
    }
}

module.exports = Group;