module.exports = {
    name: 'pause',
    description: 'Pause the music',
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        client.player.pause(msg.guild.id).then(result => {
            return msg.channel.send(result);
        }).catch(e => {
            return msg.channel.send(e);
        });
    },
};