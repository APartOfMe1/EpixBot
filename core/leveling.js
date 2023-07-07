const Discord = require("discord.js");
const cooldown = new Set();
const lvlClass = client.db.GuildPoints;

module.exports = async function(msg) {
    let key = `${msg.guild.id}-${msg.author.id}`;

    // Only allow user to earn points every once in a while
    if (!cooldown.has(key)) {
        cooldown.add(key);

        // Put user on cooldown for 2 minutes
        setTimeout(() => {
            cooldown.delete(key);
        }, 120000);

        // Get a random amount of points from 5 to 25
        let pointsToAdd = Math.floor(Math.random() * (25 - 5 + 1)) + 5;

        // Get user's data
        let model = await lvlClass.getPointsByUserGuildId(msg.author.id, msg.guild.id);

        // Get the user's current level
        let curLevel = Math.floor(0.1 * Math.sqrt(model.points));

        if (curLevel > model.level) {
            // Double check that we can send messages
            if (msg.guild.members.me.permissions.has(Discord.PermissionsBitField.Flags.SendMessages)) {
                msg.reply(`Noice. You've leveled up to **${curLevel}**!`);
            };
        }

        // Update data
        model.points += pointsToAdd;
        model.level = curLevel;
        model.save();
    }
}
