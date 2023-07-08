const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'playskip',
    description: 'Immediately play a song',
    category: 'Music',
    cooldown: 2500,
    usage: '`/playskip <song>`',
    example: '`/playskip never gonna give you up`',
    slashOptions: new client.slashCommand()
        .addStringOption(option => {
            return option
                .setName('song')
                .setDescription('The title or YouTube link of the song to play')
                .setRequired(true);
        }),
    async execute(interaction) {
        // Ensure we don't time out while loading the song
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        let perms = interaction.member.voice.channel.permissionsFor(client.user);
        let song = interaction.options.getString('song');

        if (!perms.has('CONNECT')) {
            return interaction.editReply('I can\'t connect to this voice channel. Do I have the correct permissions?');
        }

        if (!perms.has('SPEAK')) {
            return interaction.editReply('I can\'t speak in this channel! Do I have the correct permissions?');
        }

        return player.play(song, interaction, true).then(res => {
            interaction.editReply({
                embeds: [res]
            });
        }).catch(e => {
            console.log(e)
            interaction.editReply(e);
        });
    },
};