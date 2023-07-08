const { time } = require('discord.js');
const player = require('../../handlers/music/music.js');
const timeFormat = require('../../utilities/timeFormat.js');

module.exports = {
    name: 'seek',
    description: 'Skip to a part of the song',
    category: 'Music',
    usage: '`/seek <timestamp>`',
    slashOptions: new client.slashCommand()
        .addStringOption(option => {
            return option
                .setName('timestamp')
                .setDescription('An hh:mm:ss timestamp of where to seek to');
        }),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        let seekHms = interaction.options.getString('timestamp');

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        return player.getQueue(interaction.member.guild.id).then(queue => {
            let seekTime = timeFormat.hmsToMs(seekHms);

            if (!seekTime) {
                return interaction.editReply('That\s not a valid timestamp');
            }

            let success = queue.setSeekTime(seekTime);

            if (success) {
                interaction.editReply(`Skipping to ${timeFormat.msToHms(seekTime)}...`);
            } else {
                interaction.editReply('I can\'t seek to timestamps within 5 seconds of the end of the song');
            }
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};