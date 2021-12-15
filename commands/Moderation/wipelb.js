module.exports = {
    name: 'wipelb',
    description: 'Completely reset everyone\'s points and the leaderboard itself. This can help if the leaderboard stops working correctly',
    category: 'Moderation',
    async execute(msg, args) {
        if (!msg.member.permissions.has(Discord.Permissions.ADMINISTRATOR)) {
            return msg.reply("You need administrator privledges to use this command!");
        }

        // Get the users in the guild
        const toRemove = client.db.points.filter(p => p.guild === msg.guild.id);

        toRemove.forEach(data => { //Clear each member's points
            client.db.points.delete(`${msg.guild.id}-${data.user}`);
        });

        return msg.channel.send(`${toRemove.size} users have been removed from the leaderboard and had their points reset`);
    },
};