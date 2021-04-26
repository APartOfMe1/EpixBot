const Discord = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
    name: 'avatar',
    description: 'Get a users avatar',
    category: 'Utilities',
    usage: '`{prefix}avatar` or `{prefix}avatar <nickname/username/@user/id>`',
    examples: '`{prefix}avatar @A part of me#0412` or `{prefix}avatar A part of me`',
    async execute(msg, args) {
        var member = msg.mentions.users.first() || client.users.cache.get(args[0]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())); //Search for the member by mention, id, nickname, or username

        if (!member && args[0]) { //Send an error if no user was found
            return msg.channel.send('I couldn\'t find that user!');
        };

        if (!args[0]) { //If no user was given, default to the message author
            member = msg.author;
        };

        var genMsg = await msg.channel.send("Generating avatar..."); //Send a temporary loading message

        const embed = new Discord.MessageEmbed() //Set an embed with the avatar as an attachment
            .setTitle(`${client.users.cache.get(member.id).username}'s avatar!`)
            .setColor(config.embedColor)
            .setDescription(`[Click here for a direct link](${client.users.cache.get(member.id).avatarURL({
                dynamic: true,
                format: 'png',
                size: 1024
            })})`)
            .setImage(client.users.cache.get(member.id).avatarURL({
                dynamic: true,
                format: 'png',
                size: 1024
            }));

        await genMsg.edit(``, { //Edit the message
            embed
        });
    },
};