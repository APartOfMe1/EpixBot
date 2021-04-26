module.exports = {
    name: 'setcredits',
    description: 'Set the amount of credits a user has',
    category: 'Administration',
    usage: '`{prefix}setcredits <user> <credits>`',
    examples: '`{prefix}setcredits @A part of me#0412 5000` or `{prefix}setcredits 277137613775831050 5000`',
    async execute(msg, args) {
        const user = msg.mentions.users.first() || client.users.cache.get(args[0]); //Get the user my mention or id

        if (!user) { //Error if there was no user specified
            return msg.reply("You didn't mention a user or give an ID");
        };

        const credits = parseInt(args[1], 10); //Get the number of credits specified in the message

        if (!credits) { //Error if there weren't any credits given
            return msg.reply("There were no credits specified");
        };

        client.db.credits.ensure(user.id, { //Set the default settings for credits
            user: user.id,
            credits: 0,
            streak: 0
        });

        client.db.credits.set(user.id, credits, "credits"); //Set the credits

        return msg.channel.send(`**${user.tag}**'s credits have been set to **${credits}**`); //Send a success message
    },
};