module.exports = {
    name: 'setpoints',
    description: 'Set the amount of points a user has',
    category: 'Moderation',
    usage: '`{prefix}setpoints @user <number>` or `{prefix}setpoints <user id> <number>`',
    examples: '`{prefix}setpoints @A part of me#0412 5000` or `{prefix}setpoints 277137613775831050 5000`',
    async execute(msg, args) {
        if (!msg.member.hasPermission('ADMINISTRATOR')) { //Make sure the user has permissions to use the command
            return msg.reply("You need administrator privledges to use this command!");
        };

        const user = msg.mentions.users.first() || client.users.cache.get(args[0]); //Get the user my mention or id

        if (!user) { //Error if there was no user specified
            return msg.reply("You didn't mention a user or give an ID");
        };

        const points = parseInt(args[1], 10); //Get the number of points specified in the message

        if (!points) { //Error if there weren't any points given
            return msg.reply("There were no points specified");
        };

        client.db.points.ensure(`${msg.guild.id}-${user.id}`, { //Make sure the user exists in the enmap
            user: user.id,
            guild: msg.guild.id,
            points: 0,
            level: 1
        });

        client.db.points.set(`${msg.guild.id}-${user.id}`, points, "points"); //Set the points

        return msg.channel.send(`**${user.tag}**'s points have been set to **${points}**`); //Send a success message

    },
};