const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const playdl = require('play-dl');
const Discord = require('discord.js');
const dVoice = require('@discordjs/voice');
const config = require('../../config/config.json');
const timeFormat = require('../../utilities/timeFormat.js');
const Queue = require('./queue.js');
const Song = require('./song.js');
const queues = {};

module.exports = {
    // Get the full queue for a guild
    getQueue(guildId) {
        if (!queues[guildId]) {
            return Promise.reject('No songs are currently playing');
        };

        return Promise.resolve(queues[guildId]);
    },

    // Add a song to the queue
    async play(song, interaction, addToTop) {
        // Create new queue if needed
        if (!queues[interaction.member.guild.id]) {
            queues[interaction.member.guild.id] = new Queue(interaction);
        }

        const queue = queues[interaction.member.guild.id];

        var formattedResult;

        if (ytpl.validateID(song)) { // Input is a playlist
            let playlist = await ytpl(song);

            if (!playlist || !playlist.items.length) {
                return Promise.reject('An error occured while getting playlist details');
            }

            // Enqueue every item in playlist
            for (const video of playlist.items) {
                let formatted = new Song(video, interaction.user.username, 'playlist');

                queue.addToQueue(formatted, addToTop);
            }

            let embed = new Discord.EmbedBuilder()
                .setColor(config.embedColor)
                .setAuthor({ name: `Added ${playlist.estimatedItemCount} items to Queue` })
                .setTitle(playlist.title)
                .setURL(playlist.url)
                .setThumbnail(playlist.bestThumbnail.url)
                .addFields(
                    { name: 'Video Count', value: playlist.estimatedItemCount.toString(), inline: true },
                    { name: 'Playlist Author', value: playlist.author.name, inline: true },
                    { name: 'Views', value: playlist.views.toString(), inline: true },
                    { name: 'Updated', value: playlist.lastUpdated, inline: true }
                );

            if (!queue.currentlyPlaying()) {
                playSong(queue);
            }

            return Promise.resolve(embed);
        } else if (ytdl.validateURL(song) || ytdl.validateID(song)) { // Input is a YT URL
            let video = await ytdl.getBasicInfo(song);

            if (!video || !video.videoDetails) {
                return Promise.reject('An error occured while getting video details');
            }

            formattedResult = new Song(video, interaction.user.username, 'url');

            queue.addToQueue(formattedResult, addToTop);
        } else {
            // Input isn't a valid URL. Search by title
            let search = await ytsr(song, { limit: 1 });

            if (!search.items.length || !search.items[0].url) {
                return Promise.reject('No results found');
            }

            formattedResult = new Song(search.items[0], interaction.user.username, 'search');

            queue.addToQueue(formattedResult, addToTop);
        }

        let embed = new Discord.EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: 'Added to Queue' })
            .setTitle(formattedResult.title)
            .setURL(formattedResult.url)
            .setThumbnail(formattedResult.thumbnailUrl)
            .addFields(
                { name: 'Length', value: timeFormat.msToHms(formattedResult.durationMs), inline: true },
                { name: 'Channel', value: formattedResult.channel, inline: true },
                { name: 'Views', value: formattedResult.views.toString(), inline: true },
                { name: 'Uploaded', value: formattedResult.uploadedAt, inline: true }
            );

        if (!queue.currentlyPlaying()) {
            playSong(queue);
        }

        return Promise.resolve(embed);
    }
}

// Play the first song in a queue
async function playSong(queue) {
    let connection = dVoice.getVoiceConnection(queue.guildId);

    if (!connection) {
        // Create a connection
        connection = dVoice.joinVoiceChannel({
            channelId: queue.voiceChannelId,
            guildId: queue.guildId,
            adapterCreator: queue.guild.voiceAdapterCreator,
        });
    }

    const song = queue.getFirstSong();

    const stream = await playdl.stream(song.url);

    const player = dVoice.createAudioPlayer({
        behaviors: {
            noSubscriber: dVoice.NoSubscriberBehavior.Pause,
        },
    });

    queue.setPlayer(player);

    const resource = dVoice.createAudioResource(stream.stream, {
        inputType: stream.type
    });

    player.play(resource);

    connection.subscribe(player);

    // Let the user know we're playing something new
    let embed = new Discord.EmbedBuilder()
        .setColor(config.embedColor)
        .setAuthor({ name: 'Now Playing' })
        .setTitle(song.title)
        .setURL(song.url)
        .setThumbnail(song.thumbnailUrl)
        .addFields(
            { name: 'Length', value: timeFormat.msToHms(song.durationMs), inline: true },
            { name: 'Channel', value: song.channel, inline: true },
            { name: 'Views', value: song.views, inline: true },
            { name: 'Uploaded', value: song.uploadedAt, inline: true },
            { name: 'Requested By', value: song.requestedBy, inline: true },
        );

    client.channels.cache.get(queue.msgChannelId).send({
        embeds: [embed]
    });

    player.on('error', e => {
        // Just try to restart the song
        if (queue.getQueueLength() > 0) {
            playSong(queue);
        }
    });

    // The song is over
    player.on(dVoice.AudioPlayerStatus.Idle, () => {
        if (!queue.repeatMode) {
            queue.removeFirstSong();
        }

        // Do we want to play the next song?
        if (queue.getQueueLength() > 0) {
            playSong(queue);
        } else {
            client.channels.cache.get(queue.msgChannelId).send('I finished playing the current queue!');

            // BURN THE WITCH
            player.stop();
            let guildId = queue.guildId;
            delete queue;
            delete queues[guildId];
        }
    });
}