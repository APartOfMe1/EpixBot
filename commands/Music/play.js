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
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        const perms = msg.member.voice.channel.permissionsFor(msg.client.user); //Get the bots' permissions for the current voice channel

        if (!perms.has('CONNECT')) { //Make sure the bot can connect
            return msg.channel.send('I can\'t connect to this voice channel. Do I have the correct permissions?');
        };

        if (!perms.has('SPEAK')) { //Make sure the bot can transmit audio
            return msg.channel.send('I can\'t speak in this channel! Do I have the correct permissions?');
        };

        if (!perms.has('VIEW_CHANNEL')) { //Make sure the bot can view the channel
            return msg.channel.send('I can\'t view this channel! Do I have the correct permissions?');
        };

        if (msg.attachments.size > 0) { //Make sure there are attachments at all
            const attach = msg.attachments.first(); //Get message attachments

            if (!attach || !attach.url.endsWith(".mp3")) { //Make sure the upload is valid
                return msg.channel.send("You need to make sure that your first upload is an mp3 file!");
            };

            var base = (process.platform === "win32") ? path.parse(__dirname).root : "/"; //Determine the platform and drive letter if on Windows

            checkDiskSpace(base).then((diskSpace) => {
                if (diskSpace.free < 26843531856) { //Make sure we always have at least 25gb of space free
                    return msg.channel.send("Too many people are playing from a file right now! Try again later");
                };

                return client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author, false, attach.url);
            });
        } else {
            if (!args[0]) { //Make sure the bot is actually given a song to search for
                client.player.resume(msg.guild.id).then(result => {
                    return msg.channel.send(result);
                }).catch(e => {
                    return msg.channel.send("You need to give me a song to play!");
                });

                return;
            };

            return client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author);
        };

        function genName(length) {
            const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"; //Define the character set

            var final = "";

            for (let i = 0; i < length; i++) { //Create a string with the specified length
                final += characters[Math.floor(Math.random() * characters.length)];
            };

            return final;
        };
    },
};