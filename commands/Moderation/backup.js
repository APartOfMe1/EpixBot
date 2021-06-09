var Discord = require("discord.js");
const backup = require("discord-backup");
const config = require("../../config/config.json");
const emojis = require("../../assets/emojis/emojis.json");
const cooldown = new Set();

module.exports = {
    name: 'backup',
    description: 'Backup or restore everything in your server',
    category: 'Moderation',
    aliases: ["backups"],
    cooldown: 300000,
    usage: '`{prefix}backup create` or `{prefix}backup restore <id>`',
    examples: '`{prefix}backup restore 730448128594587340`',
    async execute(msg, args) {
        if (!msg.member.hasPermission('ADMINISTRATOR')) { //Send an error if the author doesn't have permission
            return msg.channel.send("You need admin permissions to create or restore server backups");
        };

        if (!msg.guild.me.hasPermission('ADMINISTRATOR')) { //Send an error if the bot doesn't have permissions
            return msg.channel.send("I need admin permissions to create/restore backups!");
        };

        var maxMsgCount = 250; //Set the message count to restore per channel. This can be increased as a patreon reward in the future or something

        if (args[0]) {
            if (args[0].toLowerCase() === "create") {
                if (!cooldown.has(msg.guild.id)) { //Check if the guild is on a cooldown
                    cooldown.add(msg.guild.id); //Add the guild ot the cooldown

                    setTimeout(() => { //Delete the guild from the cooldown after 24 hours. This is done separately from normal cooldowns since 12 hours is a long time, and normally cooldown times are displayed as seconds 
                        cooldown.delete(msg.guild.id);
                    }, 86400000);

                    var waitingMsg = await msg.channel.send(`${emojis.loading} Creating backup... This may take a few minutes`); //Send a message to edit later

                    backup.create(msg.guild, { //Create the backup
                        jsonBeautify: true,
                        maxMessagesPerChannel: maxMsgCount,
                        saveImages: "base64"
                    }).then((backupData) => {
                        msg.author.send(`The backup for **${msg.guild}** was successfully created! To restore it, you'll need to run \`${config.prefix}backup restore ${backupData.id}\` \n\nYour backup id: **${backupData.id}**`); //Send a success message to the author

                        waitingMsg.edit(`:white_check_mark: The backup was successfully created and the details were sent to **${msg.guild.members.cache.get(msg.author.id).displayName}**`); //Edit the message
                    });

                    return;
                } else { //If the guild is on a cooldown
                    return msg.channel.send(`Please wait 24 hours in between backups`);
                };
            } else if (args[0].toLowerCase() === "restore") {
                if (!args[1]) { //Make sure an id is given
                    return msg.channel.send("You need to specify a backup ID!");
                };

                var code = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1); //Generate a random four digit code

                msg.channel.send(`Are you sure you want to restore the backup? This will delete **ALL** data on the server and replace it with the data in the backup. This includes messages, channels, roles, bans, server settings, emojis, etc \n\nIf you're sure you want to restore the backup, type **${code}** within 45 seconds`);

                const filter = m => m.author.id === msg.author.id && m.content === code; //Make sure the message comes from the author and includes the code we generated earlier

                msg.channel.awaitMessages(filter, {
                    max: 1,
                    time: 45000,
                    errors: ['time']
                }).then(async collected => {
                    msg.author.send(`${emojis.loading} Restoring the backup... This will likely take a while. Please don't touch anything during the restore, as that can mess things up and cause your restore to fail.`);

                    backup.load(args[1], msg.guild, { //Load the backup
                        clearGuildBeforeRestore: true,
                        maxMessagesPerChannel: maxMsgCount
                    }).catch(e => {
                        return msg.channel.send("That isn't a valid backup ID!"); //If there was an error, assume the code was wrong
                    });
                }).catch(e => {
                    return msg.channel.send("No answer was given, so the restore was cancelled"); //Exit the command if no message was given
                });

                return;
            };
        };

        const failEmb = new Discord.MessageEmbed()
            .setTitle("Server Backups")
            .setColor(config.embedColor)
            .setDescription(`Use \`${config.prefix}backup create\` to create a backup, and \`${config.prefix}backup restore <id>\` to restore a backup`)
            .addField("What Happens When a Backup is Restored?", `When restoring a backup, all server data will be wiped and replaced by the data in the backup. This includes messages, settings, channels, roles, pins, etc. Only the last ${maxMsgCount} messages in each channel are backed up. If there's anything you want to save, be sure to create a fresh backup before restoring`);

        return msg.channel.send({
            embed: failEmb
        });
    },
};