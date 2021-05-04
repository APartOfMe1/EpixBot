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
                curCard: null,
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
            drawCards(2, curGame, player.hand); //Add 7 cards to the hand
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

        if (curGame.players.find(p => p.player === player && p.hand.length <= 2 && p.hand.find(card => curGame.curCard.type === card.type || curGame.curCard.value === card.value || card.type === "Wild"))) { //Check if the user is about to play their 2nd to last card or only has one
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

    checkWinner(game) {
        for (const player of game.players) {
            if (player.hand.length === 0) {
                return Promise.resolve({
                    game: game,
                    winner: player
                });
            };
        };

        return Promise.reject();
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

            while (justDrawn.type === "Wild" || justDrawn.value === "Skip" || justDrawn.value === "Draw2" || !cardIsPlayable(justDrawn, game.curCard)) { //Draw cards until the user can play one
                cardsDrawn++; //Add one to the card counter

                justDrawn = drawCards(1, game, player.hand); //Add a card to the users hand
            };

            playCardInHand(game, `${justDrawn.type} ${justDrawn.value}`); //Send the card as a string because that's what the function expects

            return Promise.resolve({
                type: "draw",
                game: game,
                num: cardsDrawn
            });
        } else if (card.split(" ")[0].toLowerCase() === "wild") { //Check if the user wants to play a wild
            var color = card.split(" ")[2].slice(0, 1).toUpperCase() + card.split(" ")[2].slice(1, card.split(" ")[2].length).toLowerCase(); //Literally all this does is make the first character of the color uppercase

            playCardInHand(game, card, color);

            if (card.split(" ")[1].toLowerCase() === "draw4") { //Check if the card is a wild draw 4
                this.incTurn(game.id);

                drawCards(4, game, game.players[game.turn].hand); //Get the current player again instead of using the constant because we incremented the turn

                return Promise.resolve({
                    type: "wild-draw4",
                    game: game,
                    curPlayer: player
                });
            } else { //If the card isn't a wild draw 4
                return Promise.resolve({
                    type: "wild-normal",
                    game: game
                });
            };
        } else if (card.split(" ")[1].toLowerCase() === "skip") {
            playCardInHand(game, card);

            this.incTurn(game.id);

            return Promise.resolve({
                type: "skip",
                game: game,
                curPlayer: player
            });
        } else if (card.split(" ")[1].toLowerCase() === "draw2") {
            playCardInHand(game, card);

            this.incTurn(game.id);

            drawCards(2, game, game.players[game.turn].hand);

            return Promise.resolve({
                type: "draw2",
                game: game,
                curPlayer: player
            });
        } else { //If it's just a normal card to be played
            playCardInHand(game, card);

            return Promise.resolve({
                type: "normal",
                game: game
            });
        };
    }
};

function playCardInHand(game, card, color) {
    const player = game.players[game.turn];

    const findCard = player.hand.find(c => c.type.toLowerCase() === card.split(" ")[0].toLowerCase() && c.value.toLowerCase() === card.split(" ")[1].toLowerCase()); //Get the card to be played

    if (!findCard) {
        return false;
    };

    var type = findCard.type;

    var value = findCard.value;

    if (findCard.type === "Wild" && color) {
        type = color;

        if (value === "Normal") {
            value = "Wild Normal";
        } else if (value === "Draw4") {
            value = "Wild Draw4";
        };
    };

    player.hand.splice(player.hand.indexOf(findCard), 1); //Remove the card from the players hand

    game.discardPile.push(findCard); //Add the card to the discard pile

    game.curCard = { //Set the current card for the next turn
        type: type,
        value: value
    };

    return;
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

    if (game.deck._stack.length - n <= 0) { //Check if there's enough cards left to draw in the deck
        while (game.deck._stack.length) { //Add the last few cards to the players hand
            card = game.deck.draw(1);

            game.totalDrawn++;

            arr.push(card);
        };

        if (game.discardPile.length) { //Shuffle the cards from the discard pile back into the deck
            game.deck = new Deck(game.discardPile);

            game.deck.shuffle();

            module.exports.pushPlay(game.id, `Shuffled **${game.discardPile.length}** cards back into the draw pile`);

            game.discardPile = []; //Reset the discard pile
        };

        game.cardsRemaining = game.deck._stack.length;

        return card;
    };

    game.totalDrawn += n;

    for (let i = 0; i < n; i++) { //Draw the specified amount of cards
        card = game.deck.draw(1);

        arr.push(card);
    };

    game.cardsRemaining = game.deck._stack.length;

    return card;
};

function checkCanUno(player, gameId) { //Check if the player is able to call uno at all
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