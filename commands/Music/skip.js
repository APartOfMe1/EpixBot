const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'skip',
    description: 'Skip to the next song',
    category: 'Music',
    usage: '`/skip`',
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        return player.getQueue(interaction.member.guild.id).then(queue => {
            let skipped = queue.skip();

            interaction.editReply(`**${skipped.title}** has been skipped!`);
        }).catch(e => {
            interaction.editReply(e);
        });
    },
};