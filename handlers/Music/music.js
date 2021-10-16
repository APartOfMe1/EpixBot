const Discord = require('discord.js');
const dVoice = require('@discordjs/voice');
const ytdl = require('discord-ytdl-core');
const ytdlCore = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const fs = require('fs');
const path = require('path');
const urlManager = require("./Url-Parser/url-parser.js");
const config = require("../../config/config.json");
const queue = {};

module.exports = {
    getQueue(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        return Promise.resolve(queue[guildId]); //Return the guild's queue
    },

    skip(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        const skipped = queue[guildId].songs[0]; //Store the song

        queue[guildId].channel.dispatcher.end();

        return Promise.resolve(skipped); //Return info about the skipped song
    },

    playSkip(guildId, search, voiceChannel, msgChannel, user, file) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        this.play(search, voiceChannel, msgChannel, user, true, file);

        return Promise.resolve("Done");
    },

    leave(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        queue[guildId].channel.dispatcher.end();

        deleteQueue(guildId);

        return Promise.resolve("Stopped");
    },

    setVolume(guildId, volume) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        queue[guildId].channel.dispatcher.setVolume(volume * 2 / 100);

        queue[guildId].volume = volume;

        return Promise.resolve(`Set volume to **${volume}/100**`);
    },

    hmsToMs(t) { //Converts an hh:mm:ss timestamp to milliseconds
        var time = t.split(":");

        if (time[2]) { //If we have an hh:mm:ss timestamp
            return ((+time[0] * 60 * 60) + (+time[1] * 60) + +time[2]) * 1000;
        } else if (time[1]) { //If we only have mm:ss
            return ((+time[0] * 60) + +time[1]) * 1000;
        } else { //If there's only ss
            return +time[0] * 1000;
        };
    },

    repeat(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        if (queue[guildId].repeatMode) { //Toggle repeat mode
            queue[guildId].repeatMode = false;

            return Promise.resolve("Repeat mode disabled!");
        } else {
            queue[guildId].repeatMode = true;

            return Promise.resolve("Repeat mode enabled!");
        };
    },

    pause(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        if (queue[guildId].paused) { //Check if the player is paused
            return Promise.reject("The music is already paused!");
        };

        queue[guildId].paused = true;

        queue[guildId].channel.dispatcher.pause();

        return Promise.resolve("Paused");
    },

    resume(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing!");
        };

        if (!queue[guildId].paused) { //Make sure the player is paused
            return Promise.reject("The music isn't paused!");
        };

        queue[guildId].paused = false;

        queue[guildId].channel.dispatcher.resume();

        return Promise.resolve("Resumed");
    },

    remove(guildId, n) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("I'm not playing anything!");
        };

        if (!queue[guildId].songs[n]) { //Make sure the requested song is in the queue
            return Promise.reject("That song isn't in the queue!");
        };

        const song = queue[guildId].songs[n]; //Get the info for the requested song

        if (song.filePath) {
            fs.unlink(song.filePath, function (err) { });
        };

        queue[guildId].songs.splice(n, 1); //Remove the song

        return Promise.resolve(`**${song.title}** was removed from the queue!`);
    },

    verifyTime(t) { //Verify a string is a valid hh:mm:ss timestamp
        if (!t.includes(":")) {
            if (parseInt(t) && parseInt(t) < 60 && parseInt(t) > 0) { //Check if our time is under a minute
                return true;
            } else {
                return false;
            };
        };

        const st = t.split(":"); //Split the time into segments

        for (const segment of st) { //Verify that each segment is a valid time
            if (!parseInt(segment) && segment !== "00" || parseInt(segment) > 59) {
                return false;
            };
        };

        return true;
    },

    shuffle(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        const a = queue[guildId].songs.slice(1); //Get every song except the one that's currently playing

        for (let i = a.length - 1; i > 0; i--) { //This is using the Durstenfeld shuffle algorithm
            const j = Math.floor(Math.random() * (i + 1));

            [a[i], a[j]] = [a[j], a[i]];
        };

        a.unshift(queue[guildId].songs[0]); //Add the currently playing song to the front of the array

        queue[guildId].songs = a; //Set the queue to our newly-shuffled array

        return Promise.resolve("Queue shuffled");
    },

    clearQueue(guildId) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("No songs are currently playing");
        };

        const queueArr = queue[guildId].songs.slice(1); //Get every item except what's currently playing

        if (queueArr.length) {
            for (const song of queueArr) {
                if (song.filePath) {
                    fs.unlink(song.filePath, function (err) { });
                };

                queue[guildId].songs.splice(queue[guildId].songs.indexOf(song), 1)
            };
        };

        queue[guildId].totalTimeMs = this.hmsToMs(queue[guildId].songs[0].duration); //Reset the total time

        return Promise.resolve("Queue cleared");
    },

    seek(guildId, n, voiceChannel, msgChannel) {
        if (!(guildId in queue)) { //Make sure the guild has a queue
            return Promise.reject("I'm not playing anything!");
        };

        if (!this.verifyTime(n)) {
            return Promise.reject("That's not a valid timestamp! Please use the hh:mm:ss format");
        };

        const time = this.hmsToMs(n); //Convert the time to a more usable format

        if (time > this.hmsToMs(queue[guildId].songs[0].duration)) { //Make sure the timestamp is valid
            return Promise.reject("I can't seek to that timestamp!");
        };

        var ff = "Rewinding"; //Set a variable so we can format our message nicely

        if (time > (queue[guildId].channel.dispatcher.streamTime + queue[guildId].seekTime)) { //Check if we're seeking further into the song
            ff = "Fast-forwarding";
        };

        playSong(queue[guildId].songs[0], voiceChannel, msgChannel, time); //Start the current song from the specified time

        return Promise.resolve(`${ff} to **${this.getTime(time)}**`);
    },

    getTime(s) { //Convert from milliseconds to hh:mm:ss
        var ms = s % 1000;

        s = (s - ms) / 1000;

        var secs = s % 60;

        s = (s - secs) / 60;

        var mins = s % 60;

        var hrs = (s - mins) / 60;

        if (hrs < 10) {
            hrs = `0${hrs}`;
        };

        if (secs < 10) {
            secs = `0${secs}`;
        };

        if (mins < 10) {
            mins = `0${mins}`;
        };

        if (hrs === `00`) {
            return mins + ':' + secs;
        };

        return hrs + ':' + mins + ':' + secs;
    },

    play(search, voiceChannel, msgChannel, user, addToTop, file) {
        if (!queue[voiceChannel.guild.id]) { //Initialize the server's queue
            queue[voiceChannel.guild.id] = {
                totalTimeMs: 0,
                seekTime: 0,
                volume: 50,
                repeatMode: false,
                paused: false,
                songs: []
            };
        };

        if (file) {
            urlManager.downloadFromFromUrl(file).then(res => {
                addToQueue(voiceChannel.guild.id, addToTop, res.duration, {
                    title: res.title,
                    url: res.url,
                    thumbnail: res.thumbnail,
                    duration: this.getTime(res.duration),
                    channel: "N/A",
                    views: "N/A",
                    requestedBy: user,
                    filePath: res.filePath
                }).then(queueEmb => {
                    if (queue[voiceChannel.guild.id].songs.length < 2) { //Check if we're already playing something
                        return playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                    } else {
                        if (addToTop === true) { //Skip the song if we need to
                            return this.skip(voiceChannel.guild.id);
                        } else {
                            queueEmb.setThumbnail("attachment://thumbnail.png");

                            return msgChannel.send({
                                embeds: [queueEmb],
                                files: [{
                                    attachment: res.thumbnail,
                                    name: 'thumbnail.png'
                                }]
                            });
                        };
                    };
                }).catch(err => {
                    return msgChannel.send(err);
                });
            });
        } else if (ytpl.validateID(search)) { //Check if the args are a valid playlist link
            ytpl(search, {
                limit: 500 //Limit to only the first 500 items in the playlist
            }).then(res => {
                var totalTime = 0;

                var overridePlay = false;

                if (!queue[voiceChannel.guild.id].songs.length) { //Make sure the player starts correctly when a playlist is the first thing added
                    overridePlay = true;
                };

                for (const i of res.items) { //Add each result to the queue
                    var time = 0;

                    if (i.duration) {
                        totalTime = totalTime + this.hmsToMs(i.duration);

                        time = this.hmsToMs(i.duration);
                    };

                    addToQueue(voiceChannel.guild.id, addToTop, time, {
                        title: i.title,
                        url: i.shortUrl,
                        thumbnail: i.bestThumbnail.url,
                        duration: i.duration,
                        channel: i.author.name,
                        views: res.views,
                        requestedBy: user
                    });
                };

                const playlistEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setAuthor("Added to Queue")
                    .setTitle(res.title)
                    .setURL(res.url)
                    .setThumbnail(res.items[0].thumbnail)
                    .setDescription(`Successfully added ${res.items.length} items to the queue!`)
                    .addField("Length", this.getTime(totalTime), true)
                    .addField("Author", res.author.name, true)
                    .addField("Views", res.views)
                    .addField("Last Updated", res.lastUpdated, true);

                if (addToTop === true) { //Skip the song if we need to
                    return this.skip(voiceChannel.guild.id);
                } else {
                    msgChannel.send({
                        embeds: [playlistEmb]
                    });
                };

                if (queue[voiceChannel.guild.id].songs.length < 2 || overridePlay === true) { //Check if we're already playing something
                    overridePlay = false;

                    return playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                };
            }).catch(err => { //Assume the playlist is private if there's an error
                return msgChannel.send("That playlist is private!");
            });
        } else if (ytdl.validateURL(search)) { //Check if the search term is a valid youtube url
            ytdlCore.getBasicInfo(search).then(i => {
                addToQueue(voiceChannel.guild.id, addToTop, (i.videoDetails.lengthSeconds * 1000), {
                    title: i.videoDetails.title,
                    url: i.videoDetails.video_url,
                    thumbnail: i.videoDetails.thumbnails.reverse()[0].url,
                    duration: this.getTime(i.videoDetails.lengthSeconds * 1000),
                    channel: i.videoDetails.author.name,
                    views: i.videoDetails.viewCount,
                    requestedBy: user
                }).then(queueEmb => {
                    if (queue[voiceChannel.guild.id].songs.length < 2) { //Check if we're already playing something
                        return playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                    } else {
                        if (addToTop === true) { //Skip the song if we need to
                            return this.skip(voiceChannel.guild.id);
                        } else {
                            return msgChannel.send({
                                embeds: [queueEmb]
                            });
                        };
                    };
                }).catch(err => {
                    return msgChannel.send(err);
                });
            });
        } else {
            ytsr(search, { //Search for youtube videos with the given arguments
                limit: 1
            }).then(searchResults => {
                if (!searchResults.items.length) { //Check if there were no results at all
                    return msgChannel.send("No results found");
                };

                parseResults(searchResults.items).then(result => {
                    addToQueue(voiceChannel.guild.id, addToTop, this.hmsToMs(result.duration), {
                        title: result.title,
                        url: result.url,
                        thumbnail: result.thumbnail,
                        duration: result.duration,
                        channel: result.channel,
                        views: result.views,
                        requestedBy: user
                    }).then(queueEmb => {
                        if (queue[voiceChannel.guild.id].songs.length < 2) { //Check if we're already playing something
                            return playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel); //Play the first song in the queue
                        } else {
                            if (addToTop === true) { //Skip the song if we need to
                                return this.skip(voiceChannel.guild.id);
                            } else {
                                return msgChannel.send({
                                    embeds: [queueEmb]
                                });
                            };
                        };
                    }).catch(err => {
                        console.log(err)
                        return msgChannel.send("An error occured while searching");
                    });
                }).catch(e => {
                    console.log(e)
                    return msgChannel.send("An error occured while searching");
                });
            });
        };
    },
};

