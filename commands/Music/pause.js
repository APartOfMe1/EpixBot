const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'pause',
    description: 'Pause/unpause the currently playing song',
    category: 'Music',
    usage: '`/pause`',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        return player.getQueue(interaction.member.guild.id).then(queue => {
            if (queue.currentlyPlaying()) {
                let state = queue.togglePause();

                if (state) {
                    interaction.editReply('Paused');
                } else {
                    interaction.editReply('Resuming');
                }
            } else {
                interaction.editReply('There isn\t anything playing!');
            }
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};