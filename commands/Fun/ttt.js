const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'ttt',
    description: 'Play a game of tic-tac-toe!',
    category: 'Fun',
    aliases: ["tictactoe", "tic-tac-toe"],
    cooldown: 60000,
    usage: '`{prefix}ttt <username/nickname/@user/id>`',
    examples: '`{prefix}ttt @A part of me#0412`, `{prefix}ttt A part of me` or `{prefix}ttt 277137613775831050`',
    async execute(msg, args) {
        var grid = [
            "1️⃣",
            " | ",
            "2️⃣",
            " | ",
            "3️⃣",
            "\n────────\n",
            "4️⃣",
            " | ",
            "5️⃣",
            " | ",
            "6️⃣",
            "\n────────\n",
            "7️⃣",
            " | ",
            "8️⃣",
            " | ",
            "9️⃣"
        ];

        reactionsArr = [
            "1️⃣",
            "2️⃣",
            "3️⃣",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣"
        ];

        var turn = "x";

        var turnNumber = 0;

        // Find a user by username, nickname, mention, or id
        var user2 = msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.mentions.users.first() || client.users.cache.get(args[0]);

        var turnId = msg.author.id;

        // Make sure a user was given
        if (!user2) {
            return msg.channel.send("You need to mention a user to play against!");
        }

        var acceptMsg = await msg.channel.send(`${user2}, ${msg.guild.members.cache.get(msg.author.id).displayName} wants to play tic-tac-toe with you! To accept, type \`accept\`. ${msg.guild.members.cache.get(user2.id).displayName} has one minute to accept`);

        const msgFilter = m => m.author.id === user2.id && m.content.toLowerCase() === 'accept';

        // Wait for the user to accept the invite
        msg.channel.awaitMessages(msgFilter, {
            max: 1,
            time: 60000,
            errors: ['time']
        }).then(async collected => {
            // Send a message that will be used for the game
            var tttMsg = await msg.channel.send("Starting tic tac toe...");

            // React to the new message with everything in the reactions array
            reactionsArr.forEach(reaction => {
                tttMsg.react(reaction);
            });

            // Start the game
            return makeMove(turn, tttMsg, grid, user2, turnId, turnNumber);
        }).catch(e => {
            acceptMsg.edit(`Looks like ${msg.guild.members.cache.get(user2.id).displayName} doesn't want to play right now :(`);
        });

        function makeMove(turn, tttMsg, grid, user2, turnId, turnNumber) {
            const filter = (reaction, user) => reactionsArr.includes(reaction.emoji.name) && user.id === turnId;

            var gameEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("Tic-Tac-Toe")
                .setFooter(`${config.name} | React with 1-9 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                .addField("Board", grid.join(""), true)
                .addField("Players", `\`\`\`${msg.guild.members.cache.get(msg.author.id).displayName}: X\n${msg.guild.members.cache.get(user2.id).displayName}: O\n\nCurrent turn: ${turn}\`\`\``, true);

            tttMsg.edit("", {
                embeds: [gameEmb]
            });

            // Wait for the current player to react
            tttMsg.awaitReactions(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                // Figure out which spot the user wants to play on
                var move = grid.find(n => n === collected.first().emoji.name);

                // Replace the relevant item in the array with the current players piece
                grid[grid.indexOf(move)] = `:${turn}:`;

                // If the user hasn't won with the latest move
                if (!checkWin(grid)) {
                    // Advance to the next turn
                    if (turn === "x") {
                        turn = "o";

                        turnId = user2.id;
                    } else {
                        turn = "x";

                        turnId = msg.author.id;
                    }

                    ++turnNumber;

                    // Check for a tie
                    if (turnNumber > 8) {
                        var tieEmb = new Discord.MessageEmbed()
                            .setColor(config.embedColor)
                            .setTitle("Tic-Tac-Toe")
                            .setFooter(`${config.name} | React with 1-9 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                            .setDescription(`The round ended in a tie!`)
                            .addField("Board", grid.join(""), true)
                            .addField("Players", `\`\`\`${msg.guild.members.cache.get(msg.author.id).displayName}: X\n${msg.guild.members.cache.get(user2.id).displayName}: O\n\nCurrent turn: ${turn}\`\`\``, true);

                        return tttMsg.edit("", {
                            embeds: [tieEmb]
                        });
                    }

                    return makeMove(turn, tttMsg, grid, user2, turnId, turnNumber);
                }

                var endEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Tic-Tac-Toe")
                    .setFooter(`${config.name} | React with 1-9 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                    .setDescription(`**${msg.guild.members.cache.get(turnId).displayName}** won the round!`)
                    .addField("Board", grid.join(""), true)
                    .addField("Players", `\`\`\`${msg.guild.members.cache.get(msg.author.id).displayName}: X\n${msg.guild.members.cache.get(user2.id).displayName}: O\n\nCurrent turn: ${turn}\`\`\``, true);

                return tttMsg.edit("", {
                    embeds: [endEmb]
                });
            }).catch(e => {
                // Get the loser
                var loser = msg.guild.members.cache.get(turnId).displayName;

                // Advance the turns
                if (turn === "x") {
                    turn = "o";

                    turnId = user2.id;
                } else {
                    turn = "x";

                    turnId = msg.author.id;
                }

                // Get the winner
                var winner = msg.guild.members.cache.get(turnId).displayName;

                var timeEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Tic-Tac-Toe")
                    .setFooter(`${config.name} | React with 1-9 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                    .setDescription(`**${loser}** ran out of time, so **${winner}** won the round!`)
                    .addField("Board", grid.join(""), true)
                    .addField("Players", `\`\`\`${msg.guild.members.cache.get(msg.author.id).displayName}: X\n${msg.guild.members.cache.get(user2.id).displayName}: O\n\nCurrent turn: ${turn}\`\`\``, true);

                return tttMsg.edit("", {
                    embeds: [timeEmb]
                });
            });
        }

        function checkWin(grid) {
            var win = false;

            // Check wins by row
            for (var i = 0, a = 0, b = 2, c = 4; i < 3; i++, a += 6, b += 6, c += 6) {
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    win = true;
                }
            }

            // Check wins by column
            for (var i = 0, a = 0, b = 6, c = 12; i < 3; i++, a += 2, b += 2, c += 2) {
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    win = true;
                }
            }

            // Check wins by diagonals
            for (var i = 0, a = 0, b = 8, c = 16; i < 2; i++, a += 4, c -= 4) {
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    win = true;
                }
            }

            return win;
        }
    },
};