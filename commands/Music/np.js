const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'np',
    description: 'Get info on the currently playing song',
    aliases: ["now-playing"],
    category: 'Music',
    async execute(msg, args) {
        client.player.getQueue(msg.guild.id).then(queue => {
            const nowPlaying = queue.songs[0]; //Get the currently playing song

            const embed = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setAuthor("Now Playing")
                .setTitle(nowPlaying.title)
                .setURL(nowPlaying.url)
                .setThumbnail(nowPlaying.thumbnail)
                .setDescription(`${client.player.getTime(queue.channel.dispatcher.streamTime + queue.seekTime)} / ${client.player.getTime(client.player.hmsToMs(nowPlaying.duration))}\n\n${createSlider(queue.channel.dispatcher.streamTime + queue.seekTime, client.player.hmsToMs(nowPlaying.duration))}`)
                .addField("Channel", nowPlaying.channel, true)
                .addField("Requested By", nowPlaying.requestedBy, true)
                .addField("Current Volume", `${queue.volume}/100`, true);

            return msg.channel.send({
                embed
            });
        }).catch(err => {
            return msg.channel.send("No songs are currently playing!");
        });

        function createSlider(current, total) {
            var slider = []; //Create am empty array

            var percent = (100 * current) / total; //Get the percentage of the song played

            percent = Math.round(percent / 10) * 10; //Round the percentage to the nearest 10

            var front = (percent / 10) - 1; //Calculate how many dashes are needed in front

            var back = 10 - (percent / 10); //Calculate how many dashes are needed in the back

            var i = 0;

            while (i < front) { //Add the necessary amount of dashes to the array
                ++i;

                slider.push("▬");
            };

            slider.push("🔘");

            i = 0;

            while (i < back) { //Add the necessary amount of dashes to the end of the array. The total amount of items in the array should always be 10
                ++i;

                slider.push("▬");
            };

            return slider.join("");
        };
    },
};