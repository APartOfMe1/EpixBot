var Discord = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
    name: 'send',
    description: 'Send an embed in a channel',
    category: 'Utilities',
    usage: '`{prefix}send <#channel> <message>`',
    examples: '`{prefix}send #general hi!`',
    async execute(msg, args) {

        var message = args.slice(1).join(' '); // Get the message

        var chnl = msg.mentions.channels.first(); // Get the mentioned channel

        if (!chnl) { // Send an error if there was no channel mentioned
            return msg.channel.send(`That's not a channel! The correct format is \`${config.prefix}send <#channel> <message>\``);
        }

        if (!chnl.permissionsFor(msg.member).has('SEND_MESSAGES')) { // Send an error if the message author can't send messages to the specified channel
            return msg.reply("Sorry! You don't have permission to use this command in that channel");
        }

        if (!message) { // Send an error if there is no message provided
            return msg.channel.send(`You need to give me something to say! The correct format is \`${config.prefix}send <#channel> <message>\``);
        }

        if (message.includes('@everyone')) { // Send an error if the message includes an everyone/here ping
            return msg.reply("It seems that your message included an everyone ping, therefore it couldn't be sent.");
        }

        if (message.includes('@here')) {
            return msg.reply("It seems that your message included a here ping, therefore it couldn't be sent.");
        }

        const embed = new Discord.MessageEmbed() // Set up an embed and send it to the specified channel
            .setDescription(message)
            .setColor(config.embedColor);

        return chnl.send({
            embeds: [embed]
        });
    },
};