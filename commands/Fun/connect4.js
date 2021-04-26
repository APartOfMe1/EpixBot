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
            ["⏺️", "⏺️", "⏺️", emojis.c4Red, "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", emojis.c4Red, "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", emojis.c4Red, "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            [emojis.c4Red, "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"]
        ];

        var user2 = msg.guild.members.cache.find(e => e.displayName.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.guild.members.cache.find(e => e.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) || msg.mentions.users.first() || client.users.cache.get(args[0]); //Find a user by username, nickname, mention, or id

        var turnId = msg.author.id;

        var turn = emojis.c4Red;

        if (playing.includes(msg.channel.id)) {
            return msg.channel.send("It looks like another game is already going on in this channel!");
        };

        if (!user2 || !args[0]) { //Make sure a user was given
            return msg.channel.send("You need to mention a user to play against!");
        };

        playing.push(msg.channel.id); //Add the channel to the array of currently playing channels

        var acceptMsg = await msg.channel.send(`${user2}, ${msg.guild.members.cache.get(msg.author.id).displayName} wants to play connect 4 with you! To join, type \`accept\`. ${msg.guild.members.cache.get(user2.id).displayName} has one minute to join`);

        const msgFilter = m => m.author.id === user2.id && m.content.toLowerCase() === 'accept';

        msg.channel.awaitMessages(msgFilter, { //Wait for the user to accept the invite
            max: 1,
            time: 60000,
            errors: ['time']
        }).then(async collected => {
            var c4Msg = await msg.channel.send("Starting connect 4..."); //Send a message that will be used for the game

            reactionsArr.forEach(reaction => { //React to the new message with everything in the reactions array
                c4Msg.react(reaction);
            });

            return makeMove(turn, c4Msg, grid, user2, turnId); //Start the game
        }).catch(e => {
            playing.splice(playing.findIndex(g => g === msg.channel.id), 1); //Remove the channel from the list

            acceptMsg.edit(`Looks like ${msg.guild.members.cache.get(user2.id).displayName} doesn't want to play right now :(`); //Send an error if the user doesn't respond in time
        });

        function makeMove(turn, c4Msg, grid, user2, turnId) {
            const filter = (reaction, user) => reactionsArr.includes(reaction.emoji.name) && user.id === turnId;

            var formatted = [];

            grid.forEach(row => { //Join the arrays
                formatted.push(row.join(""));
            });

            if (grid[0].every(i => [emojis.c4Red, emojis.c4Yellow].includes(i))) { //Check for a tie
                playing.splice(playing.findIndex(g => g === msg.channel.id), 1); //Remove the channel from the list

                var tieEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Connect 4")
                    .setDescription("The game ended in a tie!")
                    .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                    .addField("Board", formatted.join("\n"), true)
                    .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

                return c4Msg.edit("", {
                    embed: tieEmb
                });
            };

            if (checkWin(grid, turn)) {
                playing.splice(playing.findIndex(g => g === msg.channel.id), 1); //Remove the channel from the list

                var endEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Connect 4")
                    .setDescription(`${msg.guild.members.cache.get(turnId).displayName} won the match!`)
                    .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                    .addField("Board", formatted.join("\n"), true)
                    .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

                return c4Msg.edit("", {
                    embed: endEmb
                });
            };

            var gameEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("Connect 4")
                .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                .addField("Board", formatted.join("\n"), true)
                .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

            c4Msg.edit("", {
                embed: gameEmb
            });

            c4Msg.awaitReactions(filter, { //Wait for the current player to react
                    max: 1,
                    time: 30000,
                    errors: ['time']
                })
                .then(collected => {
                    var move = collected.first().emoji.name; //Figure out which spot the user wants to play on

                    var newGrid = drop(move.split("")[0] - 1, grid, turn); //Drop the piece

                    collected.first().emoji.reaction.users.remove(turnId); //Remove the user's reaction

                    if (turn === emojis.c4Red) { //Advance to the next turn
                        turn = emojis.c4Yellow;

                        turnId = user2.id;
                    } else {
                        turn = emojis.c4Red;

                        turnId = msg.author.id;
                    };

                    return makeMove(turn, c4Msg, newGrid, user2, turnId);
                })
                .catch(e => { //If the current player ran out of time
                    console.log(e);

                    var loser = msg.guild.members.cache.get(turnId).displayName; //Get the loser

                    if (turn === emojis.c4Red) { //Advance to the next turn
                        turn = emojis.c4Yellow;

                        turnId = user2.id;
                    } else {
                        turn = emojis.c4Red;

                        turnId = msg.author.id;
                    };

                    var winner = msg.guild.members.cache.get(turnId).displayName; //Get the winner

                    playing.splice(playing.findIndex(g => g === msg.channel.id), 1); //Remove the channel from the list

                    var endEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setTitle("Connect 4")
                        .setDescription(`${winner} won the match because ${loser} ran out of time`)
                        .setFooter(`${config.name} | React with 1-7 to make a move | You have 30 seconds per turn`, client.user.avatarURL())
                        .addField("Board", formatted.join("\n"), true)
                        .addField("Players", `\`\`\`Red: ${msg.guild.members.cache.get(msg.author.id).displayName} \nYellow: ${msg.guild.members.cache.get(user2.id).displayName} \n\nCurrent turn: ${msg.guild.members.cache.get(turnId).displayName}\`\`\``, true);

                    return c4Msg.edit("", {
                        embed: endEmb
                    });
                });
        };

        function drop(move, grid, turn) {
            for (let r = grid.length - 1; r >= 0; r--) { //Check each item in the column in reverse order. If the slot hasn't been filled, add a piece
                if (![emojis.c4Red, emojis.c4Yellow].includes(grid[r][move])) {
                    grid[r][move] = turn;

                    break;
                };
            };

            return grid;
        };

        function is4InARow(a, b, c, d) {
            var piece1 = emojis.c4Red;

            var piece2 = emojis.c4Yellow;

            if (piece1 === a && piece1 === b && piece1 === c && piece1 === d) {
                return true;
            } else if (piece2 === a && piece2 === b && piece2 === c && piece2 === d) {
                return true;
            };

            return false;
        };

        function checkWin(grid) {
            //Check from left to right
            for (let r = 0; r < grid.length; r++) {
                for (let i = 0; i < grid[r].length; i++) {
                    if (is4InARow(grid[r][i], grid[r][i + 1], grid[r][i + 2], grid[r][i + 3])) {
                        return true;
                    };
                };
            };

            //Check vertically
            for (let r = 0; r < grid.length; r++) {
                for (let i = 0; i < grid[r].length; i++) {
                    let column = grid.map(e => e[i]);

                    for (let c = 0; c < column.length; c++) {
                        if (is4InARow(column[c], column[c + 1], column[c + 2], column[c + 3])) {
                            return true;
                        };
                    };
                };
            };

            //Check forward diagonals (NOT WORKING)
            for (let r = 0; r < grid.length; r++) {
                for (let i = 0; i < grid[r].length; i++) {
                    if (grid[r] && grid[r + 3]) {
                        if (is4InARow(grid[r][i], grid[r + 1][i + 1], grid[r + 2][i + 2], grid[r + 3][i + 3])) {
                            return true;
                        };
                    };
                };
            };

            //Check backward diagonals
            for (let r = 3; r < 6; r++) {
                for (let i = 0; i < 4; i++) {
                    if (grid[r] && grid[r + 3]) {
                        if (is4InARow(grid[r][i], grid[r + 1][i - 1], grid[r + 2][i - 2], grid[r + 3][i - 3])) {
                            return true;
                        };
                    };
                };
            };

            /*var grid = [
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"],
            ["⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️", "⏺️"]
            ];*/

            return false;
        };
    },
};