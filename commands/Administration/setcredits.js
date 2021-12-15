module.exports = {
    name: 'setcredits',
    description: 'Set the amount of credits a user has',
    category: 'Administration',
    usage: '`{prefix}setcredits <user> <credits>`',
    examples: '`{prefix}setcredits @A part of me#0412 5000` or `{prefix}setcredits 277137613775831050 5000`',
    async execute(msg, args) {
        // Get the user my mention or id
        const user = msg.mentions.users.first() || client.users.cache.get(args[0]);

        // Error if there was no user specified
        if (!user) {
            return msg.reply("You didn't mention a user or give an ID");
        }

        // Get the number of credits specified in the message
        const credits = parseInt(args[1], 10);

        // Error if there weren't any credits given
        if (!credits) {
            return msg.reply("There were no credits specified");
        }

        // Set the default settings for credits
        client.db.credits.ensure(user.id, {
            user: user.id,
            credits: 0,
            streak: 0
        });

        // Set the credits
        client.db.credits.set(user.id, credits, "credits");

        // Send a success message
        return msg.channel.send(`**${user.tag}**'s credits have been set to **${credits}**`);
    },
};