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
        if (!isChatting.includes(msg.channel.id)) { //Check if a chat is going on in the current channel
            var log = []; //Set a blank array for the log. Interactions are logged to provide context later

            isChatting.push(msg.channel.id); //Add the channel to the array

            chatters[msg.channel.id] = [];

            chatters[msg.channel.id].push(msg.author.id); //Add the user to the array

            const startEmb = new Discord.MessageEmbed()
                .setColor(config.errorchannel)
                .setAuthor(`${msg.guild.members.cache.get(msg.author.id).displayName} started a chat. Say hi!`, msg.author.avatarURL())
                .setDescription("Other members can join the conversation by running the command themselves! Use the command again to leave the conversation")
                .setFooter(`${config.name} | The conversation will automatically time out in 30 minutes`, client.user.avatarURL());

            msg.channel.send({
                embed: startEmb
            });

            return chat(log); //Actually start the chat
        } else if (isChatting.includes(msg.channel.id) && !chatters[msg.channel.id].includes(msg.author.id)) { //Check if there's a chat going on, and the member isn't in it
            setTimeout(() => { //Set a timeout so the bot doesn't respond to the command itself
                chatters[msg.channel.id].push(msg.author.id); //Add the user to the array
            }, 500);

            const joinEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(msg.guild.members.cache.get(msg.author.id).displayName, msg.author.avatarURL())
                .setTitle("You joined the chat! Use the command again to leave the conversation")
                .setFooter(config.name, client.user.avatarURL());

            msg.channel.send({
                embed: joinEmb
            });
        };

        function chat(log) {
            const filter = m => m.content && chatters[m.channel.id].includes(m.author.id);

            const collector = msg.channel.createMessageCollector(filter, {
                time: 1800000
            });

            collector.on("collect", m => {
                if (m.content.toLowerCase() === `${config.prefix}chat` || m.content.toLowerCase() === `${client.settings.get(msg.guild.id).prefix}chat`) {
                    removeUser(m.author);

                    if (chatters[msg.channel.id].length < 1) { //End the chat if there's no one left
                        return collector.stop();
                    };

                    return;
                };

                log.push(m.content); //Add the message to the log

                msg.channel.startTyping(); //Start typing to make the bot seem more humanlike

                cleverbot(m.content, log.slice(0, -1)).then(response => { //Clever the bot
                    log.push(response); //Log the response

                    msg.channel.stopTyping(); //Stop typing if discord didn't automatically do that

                    const responseEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setDescription(response)
                        .setFooter(`${config.name} | Use "${client.settings.get(msg.guild.id).prefix}chat" to join/leave the conversation!`, client.user.avatarURL());

                    return msg.channel.send({
                        embed: responseEmb
                    });
                });
            });

            collector.on("end", () => { //End the chat once time expires
                return endChat();
            });
        };

        function removeUser(user) {
            chatters[msg.channel.id].splice(chatters[msg.channel.id].indexOf(chatters[msg.channel.id].find(u => u === user.id)), 1); //Remove the user from the array

            const leaveEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor(msg.guild.members.cache.get(user.id).displayName, user.avatarURL())
                .setTitle("You left the conversation!")
                .setFooter(config.name, client.user.avatarURL());

            if (chatters[msg.channel.id].length > 0) { //Only send the message if there's another chatter. This is to avoid spam in the channel
                return msg.channel.send({
                    embed: leaveEmb
                });
            };

            return;
        };

        function endChat() {
            isChatting.splice(isChatting.findIndex(g => g === msg.channel.id), 1); //Remove the channel from the array

            chatters[msg.channel.id] = []; //Reset the list of chatters

            const endEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("The chat has ended. Thanks for the great conversation!")
                .setFooter(config.name, client.user.avatarURL());

            return msg.channel.send({
                embed: endEmb
            });
        };
    },
};