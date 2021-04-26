const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'bal',
    description: 'Check your current level and balance. You can also mention someone else or give their ID to check the stats of others!',
    category: 'Monetary',
    aliases: ["lvl", "level", "balance"],
    usage: '`{prefix}bal` or `{prefix}bal @user` or `{prefix}bal <user id>`',
    examples: '`{prefix}bal @A part of me#0412` or `{prefix}bal 277137613775831050`',
    async execute(msg, args) {
        var user = msg.mentions.users.first() || client.users.cache.get(args[0]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())); //Search for the member by mention, id, nickname, or username

        if (!user && args[0]) { //If no user was specified, use the message author
            return msg.channel.send("I couldn't find that user!");
        };

        if (!args[0]) {
            user = msg.author;
        };

        client.db.points.ensure(`${msg.guild.id}-${user.id}`, { //Ensure that the enmap includes the user and has the default settings
            user: msg.author.id,
            guild: msg.guild.id,
            points: 0,
            level: 1
        });

        client.db.credits.ensure(user.id, { //Set the default settings for credits
            user: msg.author.id,
            credits: 0,
            streak: 0,
            totalcredits: 0,
            totaldailies: 0
        });

        const key = `${msg.guild.id}-${user.id}`; //Set the key so I don't have to type it out again later lol

        const embed = new Discord.MessageEmbed() //Format the message
            .setColor(config.embedColor)
            .setTitle(`**${msg.guild.members.cache.get(user.id).displayName}'s** stats`)
            .addField("Points", `\`\`\`${client.db.points.get(key, "points")} (level: ${client.db.points.get(key, "level")})\`\`\``, true)
            .addField("Credits", `\`\`\`${client.db.credits.get(user.id, "credits")} (streak: ${client.db.credits.get(user.id, "streak")})\`\`\``, true)
            .addField("All-Time Stats", `\`\`\`Total times daily was used: ${client.db.credits.get(user.id, "totaldailies")} \n\nAll-time credits: ${client.db.credits.get(user.id, "totalcredits")}\`\`\``);

        return msg.channel.send({
            embed
        });
    },
};