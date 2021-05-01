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
                                if (player.player !== res.players[res.turn].player) { //Only send the embed to the users that aren't going first in order to avoid sending the first user multiple messages
                                    const playerEmb = new Discord.MessageEmbed()
                                        .setColor(config.embedColor)
                                        .setTitle("The Game Has Started")
                                        .addField("Your Hand", player.hand.map(i => `${i.type} ${i.value}`).sort().join("\n"), true);

                                    client.users.cache.get(player.player).send({
                                        embed: playerEmb
                                    });
                                };
                            });

                            var gameMsg = await msg.channel.send("Starting the game...");

                            gameMsgs[msg.guild.id] = gameMsg;

                            gameMsg = gameMsgs[msg.guild.id]; //Redefine the variable to keep the obj updated

                            gameMsg.react(emojis.uno); //React to the message with an uno emoji

                            unoManager.pushPlay(msg.guild.id, `The game starts with a **${res.curCard.type} ${res.curCard.value}**`);

                            awaitPlay(res);

                            const reactionFilter = (reaction, user) => reaction.emoji.id === emojis.uno.split(/:[^:\s]*(?:::[^:\s]*)*:/g)[1].replace(/>.*/g, "") && res.players.find(i => i.player === user.id); //The regex takes the full emoji data and extracts the id

                            const reactCollector = gameMsg.createReactionCollector(reactionFilter, { //Set up a reaction collector with the filter
                                time: 3600000 //Set time to one hour
                            });

                            reactCollector.on('collect', (reaction, user) => {
                                unoManager.callUno(user.id, msg.guild.id).then(res => {
                                    reaction.users.remove(user.id); //Remove the reaction

                                    switch (res.type) {
                                        case "successfullyCalled":
                                            unoManager.pushPlay(msg.guild.id, `**${getMember(res.player)}** has uno!`); //Add the action to the array

                                            break;

                                        case "calledOnOtherPlayer":
                                            client.users.cache.get(res.player).send(`**${getMember(user.id).displayName}** called uno on you and made you draw 2 cards`);

                                            unoManager.pushPlay(msg.guild.id, `**${getMember(user.id)}** called uno on **${res.player}**`); //Add the action to the array

                                            break;

                                        case "falseUno":
                                            client.users.cache.get(res.player).send("You called uno, but no one had it so you drew 2 cards"); //Send the user a dm

                                            unoManager.pushPlay(msg.guild.id, `**${getMember(res.player)}** called uno, but no one had it!`); //Add the action to the array

                                            break;
                                    }
                                }).catch(res => { //Return if the user isn't allowed to call uno
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
                            };

                            return;
                        });
                    }, 2500);
                    break;

                case "addedToExisting":
                    msg.channel.send(`${msg.author} you joined the game!`);

                    break;
            };
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
            };

            return;
        });

        unoManager.emitter.on("newPlay", (game, id) => {
            if (!gameMsgs[id]) { //Make sure the message exists
                return;
            };

            const gameMsg = gameMsgs[id];

            const playerInfo = game.players.map(player => { //Get user/card info for each player
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

        return;

        function getMember(id) {
            return msg.guild.members.cache.get(id);
        };

        function updateGameMsg(gameMsg, content, game) {
            if (content.constructor && content.constructor.name === "MessageEmbed") {
                gameMsg.edit("", {
                    embed: content
                });
            } else {
                gameMsg.edit(content);
            };
        };

        async function awaitPlay(game) {
            var cards = [];

            var recommendedPlay = "Draw a card";

            game.players[game.turn].hand.forEach(card => { //Get the current player's hand
                cards.push(`${card.type} ${card.value}`);

                if (game.curCard.type === card.type || game.curCard.value === card.value || card.type === "Wild") { //Check if there's anything that can be played, and if so, recommend it
                    recommendedPlay = `${card.type} ${card.value}`;
                };
            });

            var playerEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("It's your turn!")
                .setFooter("Respond with the card you would like to play, or \"draw\" to draw a card | To play a wild, send \"wild <type> <color>\". For example: wild draw4 green | You have 60 seconds to decide")
                .addField("Your Hand", cards.sort().join("\n"), true)
                .addField("Recommended Play", recommendedPlay, true)
                .addField("Last Played Card", `${game.curCard.type} ${game.curCard.value}`);

            var dm = await client.users.cache.get(game.players[game.turn].player).send({ //DM the current player with the embed
                embed: playerEmb
            });

            const filter = m => m.content && m.content.toLowerCase() === "draw" || //Check if the user wants to draw a card
                m.content && m.content.toLowerCase() === "draw a card" || //Check if the user wants to draw a card
                m.content && m.content.split(" ")[1] && cards.join(",").toLowerCase().includes(m.content.toLowerCase()) && game.curCard.type.toLowerCase() === m.content.split(" ")[0].toLowerCase() && m.content.split(" ")[0].toLowerCase() !== "wild" || //Check card type
                m.content && m.content.split(" ")[1] && cards.join(",").toLowerCase().includes(m.content.toLowerCase()) && game.curCard.value.toLowerCase() === m.content.split(" ")[1].toLowerCase() && m.content.split(" ")[0].toLowerCase() !== "wild" || //Check card value
                m.content && m.content.split(" ")[1] && m.content.split(" ").length === 3 && cards.join(",").toLowerCase().includes(m.content.toLowerCase().split(" ").filter((e, i) => i < m.content.toLowerCase().split(" ").length - 1).join(" ")) && m.content.split(" ")[2] && m.content.split(" ")[0].toLowerCase() === "wild" && ["green", "blue", "red", "yellow"].includes(m.content.split(" ")[2].toLowerCase()); //Check wilds

            dm.channel.awaitMessages(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
            }).then(async collected => {
                if (!collected.first().author.id === game.players[game.turn].player) { //Make sure people don't play out of turn
                    return msg.channel.send("It's not your turn!");
                };

                unoManager.playCard(game.id, collected.first().content).then(res => {
                    switch (res.type) {
                        case "draw":
                            unoManager.pushPlay(res.game.id, `**${getMember(res.game.players[res.game.turn].player)}** drew **${res.num}** cards and played a **${res.game.curCard.type} ${res.game.curCard.value}**`); //Add the action to the array

                            collected.first().author.send(`You ended up drawing **${res.num}** cards and playing a **${res.game.curCard.type} ${res.game.curCard.value}**`); //Let the user know how many card sthey drew and what they played

                            break;

                        case "wild-draw4":
                            collected.first().author.send(`You successfully changed the color to **${res.game.curCard.type}** and made **${getMember(game.players[game.turn].player)}** draw 4 cards`); //Send a message to the first user

                            client.users.cache.get(game.players[game.turn].player).send(`**${getMember(res.curPlayer.player)}** made you draw 4 cards and skip your turn`); //Let the second user know what happened

                            unoManager.pushPlay(res.game.id, `**${getMember(res.curPlayer.player)}** changed the color to **${res.game.curCard.type}** and made **${getMember(res.game.players[res.game.turn].player)}** draw 4 cards`); //Add the action to the array

                            unoManager.incTurn(res.game.id); //Skip the players turn

                            break;

                        case "wild-normal":
                            unoManager.pushPlay(res.game.id, `**${getMember(res.game.players[res.game.turn].player)}** changed the color to **${res.game.curCard.type}**`); //Add the action to the array

                            collected.first().author.send(`You successfully changed the color to **${res.game.curCard.type}**`); //Send a message to the user

                            break;
                    };
                });
            }).catch(e => {
                console.log(e);

                const playerInfo = game.players.map(player => { //Get user/card info for each player
                    return `> ${getMember(player.player)} | ${player.hand.length}\n`;
                }).join("\n");

                const endEmb = new Discord.MessageEmbed()
                    .setTitle("Uno | Game Over")
                    .setColor(config.embedColor)
                    .setDescription(`**${getMember(game.players[game.turn].player)}** ran out of time, so the game ended`)
                    .addField("Game", game.plays.map(p => `> ${p}\n`).slice(Math.max(game.plays.length - 3, 0)), true)
                    .addField("Player | Remaining cards", playerInfo, true)
                    .addField("Remaining Cards in Deck", game.cardsRemaining)
                    .addField("Current Player", getMember(game.players[game.turn].player));

                updateGameMsg(gameMsgs[game.id], endEmb, game);

                unoManager.removeGame(game.id);

                gameMsgs[game.id].reactions.removeAll(); //Remove all reactions from the message

                return;
            });
        };

        //This is genuinely the worst code I've written in a LONG time. I'm sorry for anyone who reads this
        if (!playing.find(i => i.guild.id === msg.guild.id)) { //Check if there's already a game going on in the guild
            playing.push({
                guild: msg.guild,
                isPlaying: false
            });

            players[msg.guild.id] = [];

            players[msg.guild.id].push({ //Add the message author to the list of players
                name: msg.guild.members.cache.get(msg.author.id).displayName,
                id: msg.author.id,
                hand: []
            });

            msg.channel.send(`Starting a game of uno! The game needs at least three players to start, and has a max of ten players. Other players can join by typing \`${config.prefix}uno\`. The game will start in one minute`);

            setTimeout(() => { //Start the game after a minute
                if (players[msg.guild.id].length < 3) {
                    playing.splice(playing.indexOf(playing.find(i => i.guild.id === msg.guild.id)), 1); //Remove the guild

                    return msg.channel.send("The game needs at least three people to start!");
                };

                playing.find(i => { //Set the guild's playing status
                    if (i.guild.id === msg.guild.id) {
                        i.isPlaying = true;
                    };
                });

                startGame(players[msg.guild.id]); //Start the game
            }, 60000);
        } else { //If there's a game in progress
            if (!checkCanPlay(msg.author.id)) { //Check if the user can be added to the game
                return msg.channel.send(`${msg.author}, either you're already in the game, the game has already started, or the game has already reached max players`);
            };

            players[msg.guild.id].push({ //Add the user to the list of players
                name: msg.guild.members.cache.get(msg.author.id).displayName,
                id: msg.author.id,
                hand: []
            });

            return msg.channel.send(`${msg.author} you joined the game!`);
        };

        async function startGame(players) {
            var turn = 0;

            var plays = [];

            var unoList = [];

            deck.shuffle();

            var currentCard = deck.draw(1); //Get the top card

            while (currentCard.type === "Wild" || ["Skip", "Draw2"].includes(currentCard.value)) { //Make sure the top card isn't a special card
                deck.addToBottom(currentCard); //Put the current card back into the deck

                currentCard = deck.draw(1); //Draw a new current card
            };

            plays.push(`The game starts with a **${currentCard.type} ${currentCard.value}**`); //Set the starting info

            players.forEach(player => { //Set up each players hand
                var cards = [];

                player.hand.push(deck.draw(7)); //Add 7 cards to the hand

                player.hand[0].forEach(card => { //Add each card to the array
                    cards.push(`${card.type} ${card.value}`);
                });

                var playerEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("The Game Has Started")
                    .addField("Your Hand", cards.sort().join("\n"), true);

                if (player.id !== players[turn].id) { //Only send the embed to the users that aren't going first in order to avoid sending the first user multiple messages
                    client.users.cache.get(player.id).send({
                        embed: playerEmb
                    });
                };
            });

            var playerInfo = players.map(player => { //Get user/card info for each player
                return `${player.name} | ${player.hand[0].length}`;
            }).join("\n");

            var playEmb = new Discord.MessageEmbed()
                .setTitle("Uno")
                .setColor(config.embedColor)
                .setDescription(`Click ${emojis.uno} to call uno on someone! If you're about to play your second to last card, or already have one card, you can click ${emojis.uno} to declare uno`)
                .addField("Game", plays.slice(Math.max(plays.length - 3, 0)), true)
                .addField("Player | Remaining cards", playerInfo, true)
                .addField("Current Player", players[turn].name);

            var game = await msg.channel.send({ //Send the initial message that will show the current game
                embed: playEmb
            });

            game.react(emojis.uno); //React to the message with an uno emoji

            const reactionFilter = (reaction, user) => reaction.emoji.id === emojis.uno && players.find(i => i.id === user.id);

            const reactCollector = game.createReactionCollector(reactionFilter, { //Set up a reaction collector with the filter
                time: 3600000
            });

            reactCollector.on('collect', (reaction, user) => {
                if (!checkCanUno(user.id)) { //Check if the user is able to call uno
                    return;
                };

                reaction.users.remove(user.id); //Remove the reaction

                if (players.find(p => p.id === user.id && p.hand[0].length < 3 && p.hand[0].find(card => currentCard.type === card.type || currentCard.value === card.value || card.type === "Wild"))) { //Check if the user is about to play their 2nd to last card or only has one
                    if (!unoList.includes(user.id)) { //Add the user to the list
                        unoList.push(user.id);
                    };

                    client.users.cache.get(user.id).send("You called uno!");

                    plays.push(`**${msg.guild.members.cache.get(user.id).displayName}** has uno!`); //Add the action to the array
                } else {
                    var uno = false;

                    players.forEach(player => {
                        if (player.hand[0].length === 1 && !unoList.includes(player.id)) { //Check if any user has only one card and hasn't declared uno already
                            uno = true;

                            for (let index = 0; index < 2; index++) { //Add two cards to the users hand. This is done one at a time to avoid returning the cards as an array
                                player.hand[0].push(deck.draw(1));
                            };

                            client.users.cache.get(player.id).send(`**${msg.guild.members.cache.get(falseUno.id).displayName}** called uno on you and made you draw 2 cards`);

                            plays.push(`**${msg.guild.members.cache.get(falseUno.id).displayName}** called uno on **${player.name}**`); //Add the action to the array
                        };
                    });

                    if (!uno) { //If no one has one card left
                        var falseUno = players.find(p => p.id === user.id); //Find the user that reacted

                        for (let index = 0; index < 2; index++) { //Add two cards to the users hand. This is done one at a time to avoid returning the cards as an array
                            falseUno.hand[0].push(deck.draw(1));
                        };

                        client.users.cache.get(falseUno.id).send("You called uno, but no one had it so you drew 2 cards"); //Send the user a dm

                        plays.push(`**${msg.guild.members.cache.get(falseUno.id).displayName}** called uno, but no one had it!`); //Add the action to the array
                    };
                };

                var playerInfo = players.map(player => { //Get player info
                    return `${player.name} | ${player.hand[0].length}`;
                }).join("\n");

                var playEmb = new Discord.MessageEmbed()
                    .setTitle("Uno")
                    .setColor(config.embedColor)
                    .setDescription(`Click ${emojis.uno} to call uno on someone! If you're about to play your second to last card, or already have one card, you can click ${emojis.uno} to declare uno`)
                    .addField("Game", plays.slice(Math.max(plays.length - 3, 0)), true)
                    .addField("Player | Remaining cards", playerInfo, true)
                    .addField("Current Player", players[turn].name);

                game.edit({ //Update the game message
                    embed: playEmb
                });
            });

            return play(players, currentCard, turn, plays, game, unoList); //Now that the setup is done, start the rest of the game
        };

        async function play(players, currentCard, turn, plays, game, unoList) {
            var cards = [];

            var recommendedPlay = "Draw a card";

            players[turn].hand[0].forEach(card => { //Get the current player's hand
                cards.push(`${card.type} ${card.value}`);

                if (currentCard.type === card.type || currentCard.value === card.value || card.type === "Wild") { //Check if there's anything that can be played, and if so, recommend it
                    recommendedPlay = `${card.type} ${card.value}`;
                };
            });

            var playerEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("It's your turn!")
                .setFooter("Respond with the card you would like to play, or \"draw\" to draw a card | To play a wild, send \"wild <type> <color>\". For example: wild draw4 green | You have 60 seconds to decide")
                .addField("Your Hand", cards.sort().join("\n"), true)
                .addField("Recommended Play", recommendedPlay, true)
                .addField("Last Played Card", `${currentCard.type} ${currentCard.value}`);

            var dm = await client.users.cache.get(players[turn].id).send({ //DM the current player with the embed
                embed: playerEmb
            });

            const filter = m => m.content.toLowerCase() === "draw" || m.content.toLowerCase() === "draw a card" || m.content && m.content.split(" ")[1] && (cards.join(",").toLowerCase().includes(m.content.toLowerCase()) && currentCard.type.toLowerCase() === m.content.split(" ")[0].toLowerCase() && m.content.split(" ")[0].toLowerCase() !== "wild" || cards.join(",").toLowerCase().includes(m.content.toLowerCase()) && currentCard.value.toLowerCase() === m.content.split(" ")[1].toLowerCase() && m.content.split(" ")[0].toLowerCase() !== "wild" || cards.join(",").toLowerCase().includes(m.content.toLowerCase().split(" ").filter((element, index) => index < m.content.toLowerCase().split(" ").length - 1).join(" ")) && m.content.split(" ")[2] && m.content.split(" ")[0].toLowerCase() === "wild" && ["green", "blue", "red", "yellow"].includes(m.content.split(" ")[2].toLowerCase()));

            dm.channel.awaitMessages(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
            }).then(async collected => {
                if (!collected.first().author.id === players[turn].id) { //Make sure people don't play out of turn
                    return msg.channel.send("It's not your turn!");
                };

                if (collected.first().content.toLowerCase() === "draw" || collected.first().content.toLowerCase() === "draw a card") { //Check if the user wants to draw a card
                    var cardsDrawn = 0;

                    if (unoList.includes(players[turn].id)) { //Check if the player has uno, and remove them from the list
                        unoList.splice(unoList.indexOf(players[turn].id), 1);
                    };

                    while (!players[turn].hand[0].find(i => i.type === currentCard.type && i.type !== "Wild" || i.value === currentCard.value && i.type !== "Wild")) { //Draw cards until the user can play one
                        cardsDrawn++; //Add one to the card counter

                        players[turn].hand[0].push(deck.draw(1)); //Add a card to the users hand
                    };

                    if (cardsDrawn < 1) { //Make sure the user draws at least one card
                        cardsDrawn++;

                        players[turn].hand[0].push(deck.draw(1));
                    };

                    var toPlay = players[turn].hand[0].find(i => i.type === currentCard.type || i.value === currentCard.value); //Get the card that can be played

                    players[turn].hand[0].splice(players[turn].hand[0].indexOf(toPlay), 1); //Remove the card from the users hand

                    deck.addToBottom(toPlay); //Add the card to the bottom of the deck in order to avoid running out of cards

                    currentCard = toPlay; //Set the current card for the next turn

                    plays.push(`**${players[turn].name}** drew **${cardsDrawn}** cards and played a **${toPlay.type} ${toPlay.value}**`); //Add the action to the array

                    var cards = []; //Honestly I don't remember if I use this, but I'm leaving it in for now lmao

                    players[turn].hand[0].forEach(card => {
                        cards.push(`${card.type} ${card.value}`);
                    });

                    collected.first().author.send(`You ended up drawing **${cardsDrawn}** cards and playing a **${toPlay.type} ${toPlay.value}**`); //Let the user know how many card sthey drew and what they played
                } else if (collected.first().content.split(" ")[0].toLowerCase() === "wild") { //Check if the user wants to play a wild
                    var color = collected.first().content.split(" ")[2].slice(0, 1).toUpperCase() + collected.first().content.split(" ")[2].slice(1, collected.first().content.split(" ")[2].length).toLowerCase(); //Literally all this does is make the first character of the color uppercase

                    var card = players[turn].hand[0].find(i => i.type.toLowerCase() === collected.first().content.split(" ")[0].toLowerCase() && i.value.toLowerCase() === collected.first().content.split(" ")[1].toLowerCase()); //Get the card to be played

                    players[turn].hand[0].splice(players[turn].hand[0].indexOf(card), 1); //Remove the card from the users hand

                    deck.addToBottom(card); //Add the card to the bottom to avoid running out of cards

                    currentCard = { //Set the current card for the next turn
                        type: color,
                        value: "Wild"
                    };

                    if (collected.first().content.split(" ")[1].toLowerCase() === "draw4") { //Check if the card is a wild draw 4
                        var curPlayer = players[turn]; //Get the current player

                        ++turn; //Move to the next turn

                        if (turn > (players.length - 1)) { //If the turn is greater than the number of players, loop it back to the first player
                            turn = 0;
                        };

                        for (let index = 0; index < 4; index++) { //Add four cards to the users hand. This is done one at a time to avoid returning the cards as an array
                            players[turn].hand[0].push(deck.draw(1));
                        };

                        collected.first().author.send(`You successfully changed the color to **${color}** and made **${players[turn].name}** draw 4 cards`); //Send a message to the first user

                        client.users.cache.get(players[turn].id).send(`**${curPlayer.name}** made you draw 4 cards and skip your turn`); //Let the second user know what happened

                        plays.push(`**${curPlayer.name}** changed the color to **${color}** and made **${players[turn].name}** draw 4 cards`); //Add the action to the array
                    } else { //If the card isn't a wild draw 4
                        plays.push(`**${players[turn].name}** changed the color to **${color}**`); //Add the action to the array

                        collected.first().author.send(`You successfully changed the color to **${color}**`); //Send a message to the user
                    };
                } else { //If it's just a normal card to be played
                    var curPlayer = players[turn]; //Get the current player

                    var card = players[turn].hand[0].find(i => i.type.toLowerCase() === collected.first().content.split(" ")[0].toLowerCase() && i.value.toLowerCase() === collected.first().content.split(" ")[1].toLowerCase()); //Get the card to be played

                    players[turn].hand[0].splice(players[turn].hand[0].indexOf(card), 1); //Remove the card from the users hand

                    deck.addToBottom(card); //Add the card to the bottom of the deck to avoid running out of cards

                    currentCard = card; //Set the current card

                    if (card.value === "Skip") {
                        turn++; //Advance the turn

                        if (turn > (players.length - 1)) { //If the turn is greater than the number of players, loop it back to the first player
                            turn = 0;
                        };

                        client.users.cache.get(players[turn].id).send(`You were skipped by **${curPlayer.name}**`); //Send a message to the skipped player

                        collected.first().author.send(`You skipped **${players[turn].name}**`); //Send a message to the first user

                        plays.push(`**${curPlayer.name}** skipped **${players[turn].name}**`); //Add the action to the array
                    } else if (card.value === "Draw2") {
                        turn++; //Advance the turn

                        if (turn > (players.length - 1)) { //If the turn is greater than the number of players, loop it back to the first player
                            turn = 0;
                        };

                        for (let index = 0; index < 2; index++) { //Add two cards to the users hand. This is done one at a time to avoid returning the cards as an array
                            players[turn].hand[0].push(deck.draw(1));
                        };

                        client.users.cache.get(players[turn].id).send(`**${curPlayer.name}** made you draw 2 cards`); //Send a message to the player forced to draw cards

                        collected.first().author.send(`You made **${players[turn].name}** draw 2 cards`); //Send a message to the first user

                        plays.push(`**${curPlayer.name}** made **${players[turn].name}** draw 2 cards`); //Add the action to the arrray
                    } else { //If it's a normal card
                        collected.first().author.send(`Alright! You played a **${card.type} ${card.value}**`); //Send a message to the user

                        plays.push(`**${players[turn].name}** played a **${card.type} ${card.value}**`); //Add the action to the array
                    };
                };

                if (players[turn].hand[0].length === 0) { //If a user has no more cards in their hand
                    var endGameInfo = players.map(player => { //Get player info
                        return `${player.name} | ${player.hand[0].length}`;
                    }).join("\n");

                    var gameEndEmb = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setTitle("Game Over")
                        .setDescription(`**${players[turn].name}** won the game!`)
                        .addField("Game", plays.slice(Math.max(plays.length - 3, 0)), true)
                        .addField("Player | Remaining cards", endGameInfo, true);

                    playing.splice(playing.indexOf(playing.find(i => i.guild.id === msg.guild.id)), 1); //Remove the guild from the list of waiting/playing guilds

                    game.reactions.removeAll(); //Remove all reactions from the message

                    msg.channel.send(`**${players[turn].name}** won the game!`); //Send a message to the channel

                    return game.edit({
                        embed: gameEndEmb
                    });
                };

                ++turn; //Advance the turn

                if (turn > (players.length - 1)) { //If the turn is greater than the number of players, loop it back to the first player
                    turn = 0;
                };

                var playerInfo = players.map(player => { //Get player info
                    return `${player.name} | ${player.hand[0].length}`;
                }).join("\n");

                var playEmb = new Discord.MessageEmbed()
                    .setTitle("Uno")
                    .setColor(config.embedColor)
                    .setDescription(`Click ${emojis.uno} to call uno on someone! If you're about to play your second to last card, or already have one card, you can click ${emojis.uno} to declare uno`)
                    .addField("Game", plays.slice(Math.max(plays.length - 3, 0)), true)
                    .addField("Player | Remaining cards", playerInfo, true)
                    .addField("Current Player", players[turn].name);

                game.edit({
                    embed: playEmb
                });

                return play(players, currentCard, turn, plays, game, unoList); //Start the next turn
            }).catch(e => {
                var endGameInfo = players.map(player => { //Get player info
                    return `${player.name} | ${player.hand[0].length}`;
                }).join("\n");

                var timeEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("Game Over")
                    .setDescription(`**${players[turn].name}** ran out of time, so the game ended :(`)
                    .addField("Game", plays.slice(Math.max(plays.length - 3, 0)), true)
                    .addField("Player | Remaining cards", endGameInfo, true);

                playing.splice(playing.indexOf(playing.find(i => i.guild.id === msg.guild.id)), 1); //Remove the guild from the list of playing/waiting guilds

                game.reactions.removeAll(); //Remove all reactions from the message

                msg.channel.send(`**${players[turn].name}** ran out of time, so the game ended :(`); //Send a message to the channel

                return game.edit({
                    embed: timeEmb
                });
            });
        };

        function checkCanPlay(player) { //Check if the player is able to join a game
            var canPlay = true; //Default to true

            if (players[msg.guild.id].find(i => i.id === player)) { //Check if the player is already in the game
                canPlay = false;
            };

            if (players[msg.guild.id] > 9) { //Check if there's already ten people playing
                canPlay = false;
            };

            playing.find(i => { //Check if the guild is in the middle of a game
                if (i.guild.id === msg.guild.id && i.isPlaying === true) {
                    canPlay = false;
                };
            });

            return canPlay;
        };

        function checkCanUno(player) {
            var canUno = 0;

            if (players[msg.guild.id].find(i => i.id === player)) { //Check if the user is in the game
                canUno++;
            };

            playing.find(i => { //Check if the game is currently going on
                if (i.guild.id === msg.guild.id && i.isPlaying === true) {
                    canUno++;
                };
            });

            if (canUno === 2) { //If both conditions are met, return true
                canUno = true;
            } else { //Otherwise return false
                canUno = false;
            };

            return canUno;
        };
    },
};