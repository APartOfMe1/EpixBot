module.exports = {
    disable(guildId, cmd) {
        const unignorable = [ // List of commands that can't be ignored
            "settings",
            "help",
        ];

        for (const ignore of unignorable) { // Make sure the command exists and can be ignored
            if (ignore === cmd || !client.commands.get(cmd) && !client.commands.find(c => c.aliases && c.aliases.includes(cmd))) {
                return Promise.reject(`**${cmd}** either doesn't exist or cannot be disabled`);
            };
        };

        var findCmd = client.commands.get(cmd) || client.commands.find(c => c.aliases && c.aliases.includes(cmd)); // Get a list of commands and aliases

        if (findCmd.category === "Administration") { // If the command is in the Administration category, ignore it
            return Promise.reject(`**${cmd}** either doesn't exist or cannot be disabled`);
        };

        client.db.disabledCommands.ensure(guildId, []); // Ensure that the enmap has the guild

        if (client.db.disabledCommands.includes(guildId, findCmd.name)) { // Check if the command is already disabled
            return Promise.reject(`**${findCmd.name}** is already disabled`);
        };

        client.db.disabledCommands.push(guildId, findCmd.name); // Add the command to the enmap

        return Promise.resolve(`**${findCmd.name}** has been disabled`); // Send a success message
    },

    enable(guildId, cmd) {
        if (!client.commands.get(cmd) && !client.commands.find(c => c.aliases && c.aliases.includes(cmd))) { // Check if the command exists
            return Promise.reject(`**${cmd}** either doesn't exist or cannot be disabled/enabled`);
        };

        var findCmd = client.commands.get(cmd) || client.commands.find(c => c.aliases && c.aliases.includes(cmd)); // Get a list of commands and aliases

        if (findCmd.category === "Administration") { // If the command is in the Administration category, ignore it
            return Promise.reject(`**${cmd}** either doesn't exist or cannot be disabled`);
        };

        client.db.disabledCommands.ensure(guildId, []); // Ensure that the enmap has the guild

        if (!client.db.disabledCommands.includes(guildId, findCmd.name)) { // Check if the command is actually disabled
            return Promise.reject(`**${findCmd.name}** is not disabled!`);
        };

        client.db.disabledCommands.remove(guildId, findCmd.name); // Remove the command from the map

        return Promise.resolve(`**${findCmd.name}** has been enabled`); // Send a success message
    }
};