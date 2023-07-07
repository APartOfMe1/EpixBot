const config = require('../config/config.json');
const klaw = require('klaw');
const Discord = require('discord.js');
const fs = require('fs');
const cmdCooldown = new Set();

module.exports = {
    addCommandsByPath(filepath) {
        return new Promise((resolve, reject) => {
            // Create command/category collections if they don't exist
            client.commands = client.commands ?? new Discord.Collection();
            client.categories = client.categories ?? new Discord.Collection();

            klaw(filepath).on('data', c => {
                // We only care about js files here
                if (!c.path.endsWith('.js')) {
                    return;
                }

                const command = require(c.path);

                let commandName = c.path.replace(/^.*[\\\/]/, '').split(".js");

                // Add category to list as needed
                if (!client.categories.get(command.category)) {
                    client.categories.set(command.category);
                }

                // Ensure we haven't already added this command
                if (!client.commands.get(commandName[0])) {
                    client.commands.set(commandName[0], command);
                }
            }).on('end', () => {
                return resolve();
            });
        });
    },

    handleCommandMsg(msg) {
        // TODO: custom prefixes when DB is up
        let prefixes = [config.prefix];
        let usedPrefix = '';
        let isCommand = false;

        // Check if the message starts with any of the prefixes
        for (const prefix of prefixes) {
            if(msg.content.startsWith(prefix)) {
                isCommand = true;
                usedPrefix = prefix;
            }
        }

        if (!isCommand) {
            return;
        }

        // Split message into its parts
        let noPrefix = msg.content.slice(usedPrefix.length).trim().split(' ');
        let cmdName = noPrefix[0];
        let args = noPrefix.slice(1);

        // Check if it's a valid command/alias
        let cmd = client.commands.get(cmdName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

        if (!cmd) {
            return;
        }

        // Don't allow regular users to use admin commands
        if (cmd.category === "Administration" && !config.owners.includes(msg.author.id) && cmd.allowAllUsers !== true) {
            return;
        }

        // We want slashOnly to default to false if it's not given
        if (cmd.slashOnly !== false && cmd.slashOptions) {
            return msg.channel.send(`**${cmd.name}** can only be used as a slash command! Try typing \`/${cmd.name}\``);
        }

        disabledCooldown(cmd, msg.author.id, msg.guild.id).then(() => {
            cmd.execute(msg, args).catch(e => {
                // Generate an error embed
                cmdError(e, cmd, msg.guild, msg).then(errEmb => {
                    return msg.channel.send({
                        embeds: [errEmb]
                    });
                });
            });
        }).catch(e => {
            return msg.channel.send(e);
        });
    }
}

function cmdError(e, cmd, guild, msg) {
    let errEmb = new Discord.EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`There was an error running that command! The information below has been sent to the developer`)
        .setDescription(`There was an error in ${guild.name} (${guild.id}) while running the command **${cmd.name}** \n\`\`\`js\n${e}\`\`\``);

    if (config.debugMode) {
        console.log(e);
    }

    if (client.channels.cache.get(config.errorChannel)) {
        let d = new Date();
        let path = `./logs/log_${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.txt`;

        fs.writeFile(path, `There was an error in ${guild.name} (${guild.id}) while running the command ${cmd.name}\nMessage author: ${msg.author.username} (${msg.author.id})\nMessage content: ${msg.content}\n\n${e.stack}`, function (e) {console.log(e)});

        client.channels.cache.get(config.errorChannel).send(`There was an error in ${guild.name} (${guild.id}) while running the command **${cmd.name}** \n\`\`\`js\n${e}\`\`\``, {
            files: [path]
        });
    }

    return Promise.resolve(errEmb);
}

function disabledCooldown(cmd, userId, guildId) {
    // TODO: disabled command checks once DB is up

    // Cooldowns are based on user AND guild
    let key = `${userId}-${guildId}`;

    if (cmd.cooldown) {
        if (!cmdCooldown.has(key)) {
            cmdCooldown.add(key);
            
            setTimeout(() => {
                cmdCooldown.delete(key);
            }, cmd.cooldown);
        } else {
            return Promise.reject(`**${cmd.name}** has a ${cmd.cooldown / 1000} second cooldown! Please wait a bit before using it again`);
        }
    }

    return Promise.resolve();
}