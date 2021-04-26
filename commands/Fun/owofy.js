const owofy = require('owoify-js').default;

module.exports = {
    name: 'owofy',
    description: 'OwOfy text. You can owofy either the last message sent or your own message',
    category: 'Fun',
    usage: '`{prefix}owofy` or `{prefix}owofy <text>`',
    examples: '`{prefix}owofy never gonna give you up`',
    async execute(msg, args) {
        if (!args.join(" ")) { //If no message was provided
            await msg.channel.messages.fetch({ //Get the last message sent
                    limit: 2
                }).then(message => {
                    var text = owofy(message.last().content, "uwu");

                    for (let i = 0; i < text.length; i += 2000) { //Split the message if it's over 2000 characters
                        var toSend = text.substring(i, Math.min(text.length, i + 2000));

                        msg.channel.send(toSend);
                    };

                    return;
                })
                .catch(e => {
                    return msg.channel.send("I couldn't find the last message sent. Try running the command again!");
                });
        } else {
            var text = owofy(args.join(" "), "uwu");

            for (let i = 0; i < text.length; i += 2000) { //Split the message if it's over 2000 characters
                var toSend = text.substring(i, Math.min(text.length, i + 2000));

                msg.channel.send(toSend);

                return;
            };
        };
    },
};