function deleteQueue(id) {
    if (queue[id] && queue[id].songs) { //Remove all local files
        for (const song of queue[id].songs) {
            if (song.filePath) {
                fs.unlink(song.filePath, function (err) { });
            };
        };
    };

    delete queue[id];

    return;
};

function parseResults(videos) {
    if (!videos || !videos.length) {
        return Promise.reject("No results found");
    };

    const results = [];

    for (let n = 0; n < videos.length; n++) {
        if (videos[n].type && videos[n].type === "video") {
            results.push({
                title: videos[n].title,
                url: videos[n].link || videos[n].url,
                thumbnail: videos[n].thumbnail || videos[n].bestThumbnail.url,
                duration: videos[n].duration,
                channel: videos[n].author.name,
                views: videos[n].views
            });
        };
    };

    return Promise.resolve(results[0]);
};

function addToQueue(id, addToTop, queueTime, info) {
    if (!info || !id || !queueTime) {
        return Promise.reject("A required argument in the addToQueue function was missing");
    };

    const queueObj = {
        title: info.title,
        url: info.url,
        thumbnail: info.thumbnail,
        duration: info.duration,
        channel: info.channel,
        requestedBy: info.requestedBy
    };

    if (info.filePath) {
        queueObj.filePath = info.filePath;
    };

    if (addToTop === true) { //Check if we want to add the song to the beginning or end of the array
        queue[id].songs.splice(1, 0, queueObj);
    } else {
        queue[id].songs.push(queueObj);
    };

    queue[id].totalTimeMs = queue[id].totalTimeMs + queueTime; //Update the queue's total time

    var queueEmb = new Discord.MessageEmbed() //Generate a new message embed with the song info
        .setColor(config.embedColor)
        .setAuthor("Added to Queue")
        .setTitle(info.title)
        .setURL(info.url)
        .setThumbnail(info.thumbnail)
        .addField("Duration", info.duration, true)
        .addField("Channel", info.channel, true)
        .addField("Views", toString(info.views), true);

    return Promise.resolve(queueEmb);
};

