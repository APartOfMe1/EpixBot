const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'remove',
    description: 'Remove a song from the queue',
    category: 'Music',
    usage: '`/remove <index>`',
    slashOptions: new client.slashCommand()
        .addIntegerOption(o => {
            return o.setName('index')
                .setDescription('The position in the queue of the song to remove. From 1-10')
                .setMaxValue(10)
                .setMinValue(1)
                .setRequired(true);
        }),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        let index = interaction.options.getInteger('index');

        return player.getQueue(interaction.member.guild.id).then(queue => {
            let removed = queue.removeSong(index);

            if (removed) {
                interaction.editReply(`**${removed.title}** has been removed from the queue`);
            } else {
                let max = queue.getQueueLength() - 1;
                
                // Are there songs in the queue? (We ignore the currently playing song)
                if (max == 0) {
                    interaction.editReply('There are no queued songs to remove');
                } else {
                    interaction.editReply(`I couldn't find that song in the queue. Try using a number between 1 and ${max}`);
                }
            }
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};