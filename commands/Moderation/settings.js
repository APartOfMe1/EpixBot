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
        if (!msg.member.hasPermission('MANAGE_GUILD')) { //Make sure the author can manage the guild
            return msg.reply("Sorry! You need the manage server permission to change the settings!");
        };

        var [prop, ...value] = args; //Split up the message 

        const ensured = settingsManager.ensureAll(msg.guild.id);

        const intent = args[1] ? args[1].toLowerCase() : args[1]; //Get the subcommand if given

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
                switch (intent) {
                    case "enable":
                        settingsManager.logs.enable(msg, args).then(res => {
                            return msg.channel.send(`Logs have been successfully enabled in ${res}`); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        break;

                    case "disable":
                        settingsManager.logs.disable(msg.guild.id).then(() => {
                            return msg.channel.send('Logs have been successfully disabled'); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        break;

                    case "ignore":
                        settingsManager.logs.ignore(msg, args).then(res => {
                            return msg.channel.send(`${res} was successfully excluded from message logging`); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        break;

                    case "unignore":
                        settingsManager.logs.unignore(msg, args).then(res => {
                            return msg.channel.send(`${res} is now included in message logging`); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        break;

                    default:
                        return msg.channel.send(`For message logging please use the format \`${config.prefix}settings logs <enable/disable> <channel>\`. For example, \`${config.prefix}settings logs enable #logs\` \n\nYou can also exclude a user or channel from logging by using \`${config.prefix}settings logs <ignore/unignore> <@user/#channel>\``); //Send an info message
                };

                break;

            case "commands":
                if (!args[2]) { //Send a message if there was no command specified
                    return msg.channel.send(`To ignore commands entirely use \`${config.prefix}settings commands enable/disable <command>\`. For example, \`${config.prefix}settings commands disable actas\``);
                };

                const cmd = args[2].toLowerCase(); //Get the command specified

                switch (intent) {
                    case "disable":
                        settingsManager.commands.disable(msg.guild.id, cmd).then(res => {
                            return msg.channel.send(res); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        break;

                    case "enable":
                        settingsManager.commands.enable(msg.guild.id, cmd).then(res => {
                            return msg.channel.send(res); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        break;

                    default:
                        return msg.channel.send(`To ignore commands entirely use \`${config.prefix}settings commands <enable/disable> <command>\`. For example, \`${config.prefix}settings commands disable actas\``); //Send an informational message
                };

                break;

            case "selfroles":
                settingsManager.selfroles.ensurePerms(msg.guild).then(() => {
                    switch (intent) {
                        case "add":
                            settingsManager.selfroles.add(msg, args).then(res => {
                                return msg.channel.send(res); //Send a success message
                            }).catch(e => {
                                return msg.channel.send(e);
                            });

                            break;

                        case "remove":
                            settingsManager.selfroles.remove(msg, args).then(res => {
                                return msg.channel.send(res); //Send a success message
                            }).catch(e => {
                                return msg.channel.send(e);
                            });

                            break;

                        default:
                            msg.channel.send(`To add a role to the list of selfroles, use \`${config.prefix}settings selfroles add <name/id/@role>\`. For example: \`${config.prefix}settings selfroles add announcement-pings\` \n\nTo remove a role from the list, just do the opposite: \`${config.prefix}settings selfroles remove <name/id/@role>\``);
                            
                            break;
                    };
                }).catch(e => {
                    return msg.channel.send(e);
                });

                break;

            case "autorole":
                settingsManager.autoroles.ensurePerms(msg.guild).then(() => {
                    if (intent && intent === "remove") {
                        settingsManager.selfroles.remove(msg.guild.id).then(res => {
                            return msg.channel.send(res); //Send a success message
                        }).catch(e => {
                            return msg.channel.send(e);
                        });

                        return;
                    } else if (!intent) {
                        return msg.channel.send(`To set up an autorole and have it be given to new users, use \`${config.prefix}settings autorole <name/id/@role>\`. For example: \`${config.prefix}settings autorole member\` \n\nTo remove the autorole, use \`${config.prefix}settings autorole remove\``);
                    };

                    settingsManager.autoroles.autorole(msg, args).then(res => {
                        return msg.channel.send(res); //Send a success message
                    }).catch(e => {
                        return msg.channel.send(e);
                    });
                }).catch(e => {
                    return msg.channel.send(e);
                });

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
    },
};