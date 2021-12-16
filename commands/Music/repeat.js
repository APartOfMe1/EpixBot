module.exports = {
    name: 'repeat',
    description: 'Repeat the current song',
    aliases: ["loop"],
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        client.player.repeat(msg.guild.id).then(response => {
            return msg.channel.send(response);
        }).catch(err => {
            return msg.channel.send("I'm not playing anything!");
        });
    },
};