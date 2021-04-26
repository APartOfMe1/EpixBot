module.exports = {
    name: 'seek',
    description: 'Go to a specific point in the currently playing song',
    usage: "`{prefix}seek <time>`",
    examples: "`{prefix}seek 4:20`",
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        if (!args[0]) {
            return msg.channel.send("You need to give a time to go to!");
        };

        client.player.seek(msg.guild.id, args[0], msg.member.voice.channel, msg.channel).then(response => {
            return msg.channel.send(response);
        }).catch(err => {
            return msg.channel.send(err);
        });
    },
};