module.exports = {
    name: 'daily',
    description: 'Get daily credits',
    category: 'Monetary',
    async execute(msg, args) {
        client.db.credits.ensure(msg.author.id, { //Set the default settings for credits
            user: msg.author.id,
            credits: 0,
            streak: 0,
            totalcredits: 0,
            totaldailies: 0,
            lastran: 0,
            canspeedup: false
        });

        if (checkTime(client.db.credits.get(msg.author.id, "lastran"))) { //If the member is in the cooldown list, don't do anything. Otherwise add them to the cooldown
            var finalMsg = [];

            client.db.credits.set(msg.author.id, false, "canspeedup");

            if (checkTime(client.db.credits.get(msg.author.id, "lastran")) === "overTime") { //Check if it's been more than 48 hours since the user last ran thet command
                client.db.credits.set(msg.author.id, 0, "streak"); //If so, reset their streak

                finalMsg.push("It's been more than 48 hours since you last claimed your daily credits, so your streak got reset\n");
            };

            client.db.credits.inc(msg.author.id, "streak"); //Increment the streak counter by 1

            client.db.credits.inc(msg.author.id, "totaldailies"); //Increment the global daily counter by 1

            if (Number.isInteger(client.db.credits.get(msg.author.id, "streak") / 5) && client.db.credits.get(msg.author.id, "streak") !== 0) { //Give a bonus every 5 days
                client.db.credits.set(msg.author.id, true, "canspeedup");

                finalMsg.push(`Bonus! You've used daily **${client.db.credits.get(msg.author.id, "streak")}** times in a row, so you'll be able to use this command again in 15 hours instead of 24!\n`);
            };

            if (Number.isInteger(client.db.credits.get(msg.author.id, "streak") / 365) && client.db.credits.get(msg.author.id, "streak") !== 0) { //Give a bonus every year
                finalMsg.push(`Bonus! You've used daily for **${client.db.credits.get(msg.author.id, "streak") / 365}** year(s) in a row! To celebrate, you get a bonus of 50,000 credits!\n`);
            };

            finalMsg.push(givePoints(msg.author.id));

            client.db.credits.set(msg.author.id, new Date().valueOf(), "lastran");

            return msg.channel.send(finalMsg);
        } else {
            var waitMsg = `You've already used this command today! Try again in **${getTime(86400000 - (new Date().valueOf() - client.db.credits.get(msg.author.id, "lastran")))}**`;

            if (client.db.credits.get(msg.member.id, "canspeedup")) { //Check if the user has a bonus
                waitMsg = `You've already used this command today! Try again in **${getTime(54000000 - (new Date().valueOf() - client.db.credits.get(msg.author.id, "lastran")))}**`;
            };

            return msg.channel.send(waitMsg);
        };

        function givePoints(id) {
            var streakBonus = client.db.credits.get(id, "streak") * (Math.floor(Math.random() * (15 - 10 + 1)) + 10); //Get the current streak and multiply by 10-15 to reward active users

            if (streakBonus > 1100) { //Make sure the bonus doesn't go too high
                streakBonus = 1100;
            };

            var totalCredits = 150 + streakBonus; //Add the default 150 points to the bonus

            if (Number.isInteger(client.db.credits.get(id, "streak") / 365) && client.db.credits.get(id, "streak") !== 0) { //Give a bonus every year
                totalCredits += 50000; //Add the bonus credits to their total
            };

            client.db.credits.set(id, client.db.credits.get(id, "credits") + totalCredits, "credits"); //Set the new balance

            client.db.credits.set(id, client.db.credits.get(id, "totalcredits") + totalCredits, "totalcredits"); //Add to the global credits balance

            return `Added **${totalCredits}** to your balance! You now have **${client.db.credits.get(id, "credits")}** credits and a **${client.db.credits.get(id, "streak")}** day streak`;
        };

        function checkTime(time, user) {
            var currentDate = new Date().valueOf();

            if (client.db.credits.get(msg.member.id, "canspeedup")) { //Set different time values if the user is on a bonus streak
                if ((time + 54000000) > currentDate) {
                    return false;
                } else if ((time + 172800000) < currentDate) {
                    return 'overTime';
                } else {
                    return true;
                };
            };

            if ((time + 86400000) > currentDate) { //Check if it's been 24 hours
                return false;
            } else if ((time + 172800000) < currentDate) { //Check if it's been 48 hours
                return 'overTime';
            } else {
                return true;
            };
        };

        function getTime(s) { //Convert from milliseconds to hh:mm:ss
            var ms = s % 1000;

            s = (s - ms) / 1000;

            var secs = s % 60;

            s = (s - secs) / 60;

            var mins = s % 60;

            var hrs = (s - mins) / 60;

            if (secs === 1) {
                var plural = "second";
            } else {
                var plural = "seconds";
            };

            if (!hrs && !mins) {
                return `${secs} ${plural}`
            };

            if (!hrs) {
                return `${mins} minutes, and ${secs} ${plural}`;
            };

            return `${hrs} hours, ${mins} minutes, and ${secs} ${plural}`;
        };
    },
};