module.exports = {
    name: 'leave',
    description: 'Stop all currently playing music',
    aliases: ["stop"],
    category: 'Music',
    async execute(msg, args) {
        // Make sure the user is in a VC
        if (!msg.member.voice.channel) {
            return msg.channel.send('You need to be in a voice channel!');
        }

        client.player.leave(msg.guild.id).then(() => {
            return;
        }).catch((err) => {
            return msg.channel.send("There's nothing to stop!");
        });
    },
};