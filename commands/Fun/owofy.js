const owofy = require('owoify-js').default;

module.exports = {
    name: 'owofy',
    description: 'OwOfy text. You can owofy either the last message sent or your own message',
    category: 'Fun',
    usage: '`{prefix}owofy` or `{prefix}owofy <text>`',
    examples: '`{prefix}owofy never gonna give you up`',
    async execute(msg, args) {
        // If no message was provided
        if (!args.join(" ")) {
            // Get the last message sent
            await msg.channel.messages.fetch({
                limit: 2
            }).then(message => {
                var text = owofy(message.last().content, "uwu");

                // Split the message if it's over 2000 characters
                for (let i = 0; i < text.length; i += 2000) {
                    var toSend = text.substring(i, Math.min(text.length, i + 2000));

                    msg.channel.send(toSend);
                }

                return;
            }).catch(e => {
                return msg.channel.send("I couldn't find the last message sent. Try running the command again!");
            });
        } else {
            var text = owofy(args.join(" "), "uwu");

            // Split the message if it's over 2000 characters
            for (let i = 0; i < text.length; i += 2000) {
                var toSend = text.substring(i, Math.min(text.length, i + 2000));

                msg.channel.send(toSend);

                return;
            }
        }
    },
};