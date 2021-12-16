module.exports = {
    name: 'skip',
    description: 'Skip to the next track in the queue',
    category: 'Music',
    async execute(msg, args) {
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        client.player.skip(msg.guild.id).then((song) => {
            msg.channel.send(`**${song.title}** has been skipped!`);
        }).catch((err) => {
            // Send an error if there's nothing to be skipped
            msg.channel.send("There's nothing in the queue!");
        });
    },
};