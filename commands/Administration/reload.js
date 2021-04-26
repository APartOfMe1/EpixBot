const klaw = require('klaw');

module.exports = {
    name: 'reload',
    description: 'Reload commands or add new ones to the bot',
    category: 'Administration',
    usage: '`{prefix}reload` or `{prefix}reload <command>`',
    examples: '`{prefix}reload ping`',
    async execute(msg, args) {
        if (!args[0]) { //Check if there was a command specified
            checkNew();
        } else {
            reloadCmd();
        };

        function checkNew() { //Run if there was no command specified
            var reloaded = [];

            klaw("./commands") //Run through the commands folder
                .on('data', c => {
                    if (!c.path.endsWith(".js")) return; //Ignore non-js files

                    const command = require(c.path); //Get the filepath for the command

                    var commandName = c.path.replace(/^.*[\\\/]/, '').split(".js"); //Get the name of the file

                    if (!client.categories.get(command.category)) { //Add the category to the list
                        client.categories.set(command.category);
                    };

                    if (!client.commands.get(commandName[0], command)) { //Add the command to the list
                        client.commands.set(commandName[0], command);

                        reloaded.push(commandName[0]); //Add the command name to the array
                    };
                }).on('end', () => {
                    if (!reloaded[0]) { //Send an error if there weren't any new commands found
                        return msg.channel.send("No new commands were found");
                    };

                    return msg.channel.send(`Successfully loaded \`\`\`${reloaded.join(", ")}\`\`\``) //Send a success message when all commands are loaded
                });
        };

        function reloadCmd() { //Run if there was a command specified
            const cmd = client.commands.get(args.join(" ").toLowerCase()) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args.join(" ").toLowerCase())); //Find the given command in the list

            if (!cmd) { //Ignore the message if it doesn't include a valid command
                return msg.channel.send("That's not a command!");
            };

            klaw("./commands") //Run through the commands folder
                .on('data', c => {
                    if (!c.path.endsWith(".js")) return; //Ignore non-js files

                    var commandName = c.path.replace(/^.*[\\\/]/, '').split(".js"); //Get the name of the file

                    if (commandName[0] === cmd.name) { //Make sure the command found is the one specified
                        try {
                            delete require.cache[require.resolve(c.path)]; //Delete the command from the cache

                            const newCommand = require(c.path); //Require the command

                            client.commands.set(commandName[0], newCommand); //Set the command in the collection

                            return msg.channel.send(`Successfully reloaded **${commandName[0]}**!`);
                        } catch (error) {
                            return msg.channel.send(`Looks like there was an error reloading **${commandName[0]}**!`);
                        };
                    } else { //Return if the command isn't the one specified
                        return;
                    };
                });
        };
    },
};