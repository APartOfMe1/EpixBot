const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'queue',
    description: 'Get the current queue. Use "queue clear" to clear the queue',
    category: 'Music',
    usage: '`{prefix}queue` or `{prefix}queue clear`',
    examples: '`{prefix}queue clear`',
    async execute(msg, args) {
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        if (args[0] && args[0].toLowerCase() === "clear") {
            client.player.clearQueue(msg.guild.id).then(() => {
                return msg.channel.send("Queue cleared!");
            }).catch(err => {
                return msg.channel.send("There's nothing to clear!");
            });

            return;
        }

        client.player.getQueue(msg.guild.id).then(queue => {
            // Get the currently playing song
            const nowPlaying = queue.songs[0];

            // Ignore the currently playing song
            const edited = queue.songs.slice(1);

            var i = 0;

            // Get all the songs in the queue except the first one
            var upNext = edited.map((song) => {
                // Get only the first 10 items in the queue
                while (i < 10) {
                    ++i;

                    return `\`${`#${i = i + 1}`}\` ${song.title} | ${song.duration}`;
                }
            }).join('\n');

            const embed = new Discord.MessageEmbed()
                .setTitle(`Queue for ${msg.guild}`)
                .setColor(config.embedColor)
                .setFooter(`${config.name} | Only the first 10 items are shown | Total queue size: ${queue.songs.length} | Total queue length: ${client.player.getTime(queue.totalTimeMs)}`, client.user.avatarURL())
                .addField("Now Playing:", `${nowPlaying.title} | ${nowPlaying.duration}`)

            // Add a field if there's more than one song in the queue
            if (upNext) {
                embed.addField("Up Next:", upNext);
            }

            msg.channel.send({
                embed
            });
        }).catch(err => {
            return msg.channel.send("There isn't anything in the queue!");
        });
    },
};