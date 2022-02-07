var Discord = require('discord.js');
const cleverbot = require("cleverbot-free");
const config = require("../../config/config.json");
var isChatting = [];
var chatters = {};

module.exports = {
    name: 'chat',
    description: 'Chat with the bot! Others can join in on the conversation by using the command themselves',
    aliases: ["cleverbot", "cb"],
    category: 'Fun',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        // Check if a chat is going on in the current channel
        if (!isChatting.includes(interaction.channelId)) {
            // Set a blank array for the log. Interactions are logged to provide context later
            var log = [];

            // Add the channel to the array
            isChatting.push(interaction.channelId);

            chatters[interaction.channelId] = [];

            // Add the user to the array
            chatters[interaction.channelId].push(interaction.user.id);

            const startEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(`${interaction.member.guild.members.cache.get(interaction.user.id).displayName} started a chat. Say hi!`, interaction.user.displayAvatarURL())
                .setDescription("Other members can join the conversation by running the command themselves!")
                .setFooter(`${config.name} | The conversation will automatically time out in 30 minutes`, client.user.avatarURL());

            interaction.reply({
                embeds: [startEmb]
            });

            // Actually start the chat
            return chat(log, interaction);
        } else if (isChatting.includes(interaction.channelId) && !chatters[interaction.channelId].includes(interaction.user.id)) {
            // Set a timeout so the bot doesn't respond to the command itself
            setTimeout(() => {
                // Add the user to the array
                chatters[interaction.channelId].push(interaction.user.id);
            }, 500);

            const joinEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(interaction.member.guild.members.cache.get(interaction.user.id).displayName, interaction.user.displayAvatarURL())
                .setTitle(`You joined the chat! Use '${config.prefix}leavechat' to leave the conversation`)
                .setFooter(config.name, client.user.avatarURL());

            return interaction.reply({
                embeds: [joinEmb]
            });
        } else {
            return interaction.reply('You\'re already in the conversation!');
        }

        function chat(log, interaction) {
            const filter = m => m.content && chatters[m.channel.id].includes(m.author.id);

            const collector = interaction.channel.createMessageCollector({
                filter,
                time: 1800000
            });

            collector.on("collect", m => {
                if (m.content.toLowerCase() === `${config.prefix}leavechat` || m.content.toLowerCase() === `${client.db.settings.get(interaction.guildId).prefix}leavechat`) {
                    removeUser(m.author, interaction);

                    // End the chat if there's no one left
                    if (chatters[interaction.channelId].length < 1) {
                        return collector.stop();
                    }

                    return;
                }

                // Add the message to the log
                log.push(m.content);

                // Start typing to make the bot seem more humanlike
                interaction.channel.sendTyping();

                // Clever the bot
                cleverbot(m.content, log.slice(0, -1)).then(response => {
                    // Log the response
                    log.push(response);

                    const responseEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setDescription(response)
                        .setFooter(`${config.name} | Use "${config.prefix}leavechat" to leave the conversation`, client.user.avatarURL());

                    return interaction.channel.send({
                        embeds: [responseEmb]
                    });
                });
            });

            // End the chat once time expires
            collector.on("end", () => {
                return endChat(interaction);
            });
        }

        function removeUser(user, interaction) {
            // Remove the user from the array
            chatters[interaction.channelId].splice(chatters[interaction.channelId].indexOf(chatters[interaction.channelId].find(u => u === user.id)), 1);

            const leaveEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(interaction.member.guild.members.cache.get(user.id).displayName, user.avatarURL())
                .setTitle("You left the conversation!")
                .setFooter(config.name, client.user.avatarURL());

            // Only send the message if there's another chatter. This is to avoid spam in the channel
            if (chatters[interaction.channelId].length > 0) {
                return interaction.channel.send({
                    embeds: [leaveEmb]
                });
            }

            return;
        }

        function endChat(interaction) {
            // Remove the channel from the array
            isChatting.splice(isChatting.findIndex(g => g === interaction.channelId), 1);

            // Reset the list of chatters
            chatters[interaction.channelId] = [];

            const endEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("The chat has ended. Thanks for the great conversation!")
                .setFooter(config.name, client.user.avatarURL());

            return interaction.channel.send({
                embeds: [endEmb]
            });
        }
    },
};