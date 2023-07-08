const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'volume',
    description: 'Change the son\'s volume',
    category: 'Music',
    usage: '`/volume <vol>`',
    slashOptions: new client.slashCommand()
        .addIntegerOption(o => {
            return o.setName('volume')
                .setDescription('The volume, from 1-100, to set the player to')
                .setMaxValue(100)
                .setMinValue(1)
                .setRequired(true);
        }),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        let vol = interaction.options.getInteger('volume');

        return player.getQueue(interaction.member.guild.id).then(queue => {
            let newVol = queue.setVolume(vol);

            interaction.editReply(`Volume set to ${newVol}`);
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};