const config = require('../config/config.json');
const Discord = require('discord.js');
const filter = require('../utilities/filter.js');

module.exports = {
    async deleted(msg) {
        let guildModel = await client.db.Guilds.getGuildById(msg.guild.id);

        if (verify(msg, null, guildModel)) {
            try {
                const chnl = client.channels.cache.get(guildModel.log_channel);

                return chnl.send(`Message sent by **${msg.author.tag}** in ${msg.channel} was deleted \`\`\`diff\n-${filter(msg.content)}\`\`\``);
            } catch (error) {
                return;
            }
        }
    },

    async edited(oldmsg, newmsg) {
        let guildModel = await client.db.Guilds.getGuildById(oldmsg.guild.id);

        if (verify(oldmsg, null, guildModel)) {
            try {
                const chnl = client.channels.cache.get(guildModel.log_channel);

                const differences = diffFormat(oldmsg.content, newmsg.content);

                const editEmb = new Discord.EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle("Message Edited")
                    .setDescription(`A message sent by **${oldmsg.author.username}** in ${oldmsg.channel} was edited\n\nBlue brackets indicate sentences that have been changed, added, or deleted`)
                    .addFields(
                        {name: 'Old Message', value: `\`\`\`ini\n${filterMsg(differences[0], "edited")}\`\`\``, inline: true},
                        {name: 'New Message', value: `\`\`\`ini\n${filterMsg(differences[1], "edited")}\`\`\``, inline: true},
                    );

                return chnl.send({
                    embeds: [editEmb]
                });
            } catch (error) {
                console.log(error)
                return;
            }
        }
    },

    async memberLeft(member) {
        let guildModel = await client.db.Guilds.getGuildById(oldmsg.guild.id);

        if (verify(member, "memberChange", guildModel)) {
            try {
                const chnl = client.channels.cache.get(guildModel.log_channel);

                return chnl.send(`${client.users.cache.get(member.id).tag} (${member.id}) has left ${member.guild}`);
            } catch (error) {
                return;
            };
        };
    },

    async memberJoined(member) {
        let guildModel = await client.db.Guilds.getGuildById(oldmsg.guild.id);

        if (verify(member, "memberChange", guildModel)) {
            try {
                const chnl = client.channels.cache.get(guildModel.log_channel);

                return chnl.send(`${client.users.cache.get(member.id).tag} (${member.id}) joined ${member.guild}`);
            } catch (error) {
                return;
            };
        };
    }
}

// Highlight differences between messages
function diffFormat(str1, str2) {
    const differences = [];

    // Split the strings into individual sentences if applicable
    const arr1 = str1.split(/(?<=[.?!])/g);
    const arr2 = str2.split(/(?<=[.?!])/g);

    // Determine which array is longer
    let longest = arr1.length;

    if (arr1.length < arr2.length) {
        longest = arr2.length;
    };

    // Actually find the differences
    for (let i = 0; i < longest; i++) {
        if (arr2[i] && !arr1.includes(arr2[i])) { // Check for sentences that were edited or added
            differences.push({
                type: 'edited/added',
                text: arr2[i],
                index: i
            });
        } else if (arr1[i] && !arr2.includes(arr1[i])) { // Check for sentences that were removed
            differences.push({
                type: 'removed',
                text: arr1[i],
                index: i
            });
        };
    };

    // Format the strings to show changed sentences
    if (differences.length) {
        for (const difference of differences) {
            switch (difference.type) {
                case "edited/added":
                    if (arr2[difference.index].startsWith(" ")) {
                        arr2[difference.index] = ` [${arr2[difference.index].trimLeft()}]`;
                    } else {
                        arr2[difference.index] = `[${arr2[difference.index]}]`;
                    };

                    break;

                case "removed":
                    if (arr1[difference.index].startsWith(" ")) {
                        arr1[difference.index] = ` [${arr1[difference.index].trimLeft()}]`;
                    } else {
                        arr1[difference.index] = `[${arr1[difference.index]}]`;
                    };

                    break;
            };
        }
    };

    return [
        arr1.join(""),
        arr2.join("")
    ];
};

// Trim messages that are too long
function filterMsg(message, type) {
    let filteredMsg = filter(message);

    if (type === "edited" && filteredMsg.length > 850) {
        filteredMsg = filteredMsg.substring(0, 850) + `\n\n+${filteredMsg.length - 850} more characters`;
    } else if (filteredMsg.length > 1700) {
        filteredMsg = filteredMsg.substring(0, 1700) + `\n\n+${filteredMsg.length - 1700} more characters`;
    };

    return filteredMsg;
};

// Ensure we should actually log the change
function verify(msg, type, guildModel) {
    if (!msg.guild) {
        return false;
    };

    if (!msg.guild.available) {
        return false;
    };

    if (type !== "memberChange" && msg.author.bot) {
        return false;
    };

    // Check if the bot itself is the user that left the guild
    if (type === "memberChange" && msg.id === client.user.id) {
        return false;
    };

    if (!msg.guild.members.me.permissions.has(Discord.PermissionsBitField.Flags.SendMessages)) {
        return false;
    };

    if (guildModel.log_channel) {
        // TODO: ignored IDs once that's implemented

        // if (!ignoreids) {
        //     ignoreids = "None";
        // };

        // // Check if member/channel is ignored
        // if (type !== "memberChange" && ignoreids.includes(msg.author.id) || type !== "memberChange" && ignoreids.includes(msg.channel.id)) {
        //     return false;
        // };

        return true;
    };

    return false;
};