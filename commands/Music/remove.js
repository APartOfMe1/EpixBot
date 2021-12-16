module.exports = {
    name: 'remove',
    description: 'Remove a song from the guild\'s queue',
    usage: "`{prefix}remove <number>`",
    examples: "`{prefix}remove 3`",
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        if (!parseInt(args[0])) {
            return msg.channel.send("You need to give the number of the song in the queue that you'd like to remove!");
        }

        client.player.remove(msg.guild.id, parseInt(args[0])).then(response => {
            return msg.channel.send(response);
        }).catch(err => {
            return msg.channel.send(err);
        });
    },
};