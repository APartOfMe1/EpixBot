const Deck = require('card-deck');
const cardList = require('../../assets/cards/uno/cards.json');
const emojis = require("../../assets/emojis/emojis.json");
const EventEmitter = require('events');
const emitter = new EventEmitter();
const games = {};

module.exports = {
    addToGame(player, gameId) {
        if (!games[gameId]) { //Check if the game has already been initialized
            games[gameId] = {};

            games[gameId].isPlaying = false;

            games[gameId].players = [];

            games[gameId].deck = new Deck(cardList.cards);

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

        curGame.turn = 0;

        curGame.plays = [];

        curGame.unoList = [];

        curGame.deck.shuffle();

        var currentCard = curGame.deck.draw(1); //Get the top card

        while (currentCard.type === "Wild" || ["Skip", "Draw2"].includes(currentCard.value)) { //Make sure the top card isn't a special card
            curGame.deck.addToBottom(currentCard); //Put the current card back into the deck

            curGame.deck.shuffle(); //Shuffle everything back in

            currentCard = curGame.deck.draw(1); //Draw a new current card
        };

        curGame.curCard = currentCard;

        this.pushPlay(gameId, `The game starts with a **${currentCard.type} ${currentCard.value}**`); //Set the starting info

        curGame.players.forEach(player => { //Set up each players hand
            drawCards(7, curGame.deck, player.hand); //Add 7 cards to the hand
        });

        return Promise.resolve(curGame);
    },

    pushPlay(gameId, content) {
        if (games[gameId] && games[gameId].plays) {
            games[gameId].plays.push(content);

            return emitter.emit("newPlay", games[gameId].plays);
        } else {
            return false;
        };
    },

    callUno(player, gameId) {
        if (!checkCanUno(user.id, msg.guild.id)) { //Check if the user is able to call uno
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

                    drawCards(2, curGame.deck, i.hand); //Add the cards to the players hand

                    return Promise.resolve({
                        type: "calledOnOtherPlayer",
                        player: i
                    });
                };
            };

            if (!uno) { //If no one has one card left
                drawCards(2, curGame.deck, player.hand);

                return promises.resolve({
                    type: "falseUno",
                    player: player
                });
            };
        };
    }
};

function drawCards(n, deck, arr) { //Add cards individually to avoid multiple arrays in the hand
    for (let i = 0; i < n; i++) {
        arr.push(deck.draw(1));
    };
};

function checkCanUno(player, gameId) {
    var canUno = false;

    if (games[gameId] && games[gameId].find(i => i.player === player) && games[gameId].isPlaying === true) {
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