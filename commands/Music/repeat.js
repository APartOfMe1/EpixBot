const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'repeat',
    description: 'Toggle repeat mode',
    category: 'Music',
    usage: '`/repeat`',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        return player.getQueue(interaction.member.guild.id).then(queue => {
            let repeat = queue.setRepeatMode();

            if (repeat) {
                interaction.editReply('Repeat mode enabled');
            } else {
                interaction.editReply('Repeat mode disabled');
            }
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};