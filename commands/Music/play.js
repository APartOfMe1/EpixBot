const checkDiskSpace = require('check-disk-space');
const path = require("path");
const Player = require('../../handlers/Music/music.js');
client.player = Player;

module.exports = {
    name: 'play',
    description: 'Play music',
    category: 'Music',
    cooldown: 2500,
    usage: '`{prefix}play <song>` or `{prefix}play <youtube link>`',
    examples: '`{prefix}play africa` or `{prefix}play https://www.youtube.com/watch?v=dQw4w9WgXcQ`',
    async execute(msg, args) {
        // Make sure the user is in a VC
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

        if (!perms.has('VIEW_CHANNEL')) {
            return msg.channel.send('I can\'t view this channel! Do I have the correct permissions?');
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

                return client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author, false, attach.url);
            });
        } else {
            // Make sure the bot is actually given a song to search for
            if (!args[0]) {
                client.player.resume(msg.guild.id).then(result => {
                    return msg.channel.send(result);
                }).catch(e => {
                    return msg.channel.send("You need to give me a song to play!");
                });

                return;
            }

            return client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author);
        }
    },
};