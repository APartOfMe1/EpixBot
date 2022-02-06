const Discord = require("discord.js");
const fs = require('fs');
const config = require("../../../config/config.json");
const cmdCooldown = new Set();

module.exports = {
    handleCommandInteraction(interaction) {
        const cmd = client.commands.get(interaction.commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName)); // Get a list of commands and aliases

        if (!cmd) { // Ignore the message if it doesn't include a valid command
            return;
        };

        if (cmd.category === "Administration" && !config.owners.includes(interaction.user.id) && cmd.allowAllUsers !== true) { // If the command is in the Administration category and the author isn't an owner, ignore it
            return;
        };

        disabledCooldown(cmd, interaction.user.id, interaction.guildId).then(() => {
            cmd.execute(interaction).catch(e => { // Execute the command
                cmdError(e, cmd, interaction.guild).then(errEmb => {
                    return interaction.reply({ // Send an error if needed
                        embeds: [errEmb]
                    });
                });
            });
        }).catch(e => {
            return interaction.reply(e);
        });
    },

    handleCommandMsg(msg) {
        const defaultSettings = {
            prefix: config.prefix,
            logs: "disabled"
        };

        const customPrefix = client.db.settings.ensure(msg.guild.id, defaultSettings).prefix; //Get the server's custom prefix if available

        const prefixes = [customPrefix, config.prefix]; //Define a list of available prefixes

        this.prefix = config.prefix;

        for (const thisPrefix of prefixes) { //If the message doesn't start with a valid prefix, ignore it 
            if (msg.content.startsWith(thisPrefix)) {
                this.prefix = thisPrefix;
            };
        };

        if (!this.prefix.length) {
            this.prefix = config.prefix;
        };

        if (!msg.content.startsWith(this.prefix)) {
            return;
        };

        const args = msg.content.split(" ").slice(1); //Split the arguments

        const cmdName = msg.content.slice(this.prefix.length).split(/ +/).shift().toLowerCase(); //Get the command name

        const cmd = client.commands.get(cmdName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName)); //Get a list of commands and aliases

        if (!cmd) { //Ignore the message if it doesn't include a valid command
            return;
        };

        if (cmd.category === "Administration" && !config.owners.includes(msg.author.id) && cmd.allowAllUsers !== true) { //If the command is in the Administration category and the author isn't an owner, ignore it
            return;
        };

        if (cmd.slashOnly !== false && cmd.slashOptions) { // We want slashOnly to default to false if it's not given
            return msg.channel.send(`**${cmd.name}** can only be used as a slash command!`);
        }

        disabledCooldown(cmd, msg.author.id, msg.guild.id).then(() => {
            cmd.execute(msg, args).catch(e => { // Execute the command
                cmdError(e, cmd, msg.guild).then(errEmb => {
                    return msg.channel.send({ // Send an error if needed
                        embeds: [errEmb]
                    });
                });
            });
        }).catch(e => {
            return msg.channel.send(e);
        });
    }
};

function cmdError(e, cmd, guild) {
    const errEmb = new Discord.MessageEmbed()
        .setColor(config.embedColor)
        .setTitle(`There was an error running that command! The information below has been sent to the developer`)
        .setDescription(`There was an error in ${guild.name} (${guild.id}) while running the command **${cmd.name}** \n\`\`\`js\n${e}\`\`\``);

    if (config.debugMode) { // Log errors to the console if needed
        console.log(e);
    };

    if (client.channels.cache.get(config.errorChannel)) {
        const d = new Date(); // Get the date for the error file

        const path = `./handlers/Main/Error-Logs/Log_${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.txt`; // Generate the file name

        fs.writeFile(path, `There was an uncaught exception error. The details can be found below.\n\n${e.stack}`, function (e) { });

        client.channels.cache.get(config.errorChannel).send(`There was an error in ${guild.name} (${guild.id}) while running the command **${cmd.name}** \n\`\`\`js\n${e}\`\`\``, {
            files: [path]
        });
    };

    Promise.resolve(errEmb);
}

function disabledCooldown(cmd, userId, guildId) {
    client.db.disabledCommands.ensure(guildId, []); // Make sure that the enmap won't kill itself lol

    if (client.db.disabledCommands.includes(guildId, cmd.name)) { // If the command is disabled, ignore 
        return Promise.reject(`**${cmd.name}** is disabled`);
    };

    if (cmd.cooldown) { // Check if the command has a cooldown
        if (!cmdCooldown.has(`${userId} | ${guildId}`)) {
            cmdCooldown.add(`${userId} | ${guildId}`); // Add the user/guild pair to the cooldown

            setTimeout(() => { // Remove them from the cooldown after the specified time
                cmdCooldown.delete(`${userId} | ${guildId}`);
            }, cmd.cooldown);
        } else {
            return Promise.reject(`**${cmd.name}** has a ${cmd.cooldown / 1000} second cooldown! Please wait a bit before using it again`);
        };
    };

    return Promise.resolve();
}