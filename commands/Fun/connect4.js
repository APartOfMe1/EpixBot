const Discord = require('discord.js');
const config = require("../../config/config.json");
const emojis = require("../../assets/emojis/emojis.json");
const playing = [];

module.exports = {
    name: 'connect4',
    description: 'Play a game of connect 4!',
    category: 'Fun',
    aliases: ["c4"],
    cooldown: 10000,
    usage: '`{prefix}connect4 <username/nickname/@user/id>`',
    examples: '`{prefix}connect4 @A part of me#0412`, `{prefix}connect4 A part of me` or `{prefix}connect4 277137613775831050`',
    async execute(msg, args) {
        var reactionsArr = [
            "1️⃣",
            "2️⃣",
            "3️⃣",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣"
        ];

        var grid = [
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"]
        ];

        // Find a user by username, nickname, mention, or id
        var user2 = msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.mentions.users.first() || client.users.cache.get(args[0]);

        var turnId = msg.author.id;

        var turn = emojis.c4Red;

        if (playing.includes(msg.channel.id)) {
            return msg.channel.send("It looks like another game is already going on in this channel!");
        }

        // Make sure a user was given
        if (!user2 || !args[0]) {
            return msg.channel.send("You need to mention a user to play against!");
        }

        // Add the channel to the array of currently playing channels
        playing.push(msg.channel.id);

        var acceptMsg = await msg.channel.send(`${user2}, ${msg.guild.members.cache.get(msg.author.id).displayName} wants to play connect 4 with you! To join, type \`accept\`. ${msg.guild.members.cache.get(user2.id).displayName} has one minute to join`);

        const msgFilter = m => m.author.id === user2.id && m.content.toLowerCase() === 'accept';

        // Wait for the user to accept the invite
        msg.channel.awaitMessages(msgFilter, {
            max: 1,
            time: 60000,
            errors: ['time']
        }).then(async collected => {
            // Send a message that will be used for the game
            var c4Msg = await msg.channel.send("Starting connect 4...");

            // React to the new message with everything in the reactions array
            reactionsArr.forEach(reaction => {
                c4Msg.react(reaction);
            });

            // Start the game
            return makeMove(turn, c4Msg, grid, user2, turnId);
        }).catch(e => {
            // Remove the channel from the list
            playing.splice(playing.findIndex(g => g === msg.channel.id), 1);

            // Send an error if the user doesn't respond in time
            acceptMsg.edit(`Looks like ${msg.guild.members.cache.get(user2.id).displayName} doesn't want to play right now :(`);
        });

        function makeMove(turn, c4Msg, grid, user2, turnId) {
            const filter = (reaction, user) => reactionsArr.includes(reaction.emoji.name) && user.id === turnId;

            var formatted = [];

            // Join the arrays
            grid.forEach(row => {
                formatted.push(row.join(""));
            });

            // Check for a tie
            if (grid[0].every(i => [emojis.c4Red, emojis.c4Yellow].includes(i))) {
                // Remove the channel from the list
                playing.splice(playing.findIndex(g => g === msg.channel.id), 1);

                var tieEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Connect 4")
                    .setDescription("The game ended in a tie!")
                    .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                    .addField("Board", formatted.join("\n"), true)
                    .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

                return c4Msg.edit("", {
                    embeds: [tieEmb]
                });
            }

            if (checkWin(grid, turn)) {
                // Remove the channel from the list
                playing.splice(playing.findIndex(g => g === msg.channel.id), 1);

                var endEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Connect 4")
                    .setDescription(`${msg.guild.members.cache.get(turnId).displayName} won the match!`)
                    .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                    .addField("Board", formatted.join("\n"), true)
                    .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

                return c4Msg.edit("", {
                    embeds: [endEmb]
                });
            }

            var gameEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("Connect 4")
                .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                .addField("Board", formatted.join("\n"), true)
                .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

            c4Msg.edit("", {
                embeds: [gameEmb]
            });

            // Wait for the current player to react
            c4Msg.awaitReactions(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
            })
                .then(collected => {
                    // Figure out which spot the user wants to play on
                    var move = collected.first().emoji.name;

                    // Drop the piece
                    var newGrid = drop(move.split("")[0] - 1, grid, turn);

                    // Remove the user's reaction
                    collected.first().emoji.reaction.users.remove(turnId);

                    // Advance to the next turn
                    if (turn === emojis.c4Red) {
                        turn = emojis.c4Yellow;

                        turnId = user2.id;
                    } else {
                        turn = emojis.c4Red;

                        turnId = msg.author.id;
                    }

                    return makeMove(turn, c4Msg, newGrid, user2, turnId);
                })
                .catch(e => {
                    // Get the loser
                    var loser = msg.guild.members.cache.get(turnId).displayName;

                    // Advance to the next turn
                    if (turn === emojis.c4Red) {
                        turn = emojis.c4Yellow;

                        turnId = user2.id;
                    } else {
                        turn = emojis.c4Red;

                        turnId = msg.author.id;
                    }

                    // Get the winner
                    var winner = msg.guild.members.cache.get(turnId).displayName;

                    // Remove the channel from the list
                    playing.splice(playing.findIndex(g => g === msg.channel.id), 1);

                    var endEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setTitle("Connect 4")
                        .setDescription(`${winner} won the match because ${loser} ran out of time`)
                        .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                        .addField("Board", formatted.join("\n"), true)
                        .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

                    return c4Msg.edit("", {
                        embeds: [endEmb]
                    });
                });
        }

        function drop(move, grid, turn) {
            // Check each item in the column in reverse order. If the slot hasn't been filled, add a piece
            for (let r = grid.length - 1; r >= 0; r--) {
                if (![emojis.c4Red, emojis.c4Yellow].includes(grid[r][move])) {
                    grid[r][move] = turn;

                    break;
                }
            }

            return grid;
        }

        function is4InARow(a, b, c, d) {
            var piece1 = emojis.c4Red;

            var piece2 = emojis.c4Yellow;

            if (piece1 === a && piece1 === b && piece1 === c && piece1 === d) {
                return true;
            } else if (piece2 === a && piece2 === b && piece2 === c && piece2 === d) {
                return true;
            }

            return false;
        }

        function checkWin(grid) {
            // Check from left to right
            for (let r = 0; r < grid.length; r++) {
                for (let i = 0; i < grid[r].length; i++) {
                    if (is4InARow(grid[r][i], grid[r][i + 1], grid[r][i + 2], grid[r][i + 3])) {
                        return true;
                    }
                }
            }

            // Check vertically
            for (let r = 0; r < grid.length; r++) {
                for (let i = 0; i < grid[r].length; i++) {
                    let column = grid.map(e => e[i]);

                    for (let c = 0; c < column.length; c++) {
                        if (is4InARow(column[c], column[c + 1], column[c + 2], column[c + 3])) {
                            return true;
                        }
                    }
                }
            }

            // Check forward diagonals
            for (let r = 0; r < grid.length; r++) {
                for (let i = grid[r].length; i >= 0; i--) {
                    if (grid[r] && grid[r + 3]) {
                        if (is4InARow(grid[r][i], grid[r + 1][i - 1], grid[r + 2][i - 2], grid[r + 3][i - 3])) {
                            return true;
                        }
                    }
                }
            }

            // Check backward diagonals
            for (let r = 0; r < grid.length; r++) {
                for (let i = 0; i < grid[r].length; i++) {
                    if (grid[r] && grid[r + 3]) {
                        if (is4InARow(grid[r][i], grid[r + 1][i + 1], grid[r + 2][i + 2], grid[r + 3][i + 3])) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }
    },
};