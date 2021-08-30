const Discord = require('discord.js');
const ytsr = require('ytsr');
const config = require("../../config/config.json");

module.exports = {
    name: 'search',
    description: 'Search for music to play',
    category: 'Music',
    cooldown: 2500,
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        const perms = msg.member.voice.channel.permissionsFor(msg.client.user); //Get the bots' permissions for the current voice channel

        if (!perms.has('CONNECT')) { //Make sure the bot can connect
            return msg.channel.send('I can\'t connect to this voice channel. Do I have the correct permissions?');
        };

        if (!perms.has('SPEAK')) { //Make sure the bot can transmit audio
            return msg.channel.send('I can\'t speak in this channel! Do I have the correct permissions?');
        };

        if (!perms.has('VIEW_ChANNEL')) { //Make sure the bot can view the channel
            return msg.channel.send('I can\'t view this channel! Do I have the correct permissions?');
        };

        if (!args[0]) { //Make sure the bot is actually given a song to search for
            return msg.channel.send("You need to give me a song to search for!");
        };

        ytsr(args.join(" "), { //Search for youtube videos with the given arguments
            limit: 10
        }).then(async searchResults => {
            if (!searchResults.items.length) { //Check if there were no results at all
                return msg.channel.send("I couldn't find any results for that search!");
            };

            var sortedResults = [];

            var i = 0;

            for (const song of searchResults.items) { //Check each result
                if (song.title !== "Related to your search" && song.duration !== undefined) { //Make sure the entry isn't a "related search" thing
                    i++;

                    sortedResults.push({ //Add the video to the array
                        title: song.title,
                        url: song.url,
                        duration: song.duration,
                        formatted: `**${i}** | [${song.title}](${song.url}) | ${song.duration}`
                    });
                };
            };

            const resultsEmb = new Discord.MessageEmbed()
                .setTitle(`Results for "${args.join(" ")}"`)
                .setColor(config.embedColor)
                .setFooter(`${config.name} | Respond with 1-${i} to make a choice! | Respond with "cancel" to cancel | This message will time out in 45 seconds`, client.user.avatarURL())
                .setDescription(sortedResults.map(s => s.formatted).join("\n\n"));

            var searchMsg = await msg.channel.send({
                embeds: [resultsEmb]
            });

            const filter = m => ((m.content > 0 && m.content < i + 1) || m.content.toLowerCase() === "cancel") && m.author.id === msg.author.id;

            msg.channel.awaitMessages(filter, {
                max: 1,
                time: 45000,
                errors: ['time']
            }).then(collected => {
                if (collected.first().content.toLowerCase() === "cancel") {
                    return searchMsg.edit("Cancelled", {
                        embeds: [null]
                    });
                };

                var result = sortedResults[collected.first().content - 1]; //Get the correct item in the array
                
                client.player.play(result.url, msg.member.voice.channel, msg.channel, msg.author); //Play the song / Add to the queue

                searchMsg.delete(); //Delete the message
            }).catch(e => {
                return searchMsg.edit("No answer was given", {
                    embeds: [null]
                });
            });
        });
    },
};