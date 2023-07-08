module.exports = class Queue {
    voiceChannelId;
    msgChannelId;
    guildId;
    guild;
    player;
    totalTimeMs = 0;
    seekTime = 0;
    volume = 50;
    repeatMode = false;
    paused = false;
    songs = [];

    constructor(interaction) {
        this.voiceChannelId = interaction.member.voice.channel.id;
        this.msgChannelId = interaction.channel.id;
        this.guildId = interaction.member.guild.id;
        this.guild = interaction.member.guild;
    }

    getAllSongs() {
        return this.songs;
    }

    getQueueLength() {
        return this.songs.length;
    }

    getQueueTime() {
        return this.totalTimeMs;
    }

    // Check if there is a song currently playing
    currentlyPlaying() {
        if (this.player) {
            return this.player.state.status == 'playing';
        }

        return false;
    }

    // Remove a specific song from the queue
    removeSong(index) {
        // Out of bounds check
        if (index < 0 || index > this.songs.length - 1) {
            return;
        }

        // Store the removed song
        const song = this.songs[index];

        // TODO: filepath unlinking

        // Get it out of there
        this.songs.splice(index, 1);

        return song;
    }

    // Skip to the next song
    skip() {
        if (this.player) {
            let curSong = this.songs[0];

            this.player.stop();

            return curSong;
        }
    }

    // Pause/unpause music
    togglePause() {
        if (this.player) {
            if (this.paused) {
                this.player.unpause();

                this.paused = false;
            } else {
                this.player.pause();

                this.paused = true;
            }
        }

        return this.paused;
    }

    // Toggle the queue's repeatMode
    setRepeatMode(state = null) {
        if (state !== null) {
            // We want to specifically set it to a certain state
            this.repeatMode = state;
        } else {
            // Just toggle it
            this.repeatMode = !this.repeatMode;
        }

        return this.repeatMode;
    }

    // Shuffle songs in queue
    shuffle() {
        // Get every song except the one that's currently playing
        const a = this.songs.slice(1);

        // Using the Durstenfeld shuffle algorithm
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [a[i], a[j]] = [a[j], a[i]];
        };

        // Add the currently playing song to the front of the array
        a.unshift(this.songs[0]);

        // Set the queue to our newly-shuffled array
        this.songs = a;
    }

    // Remove all items in the queue
    clearQueue() {
        // Grab everything except what's currently playing
        const queueArr = this.songs.slice(1);

        if (queueArr.length) {
            // TODO: fs.unlink for downloaded songs once implemented
            // Don't get rid of this loop. We will need it for the downloaded songs

            for (const song of queueArr) {
                this.songs.splice(this.songs.indexOf(song), 1);
            };
        };

        // Reset the total time
        this.totalTimeMs = this.songs[0].durationMs;
    }

    // Add song to queue and update queue duration
    addToQueue(song, addToTop) {
        if (addToTop) {
            this.songs.splice(1, 0, song);
        } else {
            this.songs.push(song);
        }

        this.totalTimeMs += song.durationMs;
    }

    // Update queue duration and remove first song in queue
    removeFirstSong() {
        // Do this to avoid errors down the road
        if (this.songs[0]) {
            this.totalTimeMs -= this.songs[0].durationMs;
        }

        return this.songs.shift();
    }

    getFirstSong() {
        return this.songs[0];
    }

    setPlayer(player) {
        this.player = player;
    }

    setVolume(vol) {
        if (vol >= 0 && vol <= 100) {
            this.volume = vol;
        }
    }
}