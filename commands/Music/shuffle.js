module.exports = {
    name: 'shuffle',
    description: 'Shuffle the guild\'s queue',
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        client.player.shuffle(msg.guild.id).then(response => {
            return msg.channel.send(response);
        }).catch(err => {
            return msg.channel.send("I'm not playing anything!");
        });
    },
};