module.exports = {
    name: 'volume',
    description: 'Set the music volume from 1 to 100. The default is 50',
    usage: "`{prefix}volume <number>`",
    examples: "`{prefix}volume 75`",
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) { //Make sure the user is in a VC
            return msg.channel.send('You need to be in a voice channel!');
        };

        if (!parseInt(args[0]) || parseInt(args[0]) > 100 || parseInt(args[0]) < 1) {
            return msg.channel.send("You need to give a number from 1 to 100 to set the volume to");
        };

        client.player.setVolume(msg.guild.id, parseInt(args[0])).then(result => {
            return msg.channel.send(result);
        }).catch(e => {
            return msg.channel.send(e);
        });
    },
};