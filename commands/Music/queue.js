const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'queue',
    description: 'Get the current queue. Use "queue clear" to clear the queue',
    category: 'Music',
    usage: '`{prefix}queue` or `{prefix}queue clear`',
    examples: '`{prefix}queue clear`',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        if (args[0] && args[0].toLowerCase() === "clear") { //Clear the queue if the member says to
            client.player.clearQueue(msg.guild.id).then(() => {
                return msg.channel.send("Queue cleared!");
            }).catch(err => {
                return msg.channel.send("There's nothing to clear!");
            });

            return;
        };

        client.player.getQueue(msg.guild.id).then(queue => {
            const nowPlaying = queue.songs[0]; //Get the currently playing song

            const edited = queue.songs.slice(1) //Ignore the currently playing song

            var i = 0; //Set a variable for the queue count

            var upNext = edited.map((song) => { //Get all the songs in the queue except the first one
                while (i < 10) { //Get only the first 10 items in the queue
                    +i; //Increment the counter by one

                    return `\`${`#${i = i + 1}`}\` ${song.title} | ${song.duration}`; //Format the message correctly
                };
            }).join('\n');

            const embed = new Discord.MessageEmbed() //Set up an embed
                .setTitle(`Queue for ${msg.guild}`)
                .setColor(config.embedColor)
                .setFooter(`${config.name} | Only the first 10 items are shown | Total queue size: ${queue.songs.length} | Total queue length: ${client.player.getTime(queue.totalTimeMs)}`, client.user.avatarURL())
                .addField("Now Playing:", `${nowPlaying.title} | ${nowPlaying.duration}`)

            if (upNext) { //Add a field if there's more than one song in the queue
                embed.addField("Up Next:", upNext);
            };

            msg.channel.send({ //Send the embed
                embed
            });
        }).catch(err => { //Get the queue
            return msg.channel.send("There isn't anything in the queue!");
        });
    },
};