const Discord = require('discord.js');
const config = require("../../config/config.json");
const {
    getLyrics
} = require('genius-lyrics-api');

module.exports = {
    name: 'lyrics',
    description: 'Search lyrics from the currently playing song, or any other!',
    category: 'Music',
    cooldown: 2500,
    usage: '`{prefix}lyrics` or `{prefix}lyrics <song>`',
    examples: '`{prefix}lyrics africa`',
    async execute(msg, args) {
        if (!config.geniuskey) {
            return msg.channel.send("To search for lyrics, you need to add a Genius Lyrics API key to the `congig.json` file in the `config` folder");
        };
        
        if (!args[0]) {
            client.player.getQueue(msg.guild.id).then(queue => {
                const song = queue.songs[0]; //Get the currently playing song

                var options = {
                    apiKey: config.geniuskey,
                    title: song.title,
                    artist: " ",
                    optimizeQuery: true
                };

                return getLyrics(options).then(lyrics => { //Search for the lyrics
                    if (!lyrics) { //Send an error if there wasn't anything found
                        return msg.channel.send("I couldn't find lyrics for that song!");
                    };

                    var embed = new Discord.MessageEmbed()
                        .setColor(config.embedColor);

                    for (let i = 0; i < lyrics.length; i += 2000) { //Split the embed into multiple parts if it's over the character limit
                        var toSend = lyrics.substring(i, Math.min(lyrics.length, i + 2000));

                        embed.setDescription(toSend);

                        msg.channel.send({embeds: [embed]});
                    };

                    return;
                }).catch(e => {
                    return msg.channel.send("I couldn't find lyrics for that song!");
                });
            }).catch(err => {
                return msg.channel.send("You need to give me a song to search for!");
            });

            return;
        };

        var options = {
            apiKey: config.geniuskey,
            title: args.join(" "),
            artist: " ",
            optimizeQuery: true
        };

        return getLyrics(options).then(lyrics => { //Search for the lyrics
            if (!lyrics) { //Send an error if there wasn't anything found
                return msg.channel.send("I couldn't find lyrics for that song!");
            };

            var embed = new Discord.MessageEmbed()
                .setColor(config.embedColor);

            for (let i = 0; i < lyrics.length; i += 2000) { //Split the embed into multiple parts if it's over the character limit
                var toSend = lyrics.substring(i, Math.min(lyrics.length, i + 2000));

                embed.setDescription(toSend);

                msg.channel.send({embeds: [embed]});
            };

            return;
        }).catch(e => {
            return msg.channel.send("I couldn't find lyrics for that song!");
        });
    },
};