const Discord = require('discord.js');
const Deck = require('card-deck');
const cardList = require('../../assets/cards/uno/cards.json');
const config = require("../../config/config.json");
const emojis = require("../../assets/emojis/emojis.json");
const unoManager = require("../../handlers/Uno/uno.js");
const deck = new Deck(cardList.cards);
const EventEmitter = require('events');
const emitter = new EventEmitter();
const games = {};

module.exports = {
    addToGame(player, gameId) {
        if (!games[gameId]) { //Check if the game has already been initialized
            games[gameId] = {};

            games[gameId].isPlaying = false;

            games[gameId].players = [];

            games[gameId].players.push({ //Add the user to the list of players
                player: player,
                hand: []
            });

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
    }
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

// emitter.emit("newMsg", {
//     text: `${msg.author.tag}: ${filter(msg.content)}`,
//     msg: msg,
//     hangup: hangupIntent
// });

module.exports.emitter = emitter;