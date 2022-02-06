const Discord = require('discord.js');
const config = require("../../config/config.json");
var isPlaying = {};

module.exports = {
    name: 'battle',
    description: 'Battle another user',
    category: 'Fun',
    aliases: ["deathbattle"],
    cooldown: 30000,
    usage: '`{prefix}battle` or `{prefix}battle <username/nickname/@user/id>`',
    examples: '`{prefix}battle @A part of me#0412`, `{prefix}battle A part of me` or `{prefix}battle 277137613775831050`',
    async execute(msg, args) {
        var actions = [
            "bites",
            "punches",
            "stabs",
            "drops a bomb on",
            "karate chops",
            "whips",
            "smacks",
            "kicks",
            "stares menacingly at",
            "throws a shuriken at"
        ];

        var actionArr = [
            ["hits", "with a hammer"],
            ["stabs", "with a sword"],
            ["burns", "with fire"],
            ["stabs", "with a knife"],
            ["forces", "to play sonic boom"],
            ["tells", "they're going to give them up"],
            ["shoots", "with a gun"],
            ["forces", "to watch Sword Art Online"]
        ];

        var endWords = [
            "which dealt",
            "dealing",
            "for",
            "causing",
            "inflicting",
            "leading to",
            "resulting in",
        ];

        var first3 = [];

        var turn = 1;

        var user1 = msg.guild.members.cache.get(msg.author.id);

        // Search for a user by username, nickname, mention, id, or just choose a random one
        var user2 = msg.mentions.users.first() || client.users.cache.get(args[0]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.random().user;

        var health1 = 100;

        var health2 = 100;

        // Check if a game is currently going on in the channel
        if (isPlaying[msg.channel.id] === true) {
            return msg.channel.send("There's already a battle happening in this channel!");
        }

        // Make sure we don't search for a user when we don't need to
        if (!args[1]) {
            user2 = msg.guild.members.cache.random().user;
        }

        // Set the status to true
        isPlaying[msg.channel.id] = true;

        // Send a message we can edit later with the game info
        var battleMsg = await msg.channel.send("Starting battle...");

        // Repeat every 1 and a half seconds
        var game = setInterval(() => {
            // Set the current damage output to 0
            var damage = 0;

            var crit = 0;

            // Get a number from 1-2 to determine which type of action should be used
            var actionType = Math.floor(Math.random() * (2 - 1 + 1)) + 1;

            var action = '';

            // Check whose turn it is
            if (turn === 1) {
                // Advance the turn
                turn = 2;

                // Get the amount of damage to be dealt. This can be anywhere from 1 to 15
                damage = Math.floor(Math.random() * (15 - 1 + 1)) + 1;

                // Get a random number from -25 to 5
                crit = Math.floor(Math.random() * (5 - -55 + 1)) + -55;

                // Check what action type should be used
                if (actionType === 1) {
                    action = `**${user1.displayName}** ${actions[Math.floor(Math.random() * (actions.length - 1) + 1)]} **${msg.guild.members.cache.get(user2.id).displayName}**, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                } else {
                    action = actionArr[Math.floor(Math.random() * (actionArr.length - 1) + 1)];

                    action = `**${user1.displayName}** ${action[0]} **${msg.guild.members.cache.get(user2.id).displayName}** ${action[1]}, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                }

                // Check if the number is positive. If it is, treat the turn as a critical hit
                if (crit > 0) {
                    // Multiply damage by the crit number
                    damage = damage * crit;

                    // Set the health
                    health2 = health2 - damage;

                    // Push the message to the array
                    first3.push(`${action} ${damage} damage. A critical hit!`);
                } else {
                    // Set the health
                    health2 = health2 - damage;

                    // Push the message to the array
                    first3.push(`${action} ${damage} damage`);
                }

                // Check if the health is at/below 0
                if (health2 < 1) {
                    // Stop making new actions
                    clearInterval(game);

                    // Set the game status
                    isPlaying[msg.channel.id] = false;

                    // Make sure the health doesn't have a negative value
                    health2 = 0;

                    var gameEmb = new Discord.MessageEmbed()
                        .setTitle("Battle")
                        .setDescription(`**${user1.displayName}** won the battle!`)
                        .setColor(config.embedColor)
                        .addField("Game", first3.slice(Math.max(first3.length - 3, 0)).join("\n"))
                        .addField(`${user1.displayName}'s Health`, `${health1}/100`, true)
                        .addField(`${msg.guild.members.cache.get(user2.id).displayName}'s Health`, `${health2}/100`, true)
                        .setFooter(config.name, client.user.avatarURL());

                    return battleMsg.edit({
                        content: null,
                        embeds: [gameEmb]
                    });
                }

                var gameEmb = new Discord.MessageEmbed()
                    .setTitle("Battle")
                    .setColor(config.embedColor)
                    .addField("Game", first3.slice(Math.max(first3.length - 3, 0)).join("\n"))
                    .addField(`${user1.displayName}'s Health`, `${health1}/100`, true)
                    .addField(`${msg.guild.members.cache.get(user2.id).displayName}'s Health`, `${health2}/100`, true)
                    .setFooter(config.name, client.user.avatarURL());

                battleMsg.edit({ // Edit the message to show the embed
                    content: null,
                    embeds: [gameEmb]
                });
            } else {
                // This is all the same as above, just for the other player
                // Because the first rule of coding is to duplicate code as much as possible amirite?
                turn = 1;

                damage = Math.floor(Math.random() * (15 - 1 + 1)) + 1;

                crit = Math.floor(Math.random() * (5 - -55 + 1)) + -55;

                if (actionType === 1) {
                    action = `**${msg.guild.members.cache.get(user2.id).displayName}** ${actions[Math.floor(Math.random() * (actions.length - 1) + 1)]} **${user1.displayName}**, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                } else {
                    action = actionArr[Math.floor(Math.random() * (actionArr.length - 1) + 1)];

                    action = `**${msg.guild.members.cache.get(user2.id).displayName}** ${action[0]} **${user1.displayName}** ${action[1]}, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                }

                if (crit > 0) {
                    damage = damage * crit;

                    health1 = health1 - damage;

                    first3.push(`${action} ${damage} damage. A critical hit!`);
                } else {
                    health1 = health1 - damage;

                    first3.push(`${action} ${damage} damage`);
                }

                if (health1 < 1) {
                    clearInterval(game);

                    isPlaying[msg.channel.id] = false;

                    health1 = 0;

                    var gameEmb = new Discord.MessageEmbed()
                        .setTitle("Battle")
                        .setDescription(`**${msg.guild.members.cache.get(user2.id).displayName}** won the battle!`)
                        .setColor(config.embedColor)
                        .addField("Game", first3.slice(Math.max(first3.length - 3, 0)).join("\n"))
                        .addField(`${user1.displayName}'s Health`, `${health1}/100`, true)
                        .addField(`${msg.guild.members.cache.get(user2.id).displayName}'s Health`, `${health2}/100`, true)
                        .setFooter(config.name, client.user.avatarURL());;

                    return battleMsg.edit({
                        embeds: [gameEmb]
                    });
                }

                var gameEmb = new Discord.MessageEmbed()
                    .setTitle("Battle")
                    .setColor(config.embedColor)
                    .addField("Game", first3.slice(Math.max(first3.length - 3, 0)).join("\n"))
                    .addField(`${user1.displayName}'s Health`, `${health1}/100`, true)
                    .addField(`${msg.guild.members.cache.get(user2.id).displayName}'s Health`, `${health2}/100`, true)
                    .setFooter(config.name, client.user.avatarURL());

                battleMsg.edit({
                    embeds: [gameEmb]
                });
            }
        }, 2000);
    },
};