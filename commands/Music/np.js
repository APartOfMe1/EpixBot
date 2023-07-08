const player = require('../../handlers/music/music.js');
const Discord = require('discord.js');
const config = require("../../config/config.json");

module.exports = {
    name: 'np',
    description: 'Get info on the currently playing song',
    aliases: ['now-playing'],
    category: 'Music',
    usage: '`/np`',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        return player.getQueue(interaction.member.guild.id).then(queue => {
            const nowPlaying = queue.getFirstSong();

            const embed = new Discord.EmbedBuilder()
                .setColor(config.embedColor)
                .setAuthor({ name: 'Now Playing' })
                .setTitle(nowPlaying.title)
                .setURL(nowPlaying.url)
                .setThumbnail(nowPlaying.thumbnailUrl)
                .setDescription(`${queue.getCurrentSongProgress(true)} / ${nowPlaying.durationHms()}\n\n${createSlider(queue.getCurrentSongProgress(), nowPlaying.durationMs)}`)
                .addFields(
                    { name: 'Channel', value: nowPlaying.channel, inline: true },
                    { name: 'Views', value: nowPlaying.formatViews(), inline: true },
                    { name: 'Uploaded', value: nowPlaying.uploadedAt, inline: true },
                    { name: 'Volume', value: queue.getVolume(true), inline: true },
                    { name: 'Requested By', value: nowPlaying.requestedBy, inline: true },
                );

            interaction.editReply({
                embeds: [embed],
            })
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};

function createSlider(current, total) {
    var slider = [];

    // Get the percentage of the song played
    var percent = (100 * current) / total;

    // Round the percentage to the nearest 10
    percent = Math.round(percent / 10) * 10;

    // Calculate how many dashes are needed in front
    var front = (percent / 10) - 1;

    // Calculate how many dashes are needed in the back
    var back = 10 - (percent / 10);

    var i = 0;

    // Add the necessary amount of dashes to the array
    while (i < front) {
        ++i;

        slider.push("▬");
    }

    slider.push("🔘");

    i = 0;

    // Add the necessary amount of dashes to the end of the array
    // The total amount of items in the array should always be 10
    while (i < back) {
        ++i;

        slider.push("▬");
    }

    return slider.join("");
}