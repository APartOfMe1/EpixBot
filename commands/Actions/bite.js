const fs = require('fs');
const dir = "./assets/images/gifs/bite";

module.exports = {
    name: 'bite',
    description: 'Bite a user!',
    category: 'Actions',
    usage: '`{prefix}bite @user` or `{prefix}bite username`',
    examples: '`{prefix}bite @A part of me#0412` or `{prefix}bite A part of me`',
    async execute(msg, args) {
        // Search for the member by mention, id, nickname, or username
        let member = msg.mentions.users.first() || client.users.cache.get(args[0]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase()));

        // Send an error if no user was found
        if (!member || !args[0]) {
            return msg.channel.send('I couldn\'t find that user!');
        }

        // Get the members nickname
        let nick = msg.guild.members.cache.get(member.id).displayName;

        // Get the nickname of the message author
        let auth = msg.guild.members.cache.get(msg.author.id).displayName;

        // Set an array of all gifs in the folder
        let gifArr = fs.readdirSync(dir);

        // Choose a random image from the list and send it as an attachment
        let gif = `${dir}/${gifArr[Math.floor(Math.random() * gifArr.length)]}`;

        msg.channel.send({
            content: `**${auth}** bit **${nick}**!`,
            files: [gif]
        });
    },
};