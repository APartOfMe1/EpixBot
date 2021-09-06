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

        var user2 = msg.mentions.users.first() || client.users.cache.get(args[0]) || msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.random().user; //Search for a user by username, nickname, mention, id, or just choose a random one

        var health1 = 100;

        var health2 = 100;

        if (isPlaying[msg.channel.id] === true) { //Check if a game is currently going on in the channel
            return msg.channel.send("There's already a battle happening in this channel!");
        };

        if (!args[1]) { //Make sure we don't search for a user when we don't need to
            user2 = msg.guild.members.cache.random().user;
        };

        isPlaying[msg.channel.id] = true; //Set the status to true

        var battleMsg = await msg.channel.send("Starting battle..."); //Send a message we can edit later with the game info

        var game = setInterval(() => { //Repeat every 1 and a half seconds
            var damage = 0; //Set the current damage output to 0

            var crit = 0;

            var actionType = Math.floor(Math.random() * (2 - 1 + 1)) + 1; //Get a number from 1-2 to determine which type of action should be used

            var action = '';

            if (turn === 1) { //Check whos turn it is
                turn = 2; //Advance the turn

                damage = Math.floor(Math.random() * (15 - 1 + 1)) + 1; //Get the amount of damage to be dealt. This can be anywhere from 1 to 15

                crit = Math.floor(Math.random() * (5 - -55 + 1)) + -55; //Get a random number from -25 to 5

                if (actionType === 1) { //Check what action type should be used
                    action = `**${user1.displayName}** ${actions[Math.floor(Math.random() * (actions.length - 1) + 1)]} **${msg.guild.members.cache.get(user2.id).displayName}**, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                } else {
                    action = actionArr[Math.floor(Math.random() * (actionArr.length - 1) + 1)];

                    action = `**${user1.displayName}** ${action[0]} **${msg.guild.members.cache.get(user2.id).displayName}** ${action[1]}, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                };

                if (crit > 0) { //Check if the number is positive. If it is, treat the turn as a critical hit
                    damage = damage * crit; //Multiply damage by the crit number

                    health2 = health2 - damage; //Set the health

                    first3.push(`${action} ${damage} damage. A critical hit!`); //Push the message to the array
                } else {
                    health2 = health2 - damage; //Set the health

                    first3.push(`${action} ${damage} damage`); //Push the message to the array
                };

                if (health2 < 1) { //Check if the health is at/below 0
                    clearInterval(game); //Stop making new actions

                    isPlaying[msg.channel.id] = false; //Set the game status

                    health2 = 0; //Make sure the health doesn't have a negative value

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
                };

                var gameEmb = new Discord.MessageEmbed()
                    .setTitle("Battle")
                    .setColor(config.embedColor)
                    .addField("Game", first3.slice(Math.max(first3.length - 3, 0)).join("\n")) //Get the last 3 items in the array. This lets the messages have a nice scrolling effect
                    .addField(`${user1.displayName}'s Health`, `${health1}/100`, true)
                    .addField(`${msg.guild.members.cache.get(user2.id).displayName}'s Health`, `${health2}/100`, true)
                    .setFooter(config.name, client.user.avatarURL());

                battleMsg.edit({ //Edit the message to show the embed
                    content: null,
                    embeds: [gameEmb]
                });
            } else { //This is all the same as above, just for the other player
                turn = 1;

                damage = Math.floor(Math.random() * (15 - 1 + 1)) + 1;

                crit = Math.floor(Math.random() * (5 - -55 + 1)) + -55;

                if (actionType === 1) {
                    action = `**${msg.guild.members.cache.get(user2.id).displayName}** ${actions[Math.floor(Math.random() * (actions.length - 1) + 1)]} **${user1.displayName}**, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                } else {
                    action = actionArr[Math.floor(Math.random() * (actionArr.length - 1) + 1)];

                    action = `**${msg.guild.members.cache.get(user2.id).displayName}** ${action[0]} **${user1.displayName}** ${action[1]}, ${endWords[Math.floor(Math.random() * (endWords.length - 1) + 1)]}`;
                };

                if (crit > 0) {
                    damage = damage * crit;

                    health1 = health1 - damage;

                    first3.push(`${action} ${damage} damage. A critical hit!`);
                } else {
                    health1 = health1 - damage;

                    first3.push(`${action} ${damage} damage`);
                };

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
                };

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
            };
        }, 2000);
    },
};