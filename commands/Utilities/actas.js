const config = require("../../config/config.json");
const filter = require("../../handlers/Filter/filter.js");

module.exports = {
    name: 'actas',
    description: 'Act as another user',
    category: 'Utilities',
    usage: '`{prefix}actas <@user> <message>`',
    examples: '`{prefix}actas @A part of me#0412 no u`',
    async execute(msg, args) {
        // Get the user mentioned
        var member = msg.mentions.users.first();

        // Get the message to be sent
        var toSend = args.slice(1).join(" ");

        if (!member || !toSend) {
            return msg.channel.send(`Please use the format \`${config.prefix}actas <@user> <message>\``);
        }

        toSend = filter(toSend);

        msg.delete();

        var wb = await msg.channel.createWebhook(msg.mentions.members.first().displayName, {
            avatar: member.avatarURL()
        });

        wb.send(toSend);

        // Delete the webhook after half a second
        setTimeout(() => {
            wb.delete();
        }, 500);
    },
};