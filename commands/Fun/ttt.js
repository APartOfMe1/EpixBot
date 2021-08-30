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

        var user2 = msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.mentions.users.first() || client.users.cache.get(args[0]); //Find a user by username, nickname, mention, or id

        var turnId = msg.author.id;

        if (!user2) { //Make sure a user was given
            return msg.channel.send("You need to mention a user to play against!");
        };

        var acceptMsg = await msg.channel.send(`${user2}, ${msg.guild.members.cache.get(msg.author.id).displayName} wants to play tic-tac-toe with you! To accept, type \`accept\`. ${msg.guild.members.cache.get(user2.id).displayName} has one minute to accept`);

        const msgFilter = m => m.author.id === user2.id && m.content.toLowerCase() === 'accept';

        msg.channel.awaitMessages(msgFilter, { //Wait for the user to accept the invite
            max: 1,
            time: 60000,
            errors: ['time']
        }).then(async collected => {
            var tttMsg = await msg.channel.send("Starting tic tac toe..."); //Send a message that will be used for the game

            reactionsArr.forEach(reaction => { //React to the new message with everything in the reactions array
                tttMsg.react(reaction);
            });

            return makeMove(turn, tttMsg, grid, user2, turnId, turnNumber); //Start the game
        }).catch(e => {
            acceptMsg.edit(`Looks like ${msg.guild.members.cache.get(user2.id).displayName} doesn't want to play right now :(`); //Send an error if the user doesn't respond in time
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

            tttMsg.awaitReactions(filter, { //Wait for the current player to react
                    max: 1,
                    time: 30000,
                    errors: ['time']
                })
                .then(collected => {
                    var move = grid.find(n => n === collected.first().emoji.name); //Figure out which spot the user wants to play on

                    grid[grid.indexOf(move)] = `:${turn}:`; //Replace the relevant item in the array with the current players piece

                    if (!checkWin(grid)) { //If the user hasn't won with the latest move
                        if (turn === "x") { //Advance to the next turn
                            turn = "o";

                            turnId = user2.id;
                        } else {
                            turn = "x";

                            turnId = msg.author.id;
                        };

                        ++turnNumber; //Increment the counter

                        if (turnNumber > 8) { //Check for a tie
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
                        };

                        return makeMove(turn, tttMsg, grid, user2, turnId, turnNumber);
                    };

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
                })
                .catch(e => { //If the current player ran out of time
                    var loser = msg.guild.members.cache.get(turnId).displayName; //Get the loser

                    if (turn === "x") { //Advance the turns
                        turn = "o";

                        turnId = user2.id;
                    } else {
                        turn = "x";

                        turnId = msg.author.id;
                    };

                    var winner = msg.guild.members.cache.get(turnId).displayName; //Get the winner

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
        };

        function checkWin(grid) {
            var win = false;

            for (var i = 0, a = 0, b = 2, c = 4; i < 3; i++, a += 6, b += 6, c += 6) { //Check wins by row              
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    win = true;
                };
            };

            for (var i = 0, a = 0, b = 6, c = 12; i < 3; i++, a += 2, b += 2, c += 2) { //Check wins by column         
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    win = true;
                };
            };

            for (var i = 0, a = 0, b = 8, c = 16; i < 2; i++, a += 4, c -= 4) { //Check wins by diagonals            
                if (grid[a] === grid[b] && grid[b] === grid[c]) {
                    win = true;
                };
            };

            return win;
        };
    },
};