const Discord = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
    name: 'reminder',
    description: 'Set a reminder',
    category: 'Utilities',
    aliases: ["remindme", "remind"],
    usage: '`{prefix}reminder t:<time> r:<time> <reminder>`',
    examples: '`{prefix}reminder t:24h r:24h Use the daily command!`',
    async execute(msg, args) {
        var time;

        var recurring;

        var reminder = args;

        var optsArr = [
            "t:",
            "r:"
        ];

        if (!args[0] || args[0].toLowerCase() === "help") {
            const helpEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("Reminder Help")
                .setDescription(`To set a reminder use \`${config.prefix}reminder t:<time> r:<recurring time> <message>\`\n\nThe time and message parameters are required, but recurring is not. The reminders will only start recurring once the initial time has passed. For example, \`t:12h r:24h\` will initially remind you in 12 hours, then again every 24 hours after that.\n\nThe minimum reminder time is 30 seconds.`)
                .addField("Examples", `\`\`\`${config.prefix}reminder t:12h15m r:24h use your daily command!\n\n${config.prefix}reminder t:5h re-watch never gonna give you up\n\n${config.prefix}reminder t:1y2d5h30m17s this reminder is pretty long isn't it!\`\`\``, true)
                .addField("Cheat Cheat", "```y: years\nd: days\nh: hours\nm: minutes\ns: seconds```", true);

            return msg.channel.send({
                embed: helpEmb
            });
        };

        for (const opt of optsArr) { //Run through every word and check if it's the time or recurring parameter
            for (const item of reminder) {
                if (item.toLowerCase().startsWith(opt)) {
                    const value = item.split(":")[1];

                    switch (opt) {
                        case "t:":
                            time = getTime(value);

                            break;

                        case "r:":
                            recurring = getTime(value);

                            break;
                    };

                    reminder = reminder.join(" ").replace(item, "").trim().split(" "); //Remove the parameter from the message
                };
            };
        };

        reminder = reminder.join(" ");

        if (!time || !time.total || !reminder) {
            return msg.channel.send(`I need both a time and message to set a reminder! To see available options, type \`${config.prefix}reminder help\``);
        };

        if (!recurring || !recurring.total) { //Set the reminder param to false if it wasn't specified
            recurring = false;
        };

        const uniqueId = genId(16);

        const template = {
            id: uniqueId,
            user: msg.author.id,
            timeInMs: time.total,
            recurringInMs: recurring.total,
            count: 0,
            hasReminded: false,
            msg: reminder
        };

        client.db.reminders.ensure(msg.author.id, { //Create the user in the db if they don't already exist
            userId: msg.author.id,
            reminders: []
        });

        client.db.reminders.push(msg.author.id, template, "reminders");

        const replaceTime = s => { //Convert a string in ydhms format to full words
            return s.replace(/(?<![A-Z]|[a-z]| )y/g, " years").replace(/(?<![A-Z]|[a-z]| )d/g, " days").replace(/(?<![A-Z]|[a-z]| )h/g, " hours").replace("m", " minutes").replace(/(?<![A-Z]|[a-z]| )s/g, " seconds");
        };

        const remindEmb = new Discord.MessageEmbed()
            .setColor(config.embedColor)
            .setTitle("Reminder Confirmation")
            .setDescription(`I'll remind you in ${replaceTime(time.printed.join(" "))}`)
            .addField("Time", replaceTime(time.printed.join(" ")), true);

        if (!recurring.printed) {
            remindEmb.addField("Recurring", false, true);
        } else {
            remindEmb.addField("Recurring", replaceTime(recurring.printed.join(" ")), true);
        };

        if (reminder.length > 2000) { //Make sure we aren't going over the character limit
            remindEmb.addField("Reminder Message", reminder.substr(0, 1950) + "...", true);
        } else {
            remindEmb.addField("Reminder Message", reminder, true);
        };

        return msg.channel.send({
            embed: remindEmb
        });

        function genId(length) {
            const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"; //Define the character set

            var final = "";

            for (let i = 0; i < length; i++) { //Create a string with the specified length
                final += characters[Math.floor(Math.random() * characters.length)];
            };

            return final;
        };

        function getTime(t) {
            const validTimes = [
                "y",
                "d",
                "h",
                "m",
                "s"
            ];

            const totals = {
                y: 0,
                d: 0,
                h: 0,
                m: 0,
                s: 0
            };

            const hasTime = obj => { //Check if any value in the object is greater than zero
                let count = 0;

                for (const i in obj) {
                    count += obj[i];
                };

                if (count === 0) {
                    return false;
                } else {
                    return true;
                };
            };

            const printedTimes = [];

            var timeArr = t.split(/(?<=[a-z]|[A-Z])/g); //Split the message on each letter without removing said letter (3h20m to ["3h", "20m"] for example)

            var totalMs = 0;

            for (const t of timeArr) { //Add each time to the totals object
                for (const i of validTimes) {
                    if (t.endsWith(i) && parseInt(t.split(i)[0])) {
                        totals[i] += parseInt(t.split(i)[0]);
                    };
                };
            };

            if (!hasTime(totals)) { //Make sure we actually added a time at all
                return {
                    total: false,
                    printed: false
                };
            };

            for (const i in totals) {
                if (totals[i] !== 0) { //Add the time plus the correct letter to the array
                    printedTimes.push(totals[i] + i);
                };

                switch (i) { //Convert to ms
                    case "y":
                        totalMs += (totals[i] * 31556952000);

                        break;

                    case "d":
                        totalMs += (totals[i] * 86400000);

                        break;

                    case "h":
                        totalMs += (totals[i] * 3600000);

                        break;

                    case "m":
                        totalMs += (totals[i] * 60000);

                        break;

                    case "s":
                        totalMs += (totals[i] * 1000);

                        break;
                };
            };

            if (totalMs < 30000) { //Make sure the total time is at least 30s
                printedTimes[printedTimes.findIndex(t => t.endsWith("s"))] = "30s";

                totalMs = 30000;
            };

            return {
                total: totalMs,
                printed: printedTimes
            };
        };
    },
};