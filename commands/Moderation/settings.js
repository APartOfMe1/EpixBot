const Discord = require('discord.js');
const config = require("../../config/config.json");
const settingsManager = require("../../handlers/Settings/settings.js");

module.exports = {
    name: 'settings',
    description: 'Change the guild\'s settings',
    category: 'Moderation',
    aliases: ["options", "opts", "config"],
    usage: '`{prefix}settings <setting> <value>`',
    examples: 'Use `{prefix}settings` for more detailed information',
    async execute(msg, args) {
        //Hoo boy here we go. This is a huge mess, but I *really* don't want to rewrite it

        if (!msg.member.hasPermission('MANAGE_GUILD')) { //Make sure the author can manage the guild
            return msg.reply("Sorry! You need the manage server permission to change the settings!");
        };

        var [prop, ...value] = args; //Split up the message 

        const ensured = settingsManager.ensureAll(msg.guild.id);

        switch (prop) {
            case 'view':
                settingsManager.view.viewAll(msg.guild).then(res => {
                    const viewembed = new Discord.MessageEmbed() //Setup and send an embed
                        .setColor(config.embedColor)
                        .addField("General", `\`\`\`Prefix: ${ensured.settings.prefix} \n\nAutorole: ${res.autorole}\`\`\``, true)
                        .addField("Logs", `\`\`\`Logs: ${ensured.settings.logs} \n\nLog Channel: ${res.logchannel} \n\nIgnored Users/Channels: ${res.ignored.join(", ")}\`\`\``, true)
                        .addField("Commands", `\`\`\`Disabled Commands: ${res.disabled}\`\`\``)
                        .addField("Selfroles", `\`\`\`${res.selfroles.join(", ")}\`\`\``);

                    return msg.channel.send({
                        embed: viewembed
                    });
                });

                break;

            case 'prefix':
                settingsManager.prefix.setPrefix(msg.guild, args.slice(1).join(' ')).then(res => {
                    return msg.channel.send(`Prefix has been changed to: \`${res}\``); //Send a success message
                }).catch(e => {
                    switch (e) { //Figure out which error occurred
                        case "invalidPrefix":
                            msg.channel.send('Your prefix should be 5 characters max and not include any spaces');

                            break;

                        case "noPrefix":
                            const noPrefixEmb = new Discord.MessageEmbed()
                            .setColor(config.embedColor)
                            .addField("Prefix Settings", `To change the prefix, use \`${config.prefix}settings prefix <prefix>\`. For example: \`${config.prefix}settings prefix eb!\`\n\nNote that your prefix can't have spaces, and cannot be more than 5 characters long`);
                            
                            msg.channel.send({
                                embed: noPrefixEmb
                            });

                            break;
                    };
                });

                break;

            case 'logs':
                logs();

                break;

            case "commands":
                commands();

                break;

            case "selfroles":
                selfroles();

                break;

            case "autorole":
                autorole();

                break;

            default:
                if (!client.db.settings.has(msg.guild.id, prop)) { //Make sure the given setting is valid
                    return msg.channel.send("That's not a setting!");
                };

                const embed = new Discord.MessageEmbed() //Send a default message if no setting was provided
                    .setColor(config.embedColor)
                    .addField('Settings', `To change a setting, use \`${config.prefix}settings <setting> <value>\`. For example, \`${config.prefix}settings prefix >\`. Use \`${config.prefix}settings <setting>\` for detailed usage info. To view the guild's current settings, use \`${config.prefix}settings view\` \n\nAvailable settings are: \`\`\`\nprefix, logs, commands, selfroles, autorole\`\`\``);

                return msg.channel.send({
                    embed
                });
        };

        function logs() {
            const log = args[1]; //Get the subcommand

            switch (log) {
                case "enable":
                    if (args[2]) {
                        var chnl = msg.mentions.channels.first(); //Get the mentioned channel

                        if (!chnl) { //Send a message if the channel is invalid
                            return msg.channel.send('Please specify a channel!');
                        };
                    } else { //Send a message if there wasn't a channel specified
                        return msg.channel.send('Please specify a channel!');
                    };

                    client.db.settings.set(msg.guild.id, 'enabled', prop); //Set logs to enabled

                    client.db.logchannel.set(msg.guild.id, chnl.id); //Set the logchannel

                    return msg.channel.send(`Logs have been successfully enabled in ${chnl}`); //Send a success message

                case "disable":
                    if (!client.db.logchannel.has(msg.guild.id)) { //Make sure the logs aren't already disabled
                        return msg.channel.send('Logs are already disabled!');
                    };

                    client.db.settings.set(msg.guild.id, 'disabled', prop); //Set logs to disabled

                    client.db.logchannel.delete(msg.guild.id); //Delete the logchannel

                    return msg.channel.send('Logs have been successfully disabled'); //Send a success message

                case "ignore":
                    if (args[2]) {
                        var ignoredid = msg.mentions.channels.first() || msg.mentions.users.first(); //Get the id to ignore

                        if (!ignoredid) { //Send an error if the channel/user is invalid
                            return msg.channel.send("Please specify a user or channel to ignore from logging");
                        };
                    } else { //Send an error if there weren't any channels given
                        return msg.channel.send("Please specify a user or channel to ignore from logging");
                    };

                    if (client.db.ignore.includes(msg.guild.id, ignoredid.id)) { //Make sure the user isn't already ignored
                        return msg.channel.send('That user or channel is already ignored from logging!');
                    };

                    client.db.ignore.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

                    client.db.ignore.push(msg.guild.id, ignoredid.id); //Add the id to the enmap

                    return msg.channel.send(`${ignoredid} was successfully excluded from message logging`); //Send a success message

                case "unignore":
                    if (args[2]) {
                        var ignoredid = msg.mentions.channels.first() || msg.mentions.users.first(); //get the id to ignore

                        if (!ignoredid) { //Send an error if the channel/user is invalid
                            return msg.channel.send("Please specify a user or channel to unignore");
                        };
                    } else {
                        return msg.channel.send("Please specify a user or channel to unignore"); //Send an error if there weren't any channels given
                    };

                    if (!client.db.ignore.includes(msg.guild.id, ignoredid.id)) { //Make sure the user is actually ignored
                        return msg.channel.send('That user or channel isn\'t ignored from logging!');
                    };

                    client.db.ignore.remove(msg.guild.id, ignoredid.id); //Remove the id from the list

                    return msg.channel.send(`${ignoredid} is now included in message logging`); //Send a success message

                default:
                    return msg.channel.send(`For message logging please use the format \`${config.prefix}settings logs <enable/disable> <channel>\`. For example, \`${config.prefix}settings logs enable #logs\` \n\nYou can also exclude a user or channel from logging by using \`${config.prefix}settings logs <ignore/unignore> <@user/#channel>\``); //Send an info message
            };
        };

        function commands() {
            const sub = args[1];

            if (!args[2]) { //Send a message if there was no command specified
                return msg.channel.send(`To ignore commands entirely use \`${config.prefix}settings commands enable/disable <command>\`. For example, \`${config.prefix}settings commands disable actas\``);
            };

            var cmd = args[2].toLowerCase(); //Get the command specified

            switch (sub) {
                case "disable":
                    const unignorable = [ //List of commands that can't be ignored
                        "settings",
                        "help",
                        "helpdm"
                    ];

                    for (const ignore of unignorable) { //Make sure the command exists and can be ignored
                        if (ignore === cmd || !client.commands.get(cmd)) {
                            return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled`);
                        };
                    };

                    var findCmd = client.commands.get(cmd) || client.commands.find(c => c.aliases && c.aliases.includes(cmd)); //Get a list of commands and aliases

                    if (findCmd.category === "Administration") { //If the command is in the Administration category, ignore it
                        return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled`);
                    };

                    client.db.disabledCommands.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

                    if (client.db.disabledCommands.includes(msg.guild.id, cmd)) { //Check if the command is already disabled
                        return msg.channel.send(`**${cmd}** is already disabled`);
                    };

                    client.db.disabledCommands.push(msg.guild.id, cmd); //Add the command to the enmap

                    return msg.channel.send(`**${cmd}** has been disabled`); //Send a success message

                case "enable":
                    if (!client.commands.get(cmd)) { //Check if the command exists
                        return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled/enabled`);
                    };

                    var findCmd = client.commands.get(cmd) || client.commands.find(c => c.aliases && c.aliases.includes(cmd)); //Get a list of commands and aliases

                    if (findCmd.category === "Administration") { //If the command is in the Administration category, ignore it
                        return msg.channel.send(`**${cmd}** either doesn't exist or cannot be disabled`);
                    };

                    client.db.disabledCommands.ensure(msg.guild.id, []); //Ensure that the enmap has the guild

                    if (!client.db.disabledCommands.includes(msg.guild.id, cmd)) { //Check if the command is actually disabled
                        return msg.channel.send(`**${cmd}** is not disabled!`);
                    };

                    client.db.disabledCommands.remove(msg.guild.id, cmd); //Remove the command from the map

                    return msg.channel.send(`**${cmd}** has been enabled`); //Send a success message

                default:
                    return msg.channel.send(`To ignore commands entirely use \`${config.prefix}settings commands <enable/disable> <command>\`. For example, \`${config.prefix}settings commands disable actas\``); //Send an informational message
            };
        };

        function selfroles() {
            client.db.selfroles.ensure(msg.guild.id, {
                selfroles: [],
                autorole: "Not set"
            });

            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
                return msg.channel.send("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
            };

            switch (args[1]) {
                case "add":
                    if (args[2]) { //Check if a role was given
                        var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[2]) || msg.mentions.roles.first();

                        if (!role) { //Check if the given role is valid
                            return msg.channel.send("I couldn't find that role! Try mentioning it or giving its ID");
                        };
                    } else {
                        return msg.channel.send(`To add a role to the list of selfroles, use \`${config.prefix}settings selfroles add <name/id/@role>\`. For example: \`${config.prefix}settings selfroles add announcement-pings\``);
                    };

                    if (msg.member.roles.highest.comparePositionTo(role) < 0) { //Send an error if the member has a higher role than the bot
                        return msg.channel.send("I can't add a role to someone higher up than me!");
                    };

                    client.db.selfroles.push(msg.guild.id, role.id, "selfroles"); //Add the role to the list of selfroles

                    msg.channel.send(`Alright! I've added **${role.name}** to the list of selfroles. Users can assign it to themselves by using \`${config.prefix}selfrole ${role.name}\``);

                    break;

                case "remove":
                    if (args[2]) { //Check if a role was given
                        var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[2]) || msg.mentions.roles.first();

                        if (!role) { //Make sure the role is valid
                            return msg.channel.send("I couldn't find that role! Try mentioning it or giving its ID");
                        };
                    } else {
                        return msg.channel.send(`To remove a role to the list of selfroles, use \`${config.prefix}settings selfroles remove <name/id/@role>\`. For example: \`${config.prefix}settings selfroles remove announcement-pings\``);
                    };

                    if (client.db.selfroles.includes(msg.guild.id, role.id, "selfroles")) { //Check if the array includes the given role
                        client.db.selfroles.remove(msg.guild.id, role.id, "selfroles"); //Remove the role from the array

                        return msg.channel.send(`**${role.name}** was removed from the list of selfroles`);
                    } else {
                        return msg.channel.send(`**${role.name}** isn't a selfrole!`);
                    };

                default:
                    msg.channel.send(`To add a role to the list of selfroles, use \`${config.prefix}settings selfroles add <name/id/@role>\`. For example: \`${config.prefix}settings selfroles add announcement-pings\` \n\nTo remove a role from the list, just do the opposite: \`${config.prefix}settings selfroles remove <name/id/@role>\``);

                    break;
            };
        };

        function autorole() {
            client.db.selfroles.ensure(msg.guild.id, {
                selfroles: [],
                autorole: "Not set"
            });

            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) { //Send an error if the bot doesn't have permissions
                return msg.channel.send("I don't have permissions to add roles to users! Please give me the \"Manage Roles\" permission and run the command again");
            };

            if (args[1]) {
                if (args[1].toLowerCase() === "remove") {
                    client.db.selfroles.set(msg.guild.id, "Not set", "autorole"); //Remove the autorole

                    return msg.channel.send("The autorole has been disabled");
                };

                var role = msg.guild.roles.cache.find(i => i.name.toLowerCase() === args.slice(1).join(" ").toLowerCase()) || msg.guild.roles.cache.find(i => i.id === args[1]) || msg.mentions.roles.first();

                if (!role) { //Check if a valid role was given
                    return msg.channel.send("I couldn't find that role! Try mentioning it or giving its ID");
                };

                client.db.selfroles.set(msg.guild.id, role.id, "autorole"); //Set the autorole

                return msg.channel.send(`**${role.name}** was successfully set as the auto role! Any new members that join will automatically get the role added to them. To remove the autorole, use \`${config.prefix}settings autorole remove\``);
            } else {
                return msg.channel.send(`To set up an autorole and have it be given to new users, use \`${config.prefix}settings autorole <name/id/@role>\`. For example: \`${config.prefix}settings autorole member\` \n\nTo remove the autorole, use \`${config.prefix}settings autorole remove\``);
            };
        };
    },
};