const cooldown = new Set();

module.exports = {
    handleLvl(msg) {
        const key = `${msg.guild.id}-${msg.author.id}`;

        client.db.points.ensure(key, { //Set the default settings for points
            user: msg.author.id,
            guild: msg.guild.id,
            points: 0,
            level: 1
        });

        if (!cooldown.has(key)) { //If the member is in the cooldown list, don't do anything. Otherwise add them to the cooldown
            cooldown.add(key);

            setTimeout(() => { //Add a user to the cooldown for 2 minutes
                cooldown.delete(key);
            }, 120000);

            var pointsToAdd = Math.floor(Math.random() * (25 - 5 + 1)) + 5; //Get a random amount of points from 5 to 25

            client.db.points.set(key, client.db.points.get(key, "points") + pointsToAdd, "points"); //Add the points to the user's score
        };

        const curLevel = Math.floor(0.1 * Math.sqrt(client.db.points.get(key, "points"))); //Get the users current level

        if (client.db.points.get(key, "level") < curLevel) { //Figure out if the user leveled up
            if (msg.guild.me.permissions.has(Discord.Permissions.SEND_MESSAGES)) { //Double check that we can send messages
                msg.reply(`Noice. you've leveled up to **${curLevel}**!`);
            };

            client.db.points.set(key, curLevel, "level");
        };

        if (client.db.points.get(key, "level") > curLevel) { //Make sure there are no issues with levels being too low
            client.db.points.set(key, curLevel, "level");
        };
    }
};