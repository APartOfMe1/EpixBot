const emojiRegex = require('emoji-regex/RGI_Emoji.js');

module.exports = {
    name: 'emoji',
    description: 'Get the url for a given emoji',
    aliases: ["big", "enlarge"],
    category: 'Utilities',
    async execute(msg, args) {
        const emojiArr = [];

        const links = [];

        if (!args[0]) { // Make sure input was provided at all
            return msg.channel.send("You need to provide an emoji!");
        };

        if (emojiRegex().exec(args[0])) { // Check if it's a default emoji
            return msg.channel.send("This command only works with custom emoji. Place a `\\` before that emoji for a version of it that can be copy/pasted");
        };

        for (const i of args) { // Check each argument to see if it's an emoji
            if (i.match(/a?:[^:\s]*(?:::[^:\s]*)*:/g)) {
                emojiArr.push(i);
            };
        };

        if (!emojiArr.length) {
            return msg.channel.send("You need to provide an emoji!");
        };

        for (const emoji of emojiArr) { // Get each emojis' ID and check if it's animated
            if (emoji.match(/a:[^:\s]*(?:::[^:\s]*)*:/g)) {
                links.push(`https://cdn.discordapp.com/emojis/${emoji.split(/a:[^:\s]*(?:::[^:\s]*)*:/g)[1].replace(/>.*/g, "")}.gif`);
            } else if (emoji.match(/:[^:\s]*(?:::[^:\s]*)*:/g)) {
                links.push(`https://cdn.discordapp.com/emojis/${emoji.split(/:[^:\s]*(?:::[^:\s]*)*:/g)[1].replace(/>.*/g, "")}.png`);
            };
        };

        if (links.length) { // Split the message if it's over the character limit
            return msg.channel.send(links.join("\n").slice(0, 2000));
        };
    },
};