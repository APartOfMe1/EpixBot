const checkDiskSpace = require('check-disk-space');
const path = require("path");

module.exports = {
    name: 'playskip',
    description: 'Skip ahead of all other tracks in the queue and immediately play music',
    category: 'Music',
    usage: '`{prefix}playskip <song>` or `{prefix}playskip <youtube link>`',
    examples: '`{prefix}playskip africa` or `{prefix}playskip https://www.youtube.com/watch?v=dQw4w9WgXcQ`',
    async execute(msg, args) {
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        // Get the bots' permissions for the current voice channel
        const perms = msg.member.voice.channel.permissionsFor(msg.client.user);

        if (!perms.has('CONNECT')) {
            return msg.channel.send('I can\'t connect to this voice channel. Do I have the correct permissions?');
        }

        if (!perms.has('SPEAK')) {
            return msg.channel.send('I can\'t speak in this channel! Do I have the correct permissions?');
        }

        // Make sure there are attachments at all
        if (msg.attachments.size > 0) {
            // Get message attachments
            const attach = msg.attachments.first();

            // Make sure the upload is valid
            if (!attach || !attach.url.endsWith(".mp3")) {
                return msg.channel.send("You need to make sure that your first upload is an mp3 file!");
            }

            // Determine the platform and drive letter if on Windows
            var base = (process.platform === "win32") ? path.parse(__dirname).root : "/";

            checkDiskSpace(base).then((diskSpace) => {
                // Make sure we always have at least 25gb of space free
                if (diskSpace.free < 26843531856) {
                    return msg.channel.send("Too many people are playing from a file right now! Try again later");
                }

                client.player.playSkip(msg.guild.id, args.join(" "), msg.member.voice.channel, msg.channel, msg.author, attach.url).then(response => {
                    return; /*msg.channel.send(response);*/
                }).catch(err => {
                    return msg.channel.send(err);
                });
            });
        } else {
            // Make sure the bot is actually given a song to search for
            if (!args[0]) {
                return msg.channel.send("You need to give me a song to play!");
            }

            client.player.playSkip(msg.guild.id, args.join(" "), msg.member.voice.channel, msg.channel, msg.author).then(response => {
                return; /*msg.channel.send(response);*/
            }).catch(err => {
                return msg.channel.send(err);
            });
        }
    },
};