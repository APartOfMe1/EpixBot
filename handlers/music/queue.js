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

    getQueueLength() {
        return this.songs.length;
    }

    // Add song to queue and update queue duration
    addToQueue(song) {
        this.songs.push(song);

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
}