async function playSong(song, voiceChannel, msgChannel, seek) {
    const connection = dVoice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    queue[voiceChannel.guild.id].seekTime = 0; //Reset the seeking time

    if (!seek) { //If we don't have a time to seek to, start at the beginning
        seek = 0;
    };

    if (song.filePath) {
        const songStream = fs.createReadStream(song.filePath);

        var stream = dVoice.createAudioResource(ytdl.arbitraryStream(songStream, {
            filter: 'audioonly',
            fmt: "mp3",
            opusEncoded: true,
            highWaterMark: 1 << 25,
            seek: seek / 1000
        }), {
            inlineVolume: true
        });
    } else {
        var pipe = ytdl(song.url, {
            filter: 'audioonly',
            opusEncoded: true,
            highWaterMark: 1 << 25,
            seek: seek / 1000
        }).pipe(fs.createWriteStream(path.resolve("./assets/downloads/mp3")));

        var stream = dVoice.createAudioResource(pipe, {
            inlineVolume: true
        });
    };

    stream.volume.setVolume(queue[voiceChannel.guild.id].volume * 2 / 100);

    const dispatcher = dVoice.createAudioPlayer({
        behaviors: {
            noSubscriber: dVoice.NoSubscriberBehavior.Pause,
        },
    }).play(stream);

    connection.subscribe(dispatcher);

    queue[voiceChannel.guild.id].seekTime = seek; //Set the additional seek time

    const playingEmb = new Discord.MessageEmbed()
        .setColor(config.embedColor)
        .setAuthor("Now Playing")
        .setThumbnail("attachment://thumbnail.png")
        .setTitle(song.title)
        .setURL(song.url)
        .addField("Duration", song.duration, true)
        .addField("Channel", song.channel, true)
        .addField("Requested By", `${song.requestedBy.username}#${song.requestedBy.discriminator}`, true);

    if (seek === 0) {
        msgChannel.send({
            embeds: [playingEmb],
            files: [{
                attachment: song.thumbnail,
                name: 'thumbnail.png'
            }]
        });
    };

    dispatcher.on('finish', () => {
        if (!queue[voiceChannel.guild.id]) { //Check if there's a queue for the guild at all
            msgChannel.send("I finished playing the current queue!");

            return voiceChannel.leave();
        };

        if (queue[voiceChannel.guild.id] && queue[voiceChannel.guild.id].channel !== null && queue[voiceChannel.guild.id].channel.channel.members.size < 2) {
            msgChannel.send("I can't play music by myself, so I left the voice channel");

            deleteQueue(voiceChannel.guild.id);

            return voiceChannel.leave();
        };

        if (queue[voiceChannel.guild.id].songs.length && !queue[voiceChannel.guild.id].repeatMode) { //Make sure there's still songs in the queue and repeatmode is off
            queue[voiceChannel.guild.id].totalTimeMs = queue[voiceChannel.guild.id].totalTimeMs - module.exports.hmsToMs(song.duration); //Reduce the total queue time
        };

        if (!queue[voiceChannel.guild.id].repeatMode) { //Check if repeatMode is on for the server
            if (queue[voiceChannel.guild.id].songs[0].filePath) {
                fs.unlink(queue[voiceChannel.guild.id].songs[0].filePath, function (err) { });
            };

            queue[voiceChannel.guild.id].songs.shift(); //Remove the first item from the queue
        };

        if (queue[voiceChannel.guild.id].songs.length) { //If there's songs left in the queue, play the first one. Otherwise just stop the player
            playSong(queue[voiceChannel.guild.id].songs[0], voiceChannel, msgChannel);
        } else {
            msgChannel.send("I finished playing the current queue!");

            deleteQueue(voiceChannel.guild.id);

            return voiceChannel.leave();
        };
    });
};

//This *should* be stable now
client.on("voiceStateUpdate", (oldState, newState) => {
    if (queue[oldState.guild.id]) {
        setTimeout(() => { //Delay by a bit to account for network drops, temporary disconnects, etc
            if (queue[oldState.guild.id] && queue[oldState.guild.id].channel !== null && queue[oldState.guild.id].channel.channel.members.size < 2) { //Check if there are other users in the voice channel
                try {
                    queue[oldState.guild.id].channel.dispatcher.end();
                } catch (err) {
                    return;
                };
            };
        }, 60000);
    };
});