const Discord = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
    incCounters(n) {
        // Run through every user in the reminder database. This will likely be very slow with many users
        const remindArr = client.db.reminders.array();

        for (const user of remindArr) {
            for (const reminder of user.reminders) {
                if (!reminder || !reminder.id) {
                    continue;
                };

                const index = user.reminders.map(i => { // Get the array index of the current reminder
                    if (i && i.id) {
                        return i.id;
                    };
                }).indexOf(reminder.id);

                const count = reminder.count + parseInt(n);

                client.db.reminders.set(user.userId, count, `reminders[${index}].count`); // Update the total count

                if (count >= reminder.timeInMs && !reminder.hasReminded) { // First reminder
                    reminder.count = 0; // Reset the count

                    reminder.hasReminded = true; // We're no longer on the first reminder, so set it as such

                    client.db.reminders.set(user.userId, reminder, `reminders[${index}]`);

                    remindUser({
                        type: 0,
                        reminder: reminder
                    });
                } else if (reminder.hasReminded && count >= reminder.recurringInMs) { // Every recurring reminder
                    reminder.count = 0; // Reset the count

                    client.db.reminders.set(user.userId, reminder, `reminders[${index}]`);

                    remindUser({
                        type: 1,
                        reminder: reminder
                    });
                };
            };
        };
    },
};

async function remindUser(info) {
    const nagMsgArr = [ // Replace <task> with the reminder
        "You're late! You know what happens now... `<task>`",
        "How about you take just a few minutes for `<task>` today?",
        "Hey, I know you've got time for `<task>`, it's not like you do anything else anyways.",
        "Whoa, were you thinking about ignoring `<task>`? I would hope not for your own sake.",
        "Make sure not to miss `<task>`, you've seen what happens to those who do 😀🤫."
    ];

    if (info.type === 1) { // If it's a recurring reminder
        const reminderEmb = new Discord.MessageEmbed()
            .setColor(config.embedColor)
            .setTitle("Reminder")
            .setFooter("React with 🛑 within one hour to stop receiving this reminder");

        var nagMsg = nagMsgArr[Math.floor(Math.random() * nagMsgArr.length)].replace("<task>", info.reminder.msg); // Get a random message and replace the necessary portions

        if (nagMsg.length > 2000) { // Make sure we don't go over the character limit
            reminderEmb.setDescription(nagMsg.substr(0, 1950) + "...");
        } else {
            reminderEmb.setDescription(nagMsg);
        };

        // It's very possible for the user to not be in the bots cache. Make sure we don't error out if so
        var remindMsg;

        try {
            remindMsg = await client.users.cache.get(info.reminder.user).send({
                embeds: [reminderEmb]
            });
        } catch (error) {
            // This *should* keep trying to dm the user until it actually succeeds
            return;
        };

        remindMsg.react("🛑");

        const filter = (reaction, user) => reaction.emoji.name === "🛑" && user.id === info.reminder.user;

        remindMsg.awaitReactions({
            filter,
            max: 1,
            time: 3600000,
            errors: ['time']
        }).then(collected => {
            const index = client.db.reminders.map(user => { // Get the array index of the current reminder
                for (const r of user.reminders) {
                    return r.id
                };
            }).indexOf(info.reminder.id);

            if (index !== -1) { // Make sure the reminder hasn't already been deleted
                client.db.reminders.remove(info.reminder.user, i => i.id === info.reminder.id, "reminders");

                if (!client.db.reminders.get(info.reminder.user, "reminders").length) { // If the user has no other reminders, delete the entire key
                    client.db.reminders.delete(info.reminder.user);
                };

                return client.users.cache.get(info.reminder.user).send("Ok! You won't receive this reminder anymore");
            };
        }).catch(err => {
            return;
        });
    } else {
        const reminderEmb = new Discord.MessageEmbed()
            .setColor(config.embedColor)
            .setTitle("Reminder");

        if (info.reminder.msg.length > 1925) { // Make sure we don't go over the character limit
            reminderEmb.setDescription(`You asked me to remind you of: \`${info.reminder.msg.substr(0, 1925) + "..."}\``);
        } else {
            reminderEmb.setDescription(`You asked me to remind you of: \`${info.reminder.msg}\``);
        };

        // It's very possible for the user to not be in the bots cache. Make sure we don't error out if so
        try {
            client.users.cache.get(info.reminder.user).send({
                embeds: [reminderEmb]
            });
        } catch (error) { };

        if (!info.reminder.recurringInMs) { // Delete the reminder if it isn't set to recur
            client.db.reminders.remove(info.reminder.user, i => i.id === info.reminder.id, "reminders");

            if (!client.db.reminders.get(info.reminder.user, "reminders").length) { // If the user has no other reminders, delete the entire key
                client.db.reminders.delete(info.reminder.user);
            };
        };
    };
};