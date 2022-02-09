var Discord = require("discord.js");
const path = require("path");
const backup = require("discord-backup");
const config = require("../../config/config.json");
const emojis = require("../../assets/emojis/emojis.json");
const cooldown = new Set();
backup.setStorageFolder(path.resolve("./assets/backups"));

module.exports = {
    name: 'backup',
    description: 'Backup or restore everything in your server',
    category: 'Moderation',
    aliases: ["backups"],
    cooldown: 5000,
    usage: '`{prefix}backup create` or `{prefix}backup restore <id>`',
    examples: '`{prefix}backup restore 730448128594587340`',
    slashOptions: new client.slashCommand()
        .addSubcommand(o => {
            return o.setName('create')
                .setDescription('Create a server backup');
        })
        .addSubcommand(o => {
            return o.setName('info')
                .setDescription('Information for server backups');
        })
        .addSubcommand(o => {
            return o.setName('restore')
                .setDescription('Restore a server backup')
                .addStringOption(o => {
                    return o.setName('id')
                        .setDescription('The ID of the backup to restore')
                        .setRequired(true);
                });
        }),
    async execute(interaction) {
        if (!interaction.member.permissions.has(Discord.Permissions.ADMINISTRATOR)) {
            return interaction.reply("You need admin permissions to create or restore server backups");
        }

        if (!interaction.member.guild.me.permissions.has(Discord.Permissions.ADMINISTRATOR)) {
            return interaction.reply("I need admin permissions to create/restore backups!");
        }

        // Set the message count to restore per channel
        var maxMsgCount = 50;

        switch (interaction.options.getSubcommand()) {
            case 'create':
                // Check if the guild is on a cooldown
                if (!cooldown.has(interaction.guildId)) {
                    // Add the guild to the cooldown
                    cooldown.add(interaction.guildId);

                    // Delete the guild from the cooldown after 24 hours.
                    // This is done separately from normal cooldowns since 12 hours is a long time, and normally cooldown times are displayed as seconds
                    setTimeout(() => {
                        cooldown.delete(interaction.guildId);
                    }, 86400000);

                    await interaction.reply(`${emojis.loading} Creating backup... This may take a few minutes`);

                    // Create the backup
                    backup.create(interaction.member.guild, {
                        jsonSave: true,
                        jsonBeautify: false,
                        maxMessagesPerChannel: maxMsgCount,
                        saveImages: "base64"
                    }).then((backupData) => {
                        // Send a success message to the author
                        interaction.user.send({
                            content: `The backup for **${interaction.member.guild.name}** was successfully created! To restore it, you'll need to run \`/backup restore ${backupData.id}\`\n\nYour backup id: **${backupData.id}**\n\nThe backup file is included below. It's recommended to store this file somewhere safe in case the remote copy ever gets deleted. You can also share this file with others to let them have a copy of the server.`,
                            files: [
                                path.resolve(`./assets/backups/${backupData.id}.json`)
                            ]
                        });

                        interaction.editReply(`:white_check_mark: The backup was successfully created and the details were sent to **${interaction.member.nickname || interaction.user.username}**`);
                    });

                    return;
                } else {
                    // If the guild is on a cooldown
                    return interaction.reply(`Please wait 24 hours in between backups`);
                }

            case 'info':
                const failEmb = new Discord.MessageEmbed()
                    .setTitle("Server Backups")
                    .setColor(config.embedColor)
                    .setDescription(`Use \`/backup create\` to create a backup, and \`/backup restore <id>\` to restore a backup`)
                    .addField("What Happens When a Backup is Restored?", `When restoring a backup, all server data will be wiped and replaced by the data in the backup. This includes messages, settings, channels, roles, pins, etc. Only the last ${maxMsgCount} messages in each channel are backed up. If there's anything you want to save, be sure to create a fresh backup before restoring`);

                return interaction.reply({
                    embeds: [failEmb]
                });

            case 'restore':
                const id = interaction.options.getString('id');

                // Generate a random four digit code
                var code = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);

                await interaction.reply(`Are you sure you want to restore the backup? This will delete **ALL** data on the server and replace it with the data in the backup. This includes messages, channels, roles, bans, server settings, emojis, etc \n\nIf you're sure you want to restore the backup, type **${code}** within 45 seconds`);

                // Make sure the message comes from the author and includes the code we generated earlier
                const filter = m => m.content === code && m.author.id === interaction.user.id;

                interaction.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 45000,
                    errors: ['time']
                }).then(async collected => {
                    await interaction.editReply(`${emojis.loading} Restoring the backup... This can take up to a few hours. Please don't touch anything during the restore, as that can mess things up and cause your restore to fail.`);
                    
                    // Load the backup
                    backup.load(id, interaction.member.guild, {
                        clearGuildBeforeRestore: true,
                        maxMessagesPerChannel: maxMsgCount
                    }).then(() => {
                        interaction.editReply("✅ Done! Go check out your newly-restored server!").catch(e => {
                            interaction.channel.send("✅ Done! Go check out your newly-restored server!");
                        });
                    }).catch(e => {
                        // If there was an error, assume the code was wrong
                        return interaction.reply("That isn't a valid backup ID!").catch(e => {
                            // console.log(e);
                        });
                    });
                }).catch(e => {
                    return interaction.editReply("No answer was given, so the restore was cancelled");
                });

                break;
        }
    },
};