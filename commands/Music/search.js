const Discord = require('discord.js');
const ytsr = require('ytsr');
const config = require("../../config/config.json");

module.exports = {
    name: 'search',
    description: 'Search for music to play',
    category: 'Music',
    cooldown: 2500,
    async execute(msg, args) {
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        const perms = msg.member.voice.channel.permissionsFor(msg.client.user);

        if (!perms.has('CONNECT')) {
            return msg.channel.send('I can\'t connect to this voice channel. Do I have the correct permissions?');
        }

        if (!perms.has('SPEAK')) {
            return msg.channel.send('I can\'t speak in this channel! Do I have the correct permissions?');
        }

        if (!perms.has('VIEW_ChANNEL')) {
            return msg.channel.send('I can\'t view this channel! Do I have the correct permissions?');
        }

        if (!args[0]) {
            return msg.channel.send("You need to give me a song to search for!");
        }

        // Search for youtube videos with the given arguments
        ytsr(args.join(" "), {
            limit: 10
        }).then(async searchResults => {
            // Check if there were no results at all
            if (!searchResults.items.length) {
                return msg.channel.send("I couldn't find any results for that search!");
            }

            var sortedResults = [];

            var i = 0;

            // Check each result
            for (const song of searchResults.items) {
                // Make sure the entry isn't a "related search" thing
                if (song.title !== "Related to your search" && song.duration !== undefined) {
                    i++;

                    sortedResults.push({
                        title: song.title,
                        url: song.url,
                        duration: song.duration,
                        formatted: `**${i}** | [${song.title}](${song.url}) | ${song.duration}`
                    });
                }
            }

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
                }

                // Get the correct item in the array
                var result = sortedResults[collected.first().content - 1];

                // Play the song / Add to the queue
                client.player.play(result.url, msg.member.voice.channel, msg.channel, msg.author);

                searchMsg.delete();
            }).catch(e => {
                return searchMsg.edit("No answer was given", {
                    embeds: [null]
                });
            });
        });
    },
};