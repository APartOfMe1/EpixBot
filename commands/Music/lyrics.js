const player = require('../../handlers/music/music.js');
const config = require('../../config/config.json');
const Discord = require('discord.js');
const Genius = require('genius-lyrics');
const genius = new Genius.Client(config.geniuskey);

module.exports = {
    name: 'lyrics',
    description: 'Find lyrics for a song',
    category: 'Music',
    cooldown: 5000,
    usage: '`/lyrics <song>`',
    slashOptions: new client.slashCommand()
        .addStringOption(option => {
            return option
                .setName('song')
                .setDescription('The title of the song to search for');
        }),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        var search = interaction.options.getString('song');

        // Use the currently playing song as a search query
        if (!search) {
            let queue = await player.getQueue(interaction.member.guild.id, true);

            if (queue && queue.currentlyPlaying()) {
                let song = queue.getFirstSong();

                search = song.title;
            } else {
                return interaction.editReply('You need to provide a song to search for');
            }
        }

        let results = await genius.songs.search(search);

        if (!results.length) {
            return interaction.editReply('No results found');
        }

        let lyrics = await results[0].lyrics();
        let embeds = splitIntoEmbeds(lyrics);
        let row = generateRow(results, 0);

        const initialReply = await interaction.editReply({
            embeds: embeds,
            components: [row],
        });

        // Update response on new selections
        const collector = initialReply.createMessageComponentCollector({ componentType: Discord.ComponentType.StringSelect, time: 300000 });
        collector.on('collect', async i => {
            let index = parseInt(i.values[0]);
            let lyrics = await results[index].lyrics();
            let embeds = splitIntoEmbeds(lyrics);
            let row = generateRow(results, index);

            i.update({
                embeds: embeds,
                components: [row],
            });
        });
    },
};

function splitIntoEmbeds(lyrics) {
    let embeds = [];

    // Split the embed into multiple parts if it's over the character limit
    for (let i = 0; i < lyrics.length; i += 2000) {
        let embed = new Discord.EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(lyrics.substring(i, Math.min(lyrics.length, i + 2000)));

        embeds.push(embed);
    }

    return embeds;
}

function generateRow(results, curSelection) {
    // Create a select menu with the other potential song matches
    let menu = new Discord.StringSelectMenuBuilder()
        .setCustomId('results')
        .setPlaceholder(results[curSelection].title.substring(0, 99));

    let i = 0;
    for (const song of results.slice(0, 25)) {
        menu.addOptions(
            new Discord.StringSelectMenuOptionBuilder()
                .setLabel(song.title.substring(0, 99))
                .setDescription(song.artist.name.substring(0, 99))
                .setValue(i.toString()),
        );

        i++;
    }

    const row = new Discord.ActionRowBuilder()
        .addComponents(menu);

    return row;
}