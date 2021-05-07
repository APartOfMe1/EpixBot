const Discord = require('discord.js');
const system = require('system-commands');
const download = require('download');
const fs = require("fs");
const checkDiskSpace = require('check-disk-space');
const emojis = require("../../assets/emojis/emojis.json");
const config = require('../../config/config.json');
const path = require("path");
const midiPath = path.resolve("./assets/downloads/midi");
const mp3Path = path.resolve("./assets/downloads/midi/conversions");
const ytdl = require('discord-ytdl-core');

module.exports = {
    name: 'bup',
    description: 'Bupify a midi file and convert it to mp3!',
    category: 'Fun',
    cooldown: 10000,
    async execute(msg, args) {
        if (args[0] && args[0].toLowerCase() === "info") {
            const infoEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("Bup Info")
                .setDescription("Below are some frequently asked questions about ***B U P***")
                .addField("Why do my files sound weird?", "The original bup soundfont I used had some flaws. Namely, about 50% of the files I threw at it came out with no sound at all. I did the best I could to fix it, but I have absolutely no soundfont experience, so I definitely could have broken something.", true)
                .addField("I know how to properly create soundfonts! How can I help?", "Great! If you want to help improve the soundfont, feel free to download it and make some improvements. I'm... sure I definitely didn't create it in the best way to say the least, so any improvements would be very welcome! If you've made changes, feel free to reach out to me on the [support server](https://discord.gg/cFv5urj) to see about getting it on the bot.", true)
                .addField("I really just wanted the download...", `Use \`${config.prefix}bup downloads\` for both the original file and my edited one!`);

            return msg.channel.send({
                embed: infoEmb
            });
        } else if (args[0] && args[0].toLowerCase() === "downloads") {
            return msg.channel.send("Bup!", {
                files: [{
                        attachment: "./assets/soundfonts/bup/Bup-Original.sf2",
                        name: "Bup-Original.sf2"
                    },
                    {
                        attachment: "./assets/soundfonts/bup/Bup3.sf2",
                        name: "Bup-Edited.sf2"
                    }
                ]
            });
        };

        const attach = msg.attachments.first(); //Get message attachments

        if (!attach || !attach.url.endsWith(".mid")) { //Make sure the upload is valid
            return msg.channel.send("You need to make sure that your first upload is a midi file!");
        };

        const name = attach.name.split(".mid").join("").trim();

        var base = (process.platform === "win32") ? path.parse(midiPath).root : "/"; //Determine the platform and drive letter if on Windows

        checkDiskSpace(base).then((diskSpace) => {
            if (diskSpace.free < 26843531856) { //Make sure we always have at least 25gb of space free
             return msg.channel.send("There are too many people converting files right now! Try again later");
            };

            msg.channel.send(`${emojis.loading} Processing... This could take a few minutes`).then((loadingMsg) => { //Send a loading message
                var filename = genName(16); //Generate a random filename to avoid duplicate names

                download(attach.url, midiPath, {
                    filename: `${filename}.mid`
                }).then(() => {
                    system(`timidity ${midiPath}/${filename}.mid -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k ${mp3Path}/${filename}.mp3`).then(() => {
                        loadingMsg.delete();

                        msg.channel.send(`Bup! For more info/help/the soundfont download, use \`${config.prefix}bup info\`. To play this song in a voice channel, use \`${config.prefix}playbup\` within 30 seconds`, {
                            files: [{
                                attachment: `${mp3Path}/${filename}.mp3`,
                                name: `${name}.mp3`
                            }]
                        }).then(() => {
                            const filter = m => m.author.id === msg.author.id && m.content.toLowerCase() === `${config.prefix}playbup`;

                            msg.channel.awaitMessages(filter, {
                                    max: 1,
                                    time: 30000,
                                    errors: ['time']
                                })
                                .then(collected => {
                                    msg.member.voice.channel.join().then(async connection => {
                                        const songStream = fs.createReadStream(`${mp3Path}/${filename}.mp3`);

                                        const stream = ytdl.arbitraryStream(songStream, {
                                            filter: 'audioonly',
                                            opusEncoded: true,
                                            highWaterMark: 1 << 25,
                                        });

                                        const dispatcher = connection.play(stream, {
                                            type: 'opus',
                                            bitrate: 'auto',
                                            fec: true,
                                        });

                                        dispatcher.on("end", () => {
                                            try {
                                                fs.unlink(`${midiPath}/${filename}.mid`, function (err) {});
        
                                                fs.unlink(`${mp3Path}/${filename}.mp3`, function (err) {});
                                            } catch (error) {
                                                return;
                                            };

                                            return msg.channel.send("I finished playing your song!");
                                        });

                                        return msg.channel.send("Playing!");
                                    });
                                }).catch(err => {
                                    try {
                                        fs.unlink(`${midiPath}/${filename}.mid`, function (err) {});

                                        fs.unlink(`${mp3Path}/${filename}.mp3`, function (err) {});
                                    } catch (error) {
                                        return;
                                    };

                                    return;
                                });
                        });
                    }).catch(err => {
                        return loadingMsg.edit("There was an error converting your file. Please try again later");
                    });
                });
            });
        });

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