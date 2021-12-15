const config = require('../../config/config.json');

module.exports = {
    name: 'fixstreak',
    description: 'Fix a broken streak',
    category: 'Administration',
    allowAllUsers: true,
    async execute(msg, args) {
        const canFix = client.db.settings.get("fixstreak");

        if (config.owners.includes(msg.author.id) && args[0]) {
            if (args[0].toLowerCase() === "toggle") {
                if (canFix) {
                    client.db.settings.set("fixstreak", false);

                    return msg.channel.send("Streak fixing has been disabled");
                } else {
                    client.db.settings.set("fixstreak", true);

                    setTimeout(() => {
                        client.db.settings.set("fixstreak", false);
                    }, 86400000);

                    return msg.channel.send("Streak fixing has been enabled. It will be automatically disabled in 24 hours. You can manually disable it by running this command again");
                }
            } else {
                return msg.channel.send("That's not a valid option. Available options are\n```toggle```");
            }
        }

        // Don't do anything if the option isn't enabled
        if (!canFix && !config.owners.includes(msg.author.id)) {
            return;
        }

        var oldStreak = client.db.credits.get(msg.author.id, "oldstreak");

        if (client.db.credits.get(msg.author.id, "streak") > oldStreak) {
            oldStreak = client.db.credits.get(msg.author.id, "streak");
        }

        client.db.credits.set(msg.author.id, oldStreak, "streak");

        client.db.credits.set(msg.author.id, new Date().valueOf(), "lastran");

        client.db.credits.set(msg.author.id, true, "canspeedup");

        return msg.channel.send(`Successfully reset your streak to ${oldStreak}. You'll also be able to use the daily command in 15 hours next time`);
    },
};