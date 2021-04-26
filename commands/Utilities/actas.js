const config = require("../../config/config.json");

module.exports = {
    name: 'actas',
    description: 'Act as another user',
    category: 'Utilities',
    usage: '`{prefix}actas <@user> <message>`',
    examples: '`{prefix}actas @A part of me#0412 no u`',
    async execute(msg, args) {
        let member = msg.mentions.users.first(); //Get the user mentioned

        let reason = args.slice(1).join(" "); //Get the message to be sent

        if (!member) { //Send an error if there was no user mentioned
            return msg.channel.send(`Please use the format \`${config.prefix}actas <@user> <message>\``);
        };

        if (!reason) { //Send an error if there was no message specified
            return msg.channel.send(`Please use the format \`${config.prefix}actas <@user> <message>\``);
        };

        if (reason.includes('@everyone')) { //Send an error if the message includes an everyone/here ping
            return msg.reply("It seems that your message included an everyone ping, therefore it couldn't be sent.");
        };

        if (reason.includes('@here')) {
            return msg.reply("It seems that your message included a here ping, therefore it couldn't be sent.");
        };

        msg.delete(); //Delete the original message

        var wbs = await msg.channel.fetchWebhooks(); //Get the channel's webhooks

        if (wbs.size < 1) var wb = await msg.channel.createWebhook(msg.mentions.members.first().displayName, { //If there's already a webhook, create another one? Idk, it works and I don't feel like changing it
            avatar: member.avatarURL()
        });

        else var wb = await msg.channel.createWebhook(msg.mentions.members.first().displayName, {
            avatar: member.avatarURL()
        });

        wb.send(reason); //Send the message with the webhook

        setTimeout(() => { //Delete the webhook after half a second
            wb.delete();
        }, 500);
    },
};