const config = require("../../config/config.json");
const filter = require("../../handlers/Filter/filter.js");

module.exports = {
    name: 'actas',
    description: 'Act as another user',
    category: 'Utilities',
    usage: '`{prefix}actas <@user> <message>`',
    examples: '`{prefix}actas @A part of me#0412 no u`',
    async execute(msg, args) {
        var member = msg.mentions.users.first(); //Get the user mentioned

        var toSend = args.slice(1).join(" "); //Get the message to be sent

        if (!member || !toSend) { //Send an error if needed
            return msg.channel.send(`Please use the format \`${config.prefix}actas <@user> <message>\``);
        };

        toSend = filter(toSend);

        msg.delete(); //Delete the original message

        var wb = await msg.channel.createWebhook(msg.mentions.members.first().displayName, {
            avatar: member.avatarURL()
        });

        wb.send(toSend); //Send the message with the webhook

        setTimeout(() => { //Delete the webhook after half a second
            wb.delete();
        }, 500);
    },
};