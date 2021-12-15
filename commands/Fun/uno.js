const Discord = require('discord.js');
const config = require("../../config/config.json");
const emojis = require("../../assets/emojis/emojis.json");
const unoManager = require("../../handlers/Uno/uno.js");
const gameMsgs = {};

module.exports = {
    name: 'uno',
    description: 'Play a game of uno against other users',
    category: 'Fun',
    usage: '`{prefix}uno`',
    async execute(msg, args) {
        unoManager.addToGame(msg.author.id, msg.guild.id).then(async res => {
            switch (res) {
                case "firstPlayer":
                    msg.channel.send(`Starting a game of uno! The game needs at least three players to start, and has a max of ten players. Other players can join by typing \`${config.prefix}uno\`. The game will start in one minute`);

                    setTimeout(async () => {
                        unoManager.initGame(msg.guild.id).then(async res => {
                            res.players.forEach(player => {
                                // Only send the embed to the users that aren't going first in order to avoid sending the first user multiple messages
                                if (player.player !== res.players[res.turn].player) {
                                    const playerEmb = new Discord.MessageEmbed()
                                        .setColor(config.embedColor)
                                        .setTitle("The Game Has Started")
                                        .addField("Your Hand", player.hand.map(i => `${i.type} ${i.value}`).sort().join("\n"), true);

                                    client.users.cache.get(player.player).send({
                                        embeds: [playerEmb]
                                    });
                                }
                            });

                            var gameMsg = await msg.channel.send("Starting the game...");

                            gameMsgs[msg.guild.id] = gameMsg;

                            // Redefine the variable to keep the obj updated
                            gameMsg = gameMsgs[msg.guild.id];

                            // React to the message with an uno emoji
                            gameMsg.react(emojis.uno);

                            unoManager.pushPlay(msg.guild.id, `The game starts with a **${res.curCard.type} ${res.curCard.value}**`);

                            awaitPlay(res);

                            // The regex takes the full emoji data and extracts the id
                            const reactionFilter = (reaction, user) => reaction.emoji.id === emojis.uno.split(/:[^:\s]*(?:::[^:\s]*)*:/g)[1].replace(/>.*/g, "") && res.players.find(i => i.player === user.id);

                            // FSet up a reaction collector with the filter
                            const reactCollector = gameMsg.createReactionCollector(reactionFilter, {
                                time: 3600000
                            });

                            reactCollector.on('collect', (reaction, user) => {
                                unoManager.callUno(user.id, msg.guild.id).then(res => {
                                    // Remove the reaction
                                    reaction.users.remove(user.id);

                                    switch (res.type) {
                                        case "successfullyCalled":
                                            // Add the action to the array
                                            unoManager.pushPlay(msg.guild.id, `**${getMember(res.player)}** has uno!`);

                                            break;

                                        case "calledOnOtherPlayer":
                                            client.users.cache.get(res.player).send(`**${getMember(user.id).displayName}** called uno on you and made you draw 2 cards`);

                                            unoManager.pushPlay(msg.guild.id, `**${getMember(user.id)}** called uno on **${res.player}**`);

                                            break;

                                        case "falseUno":
                                            client.users.cache.get(res.player).send("You called uno, but no one had it so you drew 2 cards");

                                            unoManager.pushPlay(msg.guild.id, `**${getMember(res.player)}** called uno, but no one had it!`);

                                            break;
                                    }
                                }).catch(res => {
                                    // Return if the user isn't allowed to call uno
                                    return;
                                });
                            });
                        }).catch(res => {
                            switch (res) {
                                case "notEnoughPlayers":
                                    msg.channel.send("The game needs at least three people to start!");

                                    break;

                                case "invalidGameId":
                                    msg.channel.send("There was an issue finding your game, so it wasn't started");

                                    break;
                            }

                            return;
                        });
                    }, 60000);

                    break;

                case "addedToExisting":
                    msg.channel.send(`${msg.author} you joined the game!`);

                    break;
            }
        }).catch(res => {
            switch (res) {
                case "alreadyInGame":
                    msg.channel.send(`${msg.author} you're already in the game!`);

                    break;

                case "gameAtMaxCapacity":
                    msg.channel.send(`${msg.author} the game is already at max capacity!`);

                    break;

                case "gameInProgress":
                    msg.channel.send(`${msg.author} the game is already in progress!`);

                    break;
            }

            return;
        });

        unoManager.emitter.on("newPlay", (game, id) => {
            if (!gameMsgs[id]) {
                return;
            }

            const gameMsg = gameMsgs[id];

            // Get user/card info for each player
            const playerInfo = game.players.map(player => {
                return `> ${getMember(player.player)} | ${player.hand.length}\n`;
            }).join("\n");

            const playEmb = new Discord.MessageEmbed()
                .setTitle("Uno")
                .setColor(config.embedColor)
                .setDescription(`Click ${emojis.uno} to call uno on someone! If you're about to play your second to last card, or already have one card, you can click ${emojis.uno} to declare uno`)
                .addField("Game", game.plays.map(p => `> ${p}\n`).slice(Math.max(game.plays.length - 3, 0)), true)
                .addField("Player | Remaining cards", playerInfo, true)
                .addField("Last Played Card", game.curCard.type + " " + game.curCard.value)
                .addField("Remaining Cards in Deck", game.cardsRemaining)
                .addField("Current Player", getMember(game.players[game.turn].player));

            updateGameMsg(gameMsg, playEmb, game);
        });

        function getMember(id) {
            return msg.guild.members.cache.get(id);
        }

        function updateGameMsg(gameMsg, content, game) {
            if (content.constructor && content.constructor.name === "MessageEmbed") {
                gameMsg.edit("", {
                    embeds: [content]
                });
            } else {
                gameMsg.edit(content);
            }
        }

        async function awaitPlay(game) {
            var cards = [];

            var recommendedPlay = "Draw a card";

            // Get the current player's hand
            game.players[game.turn].hand.forEach(card => {
                cards.push(`${card.type} ${card.value}`);

                // Check if there's anything that can be played, and if so, recommend it
                if (game.curCard.type === card.type || game.curCard.value === card.value || card.type === "Wild") {
                    recommendedPlay = `${card.type} ${card.value}`;
                }
            });

            var playerEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("It's your turn!")
                .setFooter("Respond with the card you would like to play, or \"draw\" to draw a card | To play a wild, send \"wild <type> <color>\". For example: wild draw4 green | You have 60 seconds to decide")
                .addField("Your Hand", cards.sort().join("\n"), true)
                .addField("Recommended Play", recommendedPlay, true)
                .addField("Last Played Card", `${game.curCard.type} ${game.curCard.value}`);

            // DM the current player with the embed
            var dm = await client.users.cache.get(game.players[game.turn].player).send({
                embeds: [playerEmb]
            });

            // Filter messages to only accept valid plays
            const filter = m =>
                m.content && m.content.toLowerCase() === "draw" || // Check if the user wants to draw a card
                m.content && m.content.toLowerCase() === "draw a card" || // Check if the user wants to draw a card
                m.content && m.content.split(" ")[1] && cards.join(",").toLowerCase().includes(m.content.toLowerCase()) && game.curCard.type.toLowerCase() === m.content.split(" ")[0].toLowerCase() && m.content.split(" ")[0].toLowerCase() !== "wild" || // Check card type
                m.content && m.content.split(" ")[1] && cards.join(",").toLowerCase().includes(m.content.toLowerCase()) && game.curCard.value.toLowerCase() === m.content.split(" ")[1].toLowerCase() && m.content.split(" ")[0].toLowerCase() !== "wild" || // Check card value
                m.content && m.content.split(" ")[1] && m.content.split(" ").length === 3 && cards.join(",").toLowerCase().includes(m.content.toLowerCase().split(" ").filter((e, i) => i < m.content.toLowerCase().split(" ").length - 1).join(" ")) && m.content.split(" ")[2] && m.content.split(" ")[0].toLowerCase() === "wild" && ["green", "blue", "red", "yellow"].includes(m.content.split(" ")[2].toLowerCase()); // Check wilds

            dm.channel.awaitMessages(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
            }).then(async collected => {
                // Make sure people don't play out of turn
                if (!collected.first().author.id === game.players[game.turn].player) {
                    return msg.channel.send("It's not your turn!");
                }

                unoManager.playCard(game.id, collected.first().content).then(res => {
                    switch (res.type) {
                        case "draw":
                            unoManager.pushPlay(res.game.id, `**${getMember(res.game.players[res.game.turn].player)}** drew **${res.num}** cards and played a **${res.game.curCard.type} ${res.game.curCard.value}**`);

                            // Let the user know how many cards they drew and what they played
                            collected.first().author.send(`You ended up drawing **${res.num}** cards and playing a **${res.game.curCard.type} ${res.game.curCard.value}**`);

                            break;

                        case "wild-draw4":
                            // Send a message to the first user
                            collected.first().author.send(`You successfully changed the color to **${res.game.curCard.type}** and made **${getMember(game.players[game.turn].player)}** draw 4 cards`);

                            // Let the second user know what happened
                            client.users.cache.get(game.players[game.turn].player).send(`**${getMember(res.curPlayer.player)}** made you draw 4 cards and skip your turn`);

                            unoManager.pushPlay(res.game.id, `**${getMember(res.curPlayer.player)}** changed the color to **${res.game.curCard.type}** and made **${getMember(res.game.players[res.game.turn].player)}** draw 4 cards`);

                            break;

                        case "wild-normal":
                            unoManager.pushPlay(res.game.id, `**${getMember(res.game.players[res.game.turn].player)}** changed the color to **${res.game.curCard.type}**`);

                            collected.first().author.send(`You successfully changed the color to **${res.game.curCard.type}**`);

                            break;

                        case "skip":
                            unoManager.pushPlay(res.game.id, `**${getMember(res.curPlayer.player)}** skipped **${getMember(res.game.players[res.game.turn].player)}**`);

                            // Send a message to the skipped player
                            client.users.cache.get(res.game.players[res.game.turn].player).send(`You were skipped by **${getMember(res.curPlayer.player)}**`);

                            // Send a message to the first user
                            collected.first().author.send(`You skipped **${getMember(res.game.players[res.game.turn].player)}**`);

                            break;

                        case "draw2":
                            client.users.cache.get(res.game.players[res.game.turn].player).send(`**${getMember(res.curPlayer.player)}** made you draw 2 cards`);

                            collected.first().author.send(`You made **${getMember(res.game.players[res.game.turn].player)}** draw 2 cards`);

                            unoManager.pushPlay(res.game.id, `**${getMember(res.curPlayer.player)}** made **${getMember(res.game.players[res.game.turn].player)}** draw 2 cards`);

                            break;

                        case "normal":
                            collected.first().author.send(`Alright! You played a **${game.curCard.type} ${game.curCard.value}**`);

                            unoManager.pushPlay(res.game.id, `**${getMember(res.game.players[res.game.turn].player)}** played a **${game.curCard.type} ${game.curCard.value}**`);

                            break;
                    }

                    // Move to the next player
                    unoManager.incTurn(res.game.id);

                    unoManager.checkWinner(res.game).then(win => {
                        const gameMsg = gameMsgs[win.game.id];

                        // Get user/card info for each player
                        const playerInfo = win.game.players.map(player => {
                            return `> ${getMember(player.player)} | ${player.hand.length}\n`;
                        }).join("\n");

                        const gameOverEmb = new Discord.MessageEmbed()
                            .setTitle("Uno | Game Over")
                            .setColor(config.embedColor)
                            .setDescription(`${getMember(win.winner.player)} won the game!`)
                            .addField("Game", win.game.plays.map(p => `> ${p}\n`).slice(Math.max(win.game.plays.length - 3, 0)), true)
                            .addField("Player | Remaining cards", playerInfo, true)
                            .addField("Last Played Card", win.game.curCard.type + " " + win.game.curCard.value)
                            .addField("Remaining Cards in Deck", win.game.cardsRemaining)
                            .addField("Total Number Of Cards Played", game.totalDrawn);

                        // Remove all reactions from the message
                        gameMsg.reactions.removeAll();

                        unoManager.removeGame(win.game.id);

                        return updateGameMsg(gameMsg, gameOverEmb, win.game);
                    }).catch(() => {
                        return awaitPlay(res.game);
                    });
                });
            }).catch(e => {
                // Get user/card info for each player
                const playerInfo = game.players.map(player => {
                    return `> ${getMember(player.player)} | ${player.hand.length}\n`;
                }).join("\n");

                const endEmb = new Discord.MessageEmbed()
                    .setTitle("Uno | Game Over")
                    .setColor(config.embedColor)
                    .setDescription(`**${getMember(game.players[game.turn].player)}** ran out of time, so the game ended`)
                    .addField("Game", game.plays.map(p => `> ${p}\n`).slice(Math.max(game.plays.length - 3, 0)), true)
                    .addField("Player | Remaining cards", playerInfo, true)
                    .addField("Remaining Cards in Deck", game.cardsRemaining)
                    .addField("Total Number Of Cards Played", game.totalDrawn);

                updateGameMsg(gameMsgs[game.id], endEmb, game);

                unoManager.removeGame(game.id);

                gameMsgs[game.id].reactions.removeAll();

                return;
            });
        }

        return;
    },
};