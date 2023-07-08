const Discord = require('discord.js');
const ytsr = require('ytsr');
const player = require('../../handlers/music/music.js');

module.exports = {
    name: 'search',
    description: 'Search for a song to add to the queue',
    category: 'Music',
    usage: '`/search <query>`',
    slashOptions: new client.slashCommand()
        .addStringOption(option => {
            return option
                .setName('query')
                .setDescription('The song to search for')
                .setRequired(true);
        }),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        // Get permissions
        let perms = interaction.member.voice.channel.permissionsFor(client.user);
        let query = interaction.options.getString('query');

        if (!perms.has('CONNECT')) {
            return interaction.editReply('I can\'t connect to this voice channel. Do I have the correct permissions?');
        }

        if (!perms.has('SPEAK')) {
            return interaction.editReply('I can\'t speak in this channel! Do I have the correct permissions?');
        }

        // Search for videos
        let results = await ytsr(query, {
            limit: 20
        });

        // Make sure we have results
        if (!results.items || !results.items.length) {
            return interaction.editReply('No results found');
        }

        // Create a select menu with the song choices
        let menu = new Discord.StringSelectMenuBuilder()
            .setCustomId('results')
            .setPlaceholder('Select a song');

        let i = 0;
        for (const video of results.items) {
            // Make sure it's an actual video and has the bits we need
            if (video.url && video.author) {
                menu.addOptions(
                    new Discord.StringSelectMenuOptionBuilder()
                        .setLabel(video.title)
                        .setDescription(`${video.author.name} | ${video.duration}`)
                        .setValue(i.toString()),
                );
            }

            i++;
        }

        let row = new Discord.ActionRowBuilder()
            .addComponents(menu);

        const reply = await interaction.editReply({
            content: 'Choose which song to play',
            components: [row],
        });

        let filter = i => i.user.id === interaction.user.id;

        try {
            // Wait for a response
            let response = await reply.awaitMessageComponent({ filter: filter, time: 30000 });
            let index = parseInt(response.values[0]);

            // Add the song to the queue
            return player.play(results.items[index].url, interaction).then(res => {
                interaction.editReply({
                    embeds: [res],
                    content: '',
                    components: []
                });
            }).catch(e => {
                interaction.editReply({
                    content: e,
                    components: []
                });
            });
        } catch (e) {
            await interaction.editReply({
                content: 'No response recieved',
                components: []
            });
        }
    },
};