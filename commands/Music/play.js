const Player = require('../../handlers/Music/music.js');
client.player = Player;
const emojis = require("../../assets/emojis/emojis.json");
const download = require('download');
const fs = require("fs");
const checkDiskSpace = require('check-disk-space');
const downloadPath = "C:/Users/jorda/Desktop/Bots/EpixBot/assets/downloads/mp3";
const ytdl = require('discord-ytdl-core');

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

            checkDiskSpace('C:/').then((diskSpace) => {
                //if (diskSpace.free < 26843531856) { //Make sure we always have at least 25gb of space free
                //  return msg.channel.send("There are too many people playing files right now! Try again later");
                //};

                msg.channel.send(`${emojis.loading} Processing... This could take a few minutes`).then((loadingMsg) => { //Send a loading message
                    var filename = genName(16); //Generate a random filename to avoid duplicate names

                    download(attach.url, downloadPath, {
                        filename: `${filename}.mp3`
                    }).then(() => {
                        msg.member.voice.channel.join().then(async connection => {   
                            const songStream = fs.createReadStream(downloadPath + "/" + filename + ".mp3");

                            const stream = ytdl.arbitraryStream(songStream, {
                                filter: 'audioonly',
                                opusEncoded: true,
                                highWaterMark: 1 << 25,
                            });
                    
                            connection.play(stream, {
                                type: 'opus',
                                bitrate: 'auto',
                                fec: true,
                            });
                    
                            return loadingMsg.edit("Playing!");
                        });
                    });
                });
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