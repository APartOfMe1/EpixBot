const Deck = require('card-deck');
const cardList = require('../../assets/cards/uno/cards.json');
const emojis = require("../../assets/emojis/emojis.json");
const EventEmitter = require('events');
const emitter = new EventEmitter();
const games = {};

module.exports = {
    addToGame(player, gameId) {
        if (!games[gameId]) { //Check if the game has already been initialized
            games[gameId] = {
                id: gameId,
                isPlaying: false,
                cardsRemaining: 0,
                totalDrawn: 0,
                turn: 0,
                deck: new Deck(cardList.cards),
                discardPile: [],
                players: [],
                plays: [],
                unoList: [],
            };

            games[gameId].players.push({ //Add the user to the list of players
                player: player,
                hand: []
            });

            setTimeout(() => { //Delete the game if it hasn't started after an hour
                if (games[gameId] && games[gameId].isPlaying === false) {
                    return delete games[gameId];
                };
            }, 3600000);

            return Promise.resolve("firstPlayer");
        } else { //If there's a game in progress
            const canPlay = checkCanPlay(player, gameId);

            if (canPlay !== true) { //Check if the player can be added to the game
                return Promise.reject(canPlay);
            };

            games[gameId].players.push({ //Add the player to the list
                player: player,
                hand: []
            });

            return Promise.resolve("addedToExisting");
        };
    },

    initGame(gameId) {
        const curGame = games[gameId];

        if (!curGame) {
            return Promise.reject("invalidGameId");
        };

        // if (curGame.players.length < 3) {
        //     delete curGame;

        //     return Promise.reject("notEnoughPlayers");
        // };

        curGame.isPlaying = true;

        curGame.deck.shuffle();

        var currentCard = curGame.deck.draw(1); //Get the top card

        while (currentCard.type === "Wild" || ["Skip", "Draw2"].includes(currentCard.value)) { //Make sure the top card isn't a special card
            curGame.deck.addToBottom(currentCard); //Put the current card back into the deck

            curGame.deck.shuffle(); //Shuffle everything back in

            currentCard = curGame.deck.draw(1); //Draw a new current card
        };

        curGame.curCard = currentCard;

        curGame.discardPile.push(currentCard);

        curGame.players.forEach(player => { //Set up each players hand
            drawCards(50, curGame, player.hand); //Add 7 cards to the hand
        });

        return Promise.resolve(curGame);
    },

    pushPlay(gameId, content) {
        if (games[gameId] && games[gameId].plays) {
            games[gameId].plays.push(content);

            return emitter.emit("newPlay", games[gameId], gameId);
        } else {
            return false;
        };
    },

    callUno(player, gameId) {
        if (!checkCanUno(player, gameId)) { //Check if the user is able to call uno
            return Promise.reject("cantCall");
        };

        const curGame = games[gameId];

        if (curGame.players.find(p => p.player === player && p.hand.length <= 2 && p.hand.find(card => curGame.currentCard.type === card.type || curGame.currentCard.value === card.value || card.type === "Wild"))) { //Check if the user is about to play their 2nd to last card or only has one
            if (!curGame.unoList.includes(player)) { //Add the player to the list
                curGame.unoList.push(player);
            };

            return Promise.resolve({
                type: "successfullyCalled",
                player: player
            });
        } else {
            var uno = false;

            for (const i of curGame.players) {
                if (i.hand.length === 1 && !curGame.unoList.includes(i.player)) { //Check if any user has only one card and hasn't declared uno already
                    uno = true;

                    drawCards(2, curGame, i.hand); //Add the cards to the players hand

                    return Promise.resolve({
                        type: "calledOnOtherPlayer",
                        player: i
                    });
                };
            };

            if (!uno) { //If no one has one card left
                drawCards(2, curGame, curGame.players[curGame.turn].hand);

                return Promise.resolve({
                    type: "falseUno",
                    player: player
                });
            };
        };
    },

    removeGame(gameId) {
        if (games[gameId]) {
            delete games[gameId];
        };
    },

    incTurn(gameId) {
        const game = games[gameId];
    
        game.turn++; //Move to the next turn
    
        if (game.turn > (game.players.length - 1)) { //If the turn is greater than the number of players, loop it back to the first player
            game.turn = 0;
        };
    },

    playCard(gameId, card) {
        const game = games[gameId];

        const player = game.players[game.turn];

        if (card.toLowerCase() === "draw" || card.toLowerCase() === "draw a card") { //Check if the user wants to draw a card
            var cardsDrawn = 1;

            var justDrawn = drawCards(1, game, player.hand);

            if (game.unoList.includes(player.player)) { //Check if the player has uno, and remove them from the list
                game.unoList.splice(game.unoList.indexOf(player.player), 1);
            };

            while (!cardIsPlayable(justDrawn, game.curCard)) { //Draw cards until the user can play one
                cardsDrawn++; //Add one to the card counter

                justDrawn = drawCards(1, game, player.hand); //Add a card to the users hand
            };

            player.hand.splice(player.hand.indexOf(justDrawn), 1); //Remove the card from the users hand

            game.discardPile.push(justDrawn);

            game.curCard = justDrawn; //Set the current card for the next turn

            return Promise.resolve({
                type: "draw",
                game: game,
                num: cardsDrawn
            });
        } else if (card.split(" ")[0].toLowerCase() === "wild") { //Check if the user wants to play a wild
            var color = card.split(" ")[2].slice(0, 1).toUpperCase() + card.split(" ")[2].slice(1, card.split(" ")[2].length).toLowerCase(); //Literally all this does is make the first character of the color uppercase

            var findCard = game.players[game.turn].hand.find(i => i.type.toLowerCase() === card.split(" ")[0].toLowerCase() && i.value.toLowerCase() === card.split(" ")[1].toLowerCase()); //Get the card to be played

            game.players[game.turn].hand.splice(game.players[game.turn].hand.indexOf(findCard), 1); //Remove the card from the users hand

            game.discardPile.push(findCard);

            game.curCard = { //Set the current card for the next turn
                type: color,
                value: "Wild"
            };

            if (card.split(" ")[1].toLowerCase() === "draw4") { //Check if the card is a wild draw 4
                var curPlayer = game.players[game.turn]; //Get the current player

                this.incTurn(game.id);

                drawCards(4, game, game.players[game.turn].hand);

                return Promise.resolve({
                    type: "wild-draw4",
                    game: game,
                    curPlayer: curPlayer
                });
            } else { //If the card isn't a wild draw 4
                return Promise.resolve({
                    type: "wild-normal",
                    game: game
                });
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
    }
};

function cardIsPlayable(card, curCard) {
    if (card.value === curCard.value || card.type === curCard.type || card.type.toLowerCase() === "wild") {
        return true;
    } else {
        return false;
    };
};

function drawCards(n, game, arr) { //Add cards individually to avoid multiple arrays in the hand
    var card;

    if (game.deck._stack.length - n <= 0) {
        while (game.deck._stack.length) {
            card = game.deck.draw(1);

            game.totalDrawn++;

            arr.push(card);
        };

        if (game.discardPile.length) {
            game.deck = new Deck(game.discardPile);

            game.deck.shuffle();

            module.exports.pushPlay(game.id, `Shuffled **${game.discardPile.length}** cards back into the draw pile`);

            game.discardPile = [];
        };

        game.cardsRemaining = game.deck._stack.length;

        return card;
    };

    game.totalDrawn += n;

    for (let i = 0; i < n; i++) {
        card = game.deck.draw(1);

        arr.push(card);
    };

    game.cardsRemaining = game.deck._stack.length;

    return card;
};

function checkCanUno(player, gameId) {
    var canUno = false;

    if (games[gameId] && games[gameId].players.find(i => i.player === player) && games[gameId].isPlaying === true) {
        canUno = true;
    };

    return canUno;
};

function checkCanPlay(player, gameId) { //Check if the player is able to join a game
    if (games[gameId].players.find(i => i.player === player)) { //Check if the player is already in the game
        return "alreadyInGame";
    };

    if (games[gameId].players.length > 9) { //Check if there's already ten people playing
        return "gameAtMaxCapacity";
    };

    if (games[gameId].isPlaying === true) { //Check if the game has already started
        return "gameInProgress";
    };

    return true;
};

module.exports.emitter = emitter;