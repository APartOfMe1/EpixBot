module.exports = {
    name: 'daily',
    description: 'Get daily credits',
    category: 'Monetary',
    async execute(msg, args) {
        // Set the default settings for credits
        client.db.credits.ensure(msg.author.id, {
            user: msg.author.id,
            credits: 0,
            streak: 0,
            totalcredits: 0,
            totaldailies: 0,
            lastran: 0,
            canspeedup: false
        });

        // If the member is in the cooldown list, don't do anything. Otherwise add them to the cooldown
        if (checkTime(client.db.credits.get(msg.author.id, "lastran"))) {
            var finalMsg = [];

            var streak = client.db.credits.get(msg.author.id, "streak");

            client.db.credits.set(msg.author.id, false, "canspeedup");

            // Check if it's been more than 48 hours since the user last ran thet command
            if (checkTime(client.db.credits.get(msg.author.id, "lastran")) === "overTime") {
                // If so, reset their streak
                client.db.credits.set(msg.author.id, 0, "streak");

                finalMsg.push("It's been more than 48 hours since you last claimed your daily credits, so your streak got reset\n");
            }

            // Set the previous streak
            client.db.credits.set(msg.author.id, streak, "oldstreak");

            // Increment the streak counter by 1
            client.db.credits.inc(msg.author.id, "streak");

            // Set the new streak variable value
            streak = client.db.credits.get(msg.author.id, "streak");

            // Increment the global daily counter by 1
            client.db.credits.inc(msg.author.id, "totaldailies");

            // Give a bonus every 5 days
            if (Number.isInteger(streak / 5) && streak !== 0) {
                client.db.credits.set(msg.author.id, true, "canspeedup");

                finalMsg.push(`Bonus! You've used daily **${streak}** times in a row, so you'll be able to use this command again in 15 hours instead of 24!\n`);
            }

            // Give a bonus 100 days
            if (Number.isInteger(streak / 100) && streak !== 0) {
                finalMsg.push(`Bonus! You've used daily for **${streak}** days in a row! To celebrate, you get a bonus of 25,000 credits!\n`);
            }

            // Give a bonus every year
            if (Number.isInteger(streak / 365) && streak !== 0) {
                finalMsg.push(`Bonus! You've used daily for **${streak / 365}** year(s) in a row! To celebrate, you get a bonus of 75,000 credits!\n`);
            }

            finalMsg.push(givePoints(msg.author.id));

            client.db.credits.set(msg.author.id, new Date().valueOf(), "lastran");

            return msg.channel.send(finalMsg);
        } else {
            var waitMsg = `You've already used this command today! Try again in **${getTime(84600000 - (new Date().valueOf() - client.db.credits.get(msg.author.id, "lastran")))}**`;

            // Check if the user has a bonus
            if (client.db.credits.get(msg.member.id, "canspeedup")) {
                waitMsg = `You've already used this command today! Try again in **${getTime(54000000 - (new Date().valueOf() - client.db.credits.get(msg.author.id, "lastran")))}**`;
            }

            return msg.channel.send(waitMsg);
        }

        function givePoints(id) {
            // Get the current streak and multiply by 10-15 to reward active users
            var streakBonus = client.db.credits.get(id, "streak") * (Math.floor(Math.random() * (15 - 10 + 1)) + 10);

            // Make sure the bonus doesn't go too high
            if (streakBonus > 1100) {
                streakBonus = 1100;
            }

            // Add the default 150 points to the bonus
            var totalCredits = 150 + streakBonus;

            // Give a bonus every year
            if (Number.isInteger(client.db.credits.get(id, "streak") / 365) && client.db.credits.get(id, "streak") !== 0) {
                // Add the bonus credits to their total
                totalCredits += 75000;
            }

            if (Number.isInteger(client.db.credits.get(id, "streak") / 100) && client.db.credits.get(id, "streak") !== 0) { //Give a bonus 100 days
                // Add the bonus credits to their total
                totalCredits += 25000;
            }

            // Set the new balance
            client.db.credits.set(id, client.db.credits.get(id, "credits") + totalCredits, "credits");

            // Add to the global credits balance
            client.db.credits.set(id, client.db.credits.get(id, "totalcredits") + totalCredits, "totalcredits");

            return `Added **${totalCredits}** to your balance! You now have **${client.db.credits.get(id, "credits")}** credits and a **${client.db.credits.get(id, "streak")}** day streak`;
        }

        function checkTime(time) {
            var currentDate = new Date().valueOf();

            // Set different time values if the user is on a bonus streak
            if (client.db.credits.get(msg.member.id, "canspeedup")) {
                if ((time + 54000000) > currentDate) {
                    return false;
                } else if ((time + 172800000) < currentDate) {
                    return 'overTime';
                } else {
                    return true;
                }
            }

            if ((time + 84600000) > currentDate) { // Check if it's been 23:30
                return false;
            } else if ((time + 172800000) < currentDate) { //Check if it's been 48 hours
                return 'overTime';
            } else {
                return true;
            }
        }

        // Convert from milliseconds to hh:mm:ss
        function getTime(s) {
            var ms = s % 1000;

            s = (s - ms) / 1000;

            var secs = s % 60;

            s = (s - secs) / 60;

            var mins = s % 60;

            var hrs = (s - mins) / 60;

            var pluralSec = "seconds";

            if (secs === 1) {
                pluralSec = "second";
            };

            var pluralMin = "minutes";

            if (mins === 1) {
                pluralMin = "minute";
            };

            var pluralHrs = "hours";

            if (hrs === 1) {
                pluralHrs = "hour";
            };

            if (!hrs && !mins) {
                return `${secs} ${pluralSec}`
            };

            if (!hrs) {
                return `${mins} ${pluralMin}, and ${secs} ${pluralSec}`;
            };

            return `${hrs} ${pluralHrs}, ${mins} ${pluralMin}, and ${secs} ${pluralSec}`;
        }
    },
};