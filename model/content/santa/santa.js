const Discord = require("discord.js");

class Santa {

    channel = null;
    couples = []
    data = []

    constructor(channel) {
        this.channel = channel;
    }

    addCouple(couple) {
        this.couples.push(couple)
    }

    getId() {
        return this.channel.id;
    }

    // Initialize the data structure
    initialize() {
        this.data = this.couples.flatMap((couple, index) =>
            couple.map((person) => ({
                name: person,
                couple: index,
                assigned: null, // This will be assigned later
            }))
        );
    }

    // Check if the assignment is boring
    isBoringAssignment() {
        const assignedCouples = new Map();

        this.data.forEach((person) => {
            const personCouple = person.couple;
            const assignedCouple = this.data[person.assigned].couple;

            if (!assignedCouples.has(personCouple)) {
                assignedCouples.set(personCouple, new Set());
            }
            assignedCouples.get(personCouple).add(assignedCouple);
        });

        // Check if any couple is only assigned to a single other couple
        return Array.from(assignedCouples.values()).some((assigned) => assigned.size === 1);
    }

    // Shuffle array using Fisher-Yates algorithm
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Create a valid Secret Santa assignment
    createValidAssignment() {
        const numPeople = this.data.length;

        while (true) {
            // Generate a list of indices and shuffle them
            const indices = this.shuffle([...Array(numPeople).keys()]);

            // Assign each person according to the shuffled indices
            this.data.forEach((person, i) => {
                person.assigned = indices[i];
            });

            // Validate that no one is assigned their own partner and it’s not a boring assignment
            const isValid = this.data.every(
                (person) => person.couple !== this.data[person.assigned].couple
            );

            if (isValid && !this.isBoringAssignment()) {
                break;
            }
        }
    }

    // Print the assignments
    printAssignments() {
        this.data.forEach((person) => {
            const assignedName = this.data[person.assigned].name;
            console.log(`${person.name} was assigned ${assignedName}`);
        });
    }

    // Main method to execute the Secret Santa process
    execute() {
        this.initialize();
        this.createValidAssignment();
        //this.printAssignments();
        return this.data;
    }
}

module.exports = Santa;
