module.exports = {
    name: 'leaderboard',
    description: 'Check the leaderboard for the current guild or the global credit leaderboard. You can also specify a page of the leaderboard to view',
    usage: "`{prefix}leaderboard <page>` or `{prefix}leaderboard global`",
    aliases: ["lb", "top"],
    category: 'Utilities',
    async execute(msg, args) {
        if (args[0] && args[0].toLowerCase() === "global") { // Check if the user wants the global or guild leaderboard
            var lbToCheck = "global";
        } else {
            var lbToCheck = "guild";
        };

        if (args[1] && parseInt(args[1]) && parseInt(args[1]) !== 1) { // Check if the user wants to view a specific page on the leaderboard
            var page = parseInt(args[1]);
        } else if (args[0] && parseInt(args[0]) && parseInt(args[0]) !== 1) { // Same deal here, we're just checking both args 0 and 1. This allows us to get pages for both global and guild leaderboards
            var page = parseInt(args[0]);
        } else {
            var page = 1;
        };

        if (lbToCheck === "global") {
            var sorted = client.db.credits.array().sort((a, b) => b.credits - a.credits).splice((page * 10) - 10, (page * 10)); // Get the credits for the current page of users
        } else {
            var sorted = client.db.points.filter(p => p.guild === msg.guild.id).array().sort((a, b) => b.points - a.points).splice((page * 10) - 10, (page * 10)); // Get the points of each member in the guild, sort by amount of points, and get the users specified by the page number
        };

        const top10 = []; // Create an empty array to store the guild member and point info

        var i = (page * 10) - 10;

        var authorRank = 0;

        var authorlvl = 0;

        var maxPoints = 0; // This is to fix the issue with multiple instances of the same user being displayed

        var globalStanding;

        for (const data of sorted) { // Add a new field for each member in the top 10
            var member = msg.guild.members.cache.get(data.user); // Get the member

            var user = client.users.cache.get(data.user); // Get the user

            if (lbToCheck === "guild" && data.points && member) { // Make sure the user actually has points, and that the member exists
                ++i; // Increment the variable by 1

                if (data.user === msg.author.id && data.points > maxPoints) { // Check if the user is the message author
                    maxPoints = data.points;

                    authorRank = i; // Set the authors rank

                    authorlvl = `${data.level} (${data.points} points)`; // Set the authors level
                };

                top10.push(`#${i}   ${member.displayName} \n${data.points} points (level ${data.level})`); // Format correctly and push to the array
            } else if (lbToCheck === "global" && data.credits && user) {
                ++i; // Increment the variable by 1

                globalStanding = sorted.filter(i => i.user === msg.author.id); // Get the user's standing

                top10.push(`#${i}   ${user.tag} \n${data.credits} credits`); // Format correctly and push to the array
            };
        };

        if (!top10.length) { // Make sure the leaderboard doesn't show up as blank
            top10.push("\nNo data to display");
        };

        if (lbToCheck === "guild") { // Determine how to format the message
            var message = `\`\`\`md\n< Top Users in ${msg.guild} > \n${top10.splice(0, 10).join("\n\n")} \n------------------------------------- \n> Your Stats \nRank: ${authorRank}   Level: ${authorlvl}\`\`\``;
        } else {
            var message = `\`\`\`md\n< Global Monetary Leaderboard > \n${top10.splice(0, 10).join("\n\n")} \n------------------------------------- \n> Your Stats \nGlobal rank: ${sorted.indexOf(globalStanding[0]) + 1}\`\`\``;
        };

        return msg.channel.send(message);
    },
};