const timeFormat = require('../../utilities/timeFormat.js');

module.exports = class Song {
    url;
    title;
    views;
    thumbnailUrl;
    durationMs;
    channel;
    uploadedAt;
    requestedBy;

    constructor(song, requestor, type) {
        if (type == 'search') {
            this.url = song.url;
            this.title = song.title ?? '';
            this.views = (song.views ?? 0).toString();
            this.thumbnailUrl = song.bestThumbnail.url ?? '';
            this.durationMs = timeFormat.hmsToMs(song.duration) ?? 0;
            this.channel = song.author.name ?? '';
            this.uploadedAt = song.uploadedAt ?? '';
            this.requestedBy = requestor ?? '';
        } else if (type == 'url') {
            this.url = song.videoDetails.video_url;
            this.title = song.videoDetails.title ?? '';
            this.views = song.videoDetails.viewCount ?? '0';
            this.thumbnailUrl = song.videoDetails.thumbnails[0].url ?? '';
            this.durationMs = parseInt(song.videoDetails.lengthSeconds ?? '0') * 1000;
            this.channel = song.videoDetails.author.name ?? '';
            this.uploadedAt = song.videoDetails.uploadDate ?? '';
            this.requestedBy = requestor ?? '';
        } else if (type == 'playlist') {
            this.url = song.shortUrl;
            this.title = song.title ?? '';
            this.views = ''; // Doesn't provide view counts
            this.thumbnailUrl = song.bestThumbnail.url ?? '';
            this.durationMs = timeFormat.hmsToMs(song.duration) ?? 0;
            this.channel = song.author.name ?? '';
            this.uploadedAt = ''; // Doesn't provide upload
            this.requestedBy = requestor ?? '';
        }
    }
}