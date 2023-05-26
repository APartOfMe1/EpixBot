module.exports = {
    name: 'blacklist',
    description: 'Modify the blacklist',
    category: 'Administration',
    usage: '`{prefix}blacklist <@user or id>`',
    examples: '`{prefix}blacklist @A part of me`',
    async execute(msg, args) {
        if (!args[0]) {
            return msg.channel.send("You need to either use `add` or `remove`");
        }

        // Get the user my mention or id
        const user = msg.mentions.users.first() || client.users.cache.get(args[1]);

        // Error if there was no user specified
        if (!user) {
            return msg.reply("You didn't mention a user or give an ID");
        }

        switch (args[0]) {
            case 'add':
                client.db.blacklist.set(user.id, true);

                return msg.reply('done! ' + user.username + ' was added to the blacklist');
        
            case 'remove':
                client.db.blacklist.set(user.id, false);

                return msg.reply('done! ' + user.username + ' was removed from the blacklist');
        }
    },
};