const Enmap = require("enmap");

module.exports = {
    points: new Enmap({
        name: "points"
    }),

    logchannel: new Enmap({
        name: "logchannel"
    }),

    ignore: new Enmap({
        name: "ignored",
    }),

    disabledCommands: new Enmap({
        name: "commands",
    }),

    settings: new Enmap({
        name: "settings",
        fetchAll: false,
        autoFetch: true,
        cloneLevel: 'deep'
    }),

    selfroles: new Enmap({
        name: "selfroles",
    }),

    credits: new Enmap({
        name: "credits"
    }),

    reminders: new Enmap({
        name: "reminders"
    }),

    deleteGuild(id) {
        this.settings.delete(id);

        this.ignore.delete(id);

        this.logchannel.delete(id);

        this.selfroles.delete(id);

        this.disabledCommands.delete(id);
    }
};