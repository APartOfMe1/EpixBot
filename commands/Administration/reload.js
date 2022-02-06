const klaw = require('klaw');

module.exports = {
    name: 'reload',
    description: 'Reload commands or add new ones to the bot',
    category: 'Administration',
    usage: '`{prefix}reload` or `{prefix}reload <command>`',
    examples: '`{prefix}reload ping`',
    async execute(msg, args) {
        // Check if there was a command specified
        if (!args[0]) {
            checkNew();
        } else {
            reloadCmd();
        }

        // Run if there was no command specified
        function checkNew() {
            var reloaded = [];

            // Run through the commands folder
            klaw("./commands")
                .on('data', c => {
                    // Ignore non-js files
                    if (!c.path.endsWith(".js")) {
                        return;
                    }

                    // Get the filepath for the command
                    const command = require(c.path);

                    // Get the name of the file
                    var commandName = c.path.replace(/^.*[\\\/]/, '').split(".js");

                    // Add the category to the list
                    if (!client.categories.get(command.category)) {
                        client.categories.set(command.category);
                    }

                    // Add the command to the list
                    if (!client.commands.get(commandName[0], command)) {
                        client.commands.set(commandName[0], command);

                        // Add the command name to the array
                        reloaded.push(commandName[0]);
                    }
                }).on('end', () => {
                    // Send an error if there weren't any new commands found
                    if (!reloaded[0]) {
                        return msg.channel.send("No new commands were found");
                    }

                    // Send a success message when all commands are loaded
                    return msg.channel.send(`Successfully loaded \`\`\`${reloaded.join(", ")}\`\`\``);
                });
        };

        // Run if there was a command specified
        function reloadCmd() {
            // Find the given command in the list
            const cmd = client.commands.get(args.join(" ").toLowerCase()) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args.join(" ").toLowerCase()));

            // Ignore the message if it doesn't include a valid command
            if (!cmd) {
                return msg.channel.send("That's not a command!");
            }

            // Run through the commands folder
            klaw("./commands")
                .on('data', c => {
                    // Ignore non-js files
                    if (!c.path.endsWith(".js")) {
                        return;
                    }

                    // Get the name of the file
                    var commandName = c.path.replace(/^.*[\\\/]/, '').split(".js");

                    // Make sure the command found is the one specified
                    if (commandName[0] === cmd.name) {
                        try {
                            // Delete the command from the cache
                            delete require.cache[require.resolve(c.path)];

                            // Require the command
                            const newCommand = require(c.path);

                            // Set the command in the collection
                            client.commands.set(commandName[0], newCommand);

                            return msg.channel.send(`Successfully reloaded **${commandName[0]}**!`);
                        } catch (error) {
                            return msg.channel.send(`Looks like there was an error reloading **${commandName[0]}**!`);
                        }
                    } else {
                        // Return if the command isn't the one specified
                        return;
                    }
                });
        };
    },
};