const config = require("../../../config/config.json");
const Discord = require("discord.js");
const filter = require("../../Filter/filter.js");

module.exports = {
    deleted(msg) {
        if (verify(msg)) {
            try {
                const chnl = getChannel(msg);

                return chnl.send(`Message sent by **${msg.author.tag}** in ${msg.channel} was deleted \`\`\`diff\n-${filterMsg(msg.content)}\`\`\``); // Send a message to the log channel
            } catch (error) { // Do nothing if the logchannel can't be reached. (If it was deleted or something)
                return;
            };
        };
    },

    edited(oldmsg, newmsg) {
        // Fix issue with link embeds triggering an edit
        if (oldmsg.content === newmsg.content) {
            return;
        };

        if (verify(oldmsg)) {
            try {
                const chnl = getChannel(oldmsg);

                const differences = diffFormat(oldmsg.content, newmsg.content);

                const editEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Message Edited")
                    .setDescription(`Message sent by **${oldmsg.author.tag}** in ${oldmsg.channel} was edited\n\nBlue brackets indicate sentences that have been changed, added, or deleted`)
                    .addField("Old Message", `\`\`\`ini\n${filterMsg(differences[0], "edited")}\`\`\``, true)
                    .addField("New Message", `\`\`\`ini\n${filterMsg(differences[1], "edited")}\`\`\``, true);

                return chnl.send({
                    embeds: [editEmb]
                });
            } catch (error) { // Do nothing if the logchannel can't be reached. (If it was deleted or something)
                return;
            };
        };
    },

    memberLeft(member) {
        if (verify(member, "memberChange")) {
            try {
                const chnl = getChannel(member);

                return chnl.send(`${client.users.cache.get(member.id).tag} (${member.id}) has left ${member.guild}`); // Send a message to the log channel
            } catch (error) { // Do nothing if the logchannel can't be reached. (If it was deleted or something)
                return;
            };
        };
    },

    memberJoined(member) {
        if (verify(member, "memberChange")) {
            try {
                const chnl = getChannel(member);

                return chnl.send(`${client.users.cache.get(member.id).tag} (${member.id}) joined ${member.guild}`); // Send a message to the log channel
            } catch (error) { // Do nothing if the logchannel can't be reached. (If it was deleted or something)
                return;
            };
        };
    }
};

function diffFormat(str1, str2) {
    const differences = [];

    // Split the strings into individual sentences if applicable
    const arr1 = str1.split(/(?<=[.?!])/g);

    const arr2 = str2.split(/(?<=[.?!])/g);

    // Determine which array is longer
    var longest = arr1.length;

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

    // Format the strings with quotes around the changed sentences
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

function getChannel(msg) { // We've already done the verification, so we only need to get the channel
    const logdefault = {
        chan: "disabled"
    };

    return client.channels.cache.get(client.db.logchannel.ensure(msg.guild.id, logdefault));
};

function filterMsg(message, type) {
    var filteredMsg = filter(message);

    if (type === "edited" && filteredMsg.length > 850) {
        filteredMsg = filteredMsg.substring(0, 850) + `\n\n+${filteredMsg.length - 850} more characters`;
    } else if (filteredMsg.length > 1700) {
        filteredMsg = filteredMsg.substring(0, 1700) + `\n\n+${filteredMsg.length - 1700} more characters`;
    };

    return filteredMsg;
};

function verify(msg, type) {
    const defaultSettings = {
        prefix: config.prefix,
        logs: "disabled"
    };

    if (!msg.guild) { // If the message wasn't sent in a guild, ignore it
        return false;
    };

    if (!msg.guild.available) { // Check if the guild is available
        return false;
    };

    if (type !== "memberChange" && msg.author.bot) { // If the message was sent by a bot, ignore it
        return false;
    };

    if (type === "memberChange" && msg.id === client.user.id) { // Check if the bot itself is the user that left the guild
        return false;
    };

    if (!msg.guild.me.permissions.has(Discord.Permissions.SEND_MESSAGES)) { // Send an error if the bot doesn't have permissions
        return false;
    };

    if (client.db.settings.ensure(msg.guild.id, defaultSettings).logs === "enabled") {
        var ignoreids = client.db.ignore.get(msg.guild.id); // Get the list of IDs that are being ignored from logging

        if (!ignoreids) { // Set this to avoid errors with .includes
            ignoreids = "None";
        };

        if (type !== "memberChange" && ignoreids.includes(msg.author.id) || type !== "memberChange" && ignoreids.includes(msg.channel.id)) { // Return if there are no IDs or the user/channel is ignored
            return false;
        };

        return true;
    };

    return false;
};