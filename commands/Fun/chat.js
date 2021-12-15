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
    async execute(msg, args) {
        // Check if a chat is going on in the current channel
        if (!isChatting.includes(msg.channel.id)) {
            // Set a blank array for the log. Interactions are logged to provide context later
            var log = [];

            // Add the channel to the array
            isChatting.push(msg.channel.id);

            chatters[msg.channel.id] = [];

            // Add the user to the array
            chatters[msg.channel.id].push(msg.author.id);

            const startEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(`${msg.guild.members.cache.get(msg.author.id).displayName} started a chat. Say hi!`, msg.author.avatarURL())
                .setDescription("Other members can join the conversation by running the command themselves! Use the command again to leave the conversation")
                .setFooter(`${config.name} | The conversation will automatically time out in 30 minutes`, client.user.avatarURL());

            msg.channel.send({
                embeds: [startEmb]
            });

            // Actually start the chat
            return chat(log);
        } else if (isChatting.includes(msg.channel.id) && !chatters[msg.channel.id].includes(msg.author.id)) {
            // Set a timeout so the bot doesn't respond to the command itself
            setTimeout(() => {
                // Add the user to the array
                chatters[msg.channel.id].push(msg.author.id);
            }, 500);

            const joinEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(msg.guild.members.cache.get(msg.author.id).displayName, msg.author.avatarURL())
                .setTitle("You joined the chat! Use the command again to leave the conversation")
                .setFooter(config.name, client.user.avatarURL());

            msg.channel.send({
                embeds: [joinEmb]
            });
        }

        function chat(log) {
            const filter = m => m.content && chatters[m.channel.id].includes(m.author.id);

            const collector = msg.channel.createMessageCollector({
                filter,
                time: 1800000
            });

            collector.on("collect", m => {
                if (m.content.toLowerCase() === `${config.prefix}chat` || m.content.toLowerCase() === `${client.db.settings.get(msg.guild.id).prefix}chat`) {
                    removeUser(m.author);

                    // End the chat if there's no one left
                    if (chatters[msg.channel.id].length < 1) {
                        return collector.stop();
                    }

                    return;
                }

                // Add the message to the log
                log.push(m.content);

                // Start typing to make the bot seem more humanlike
                msg.channel.sendTyping();

                // Clever the bot
                cleverbot(m.content, log.slice(0, -1)).then(response => {
                    // Log the response
                    log.push(response);

                    const responseEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setDescription(response)
                        .setFooter(`${config.name} | Use "${client.db.settings.get(msg.guild.id).prefix}chat" to join/leave the conversation!`, client.user.avatarURL());

                    return msg.channel.send({
                        embeds: [responseEmb]
                    });
                });
            });

            // End the chat once time expires
            collector.on("end", () => {
                return endChat();
            });
        }

        function removeUser(user) {
            // Remove the user from the array
            chatters[msg.channel.id].splice(chatters[msg.channel.id].indexOf(chatters[msg.channel.id].find(u => u === user.id)), 1);

            const leaveEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(msg.guild.members.cache.get(user.id).displayName, user.avatarURL())
                .setTitle("You left the conversation!")
                .setFooter(config.name, client.user.avatarURL());

            // Only send the message if there's another chatter. This is to avoid spam in the channel
            if (chatters[msg.channel.id].length > 0) {
                return msg.channel.send({
                    embeds: [leaveEmb]
                });
            }

            return;
        }

        function endChat() {
            // Remove the channel from the array
            isChatting.splice(isChatting.findIndex(g => g === msg.channel.id), 1);

            // Reset the list of chatters
            chatters[msg.channel.id] = [];

            const endEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("The chat has ended. Thanks for the great conversation!")
                .setFooter(config.name, client.user.avatarURL());

            return msg.channel.send({
                embeds: [endEmb]
            });
        }
    },
};