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

        if (!args[0]) { //Make sure the bot is actually given a song to search for
            client.player.resume(msg.guild.id).then(result => {
                return msg.channel.send(result);
            }).catch(e => {
                return msg.channel.send("You need to give me a song to play!");
            });

            return;
        };

        return client.player.play(args.join(" "), msg.member.voice.channel, msg.channel, msg.author);
    },
};