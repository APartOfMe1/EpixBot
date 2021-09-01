module.exports = {
    name: 'wipelb',
    description: 'Completely reset everyone\'s points and the leaderboard itself. This can help if the leaderboard stops working correctly',
    category: 'Moderation',
    async execute(msg, args) {
        if (!msg.member.permissions.has(Discord.Permissions.ADMINISTRATOR)) { //Make sure the author has permissions to run the command
            return msg.reply("You need administrator privledges to use this command!");
        };

        const toRemove = client.db.points.filter(p => p.guild === msg.guild.id); //Get the users in the guild

        toRemove.forEach(data => { //Clear each member's points
            client.db.points.delete(`${msg.guild.id}-${data.user}`);
        });

        return msg.channel.send(`${toRemove.size} users have been removed from the leaderboard and had their points reset`); //Send a success message
    },
};