const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the queue',
    category: 'Music',
    usage: '`/play`',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        return player.getQueue(interaction.member.guild.id).then(queue => {
            queue.shuffle();

            interaction.editReply('Queue shuffled!');
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};