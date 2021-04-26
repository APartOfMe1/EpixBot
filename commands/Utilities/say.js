module.exports = {
    name: 'say',
    description: 'Make the bot say something',
    category: 'Utilities',
    usage: '`{prefix}say <message>`',
    examples: '`{prefix}say never gonna give you up`',
    async execute(msg, args) {
        if (!args[0]) { //Give an error if no message was provided
            return msg.channel.send("You need to give me something to say!");
        };

        if (msg.content.includes('@everyone')) { //Give an error if a ping was included in the message
            return msg.reply("It seems that your message included an everyone ping, therefore it couldn't be sent.");
        };

        if (msg.content.includes('@here')) {
            return msg.reply("It seems that your message included a here ping, therefore it couldn't be sent.");
        };

        msg.delete(); //Delete the original message

        return msg.channel.send(args.join(" "));
    },
};