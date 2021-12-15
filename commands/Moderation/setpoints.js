module.exports = {
    name: 'setpoints',
    description: 'Set the amount of points a user has',
    category: 'Moderation',
    usage: '`{prefix}setpoints @user <number>` or `{prefix}setpoints <user id> <number>`',
    examples: '`{prefix}setpoints @A part of me#0412 5000` or `{prefix}setpoints 277137613775831050 5000`',
    async execute(msg, args) {
        if (!msg.member.permissions.has(Discord.Permissions.ADMINISTRATOR)) {
            return msg.reply("You need administrator privledges to use this command!");
        }

        // Get the user my mention or id
        const user = msg.mentions.users.first() || client.users.cache.get(args[0]);

        // Error if there was no user specified
        if (!user) {
            return msg.reply("You didn't mention a user or give an ID");
        }

        // Get the number of points specified in the message
        const points = parseInt(args[1], 10);

        // Error if there weren't any points given
        if (!points) {
            return msg.reply("There were no points specified");
        }

        // Make sure the user exists in the enmap
        client.db.points.ensure(`${msg.guild.id}-${user.id}`, {
            user: user.id,
            guild: msg.guild.id,
            points: 0,
            level: 1
        });

        client.db.points.set(`${msg.guild.id}-${user.id}`, points, "points");

        return msg.channel.send(`**${user.tag}**'s points have been set to **${points}**`);
    },
};