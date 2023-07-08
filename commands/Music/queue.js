const Discord = require('discord.js');
const config = require('../../config/config.json');
const player = require('../../handlers/music/music.js');
const timeFormat = require('../../utilities/timeFormat.js');

module.exports = {
    name: 'queue',
    description: 'Get the current queue. Use "/queue clear" to clear the queue',
    category: 'Music',
    usage: '`/queue` or `/queue clear`',
    examples: '`/queue clear`',
    slashOptions: new client.slashCommand()
        .addBooleanOption(o => {
            return o.setName('clear')
                .setDescription('Clear the contents of the queue');
        }),
    async execute(interaction) {
        // Ensure we don't time out
        await interaction.deferReply();

        if (!interaction.member.voice.channel) {
            return interaction.editReply('You need to be in a voice channel to use this command!');
        }

        player.getQueue(interaction.member.guild.id).then(queue => {
            if (interaction.options.getBoolean('clear')) {
                queue.clearQueue();

                return interaction.editReply('Queue cleared!');
            }

            let songs = queue.getAllSongs();

            // Get the currently playing song
            let nowPlaying = songs[0];

            // Ignore the currently playing song
            let edited = songs.slice(1);

            // Get all the songs in the queue except the first one
            let i = 0;
            let upNext = edited.map((song) => {
                return `\`${`#${i = i + 1}`}\` ${song.title} | ${timeFormat.msToHms(song.durationMs)}`;
            }).slice(0, 10).join('\n');

            const embed = new Discord.EmbedBuilder()
                .setTitle(`Queue for ${interaction.member.guild}`)
                .setColor(config.embedColor)
                .setFooter({text: `${config.name} | Only the first 10 items are shown | Total queue size: ${songs.length} | Total queue length: ${queue.getQueueTime(true)}`})
                .addFields({ name: 'Now Playing:', value: `${nowPlaying.title} | ${timeFormat.msToHms(nowPlaying.durationMs)}` });

            // Add a field if there's more than one song in the queue
            if (upNext) {
                embed.addFields({ name: 'Up Next:', value: upNext });
            }

            interaction.editReply({
                embeds: [embed]
            });
        }).catch(e => {
            interaction.editReply('There isn\'t anything in the queue!');
        });
    },
};