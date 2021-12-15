const Discord = require('discord.js');
const GraphemeSplitter = require('grapheme-splitter');
const config = require("../../config/config.json");
const splitter = new GraphemeSplitter();

module.exports = {
    name: 'slots',
    description: 'Play the slot machine',
    category: 'Monetary',
    cooldown: 5000,
    usage: '`{prefix}slots` or `{prefix}slots <amount>`',
    examples: '`{prefix}slots 250`',
    async execute(msg, args) {
        // Get the amount of credits to bet
        var credits = parseInt(args[0], 10);

        var t = 0;

        // If there were no credits specified, set the amount to 1
        if (!credits) {
            credits = 1;
        }

        // Make sure the user doesn't bet more than 500 credits at a time
        if (credits > 500) {
            credits = 500;
        }

        // Set the default settings for credits
        client.db.credits.ensure(msg.author.id, {
            user: msg.author.id,
            credits: 0,
            streak: 0,
            totalcredits: 0,
            totaldailies: 0
        });

        // Check to see if the user has enough credits to play
        if (client.db.credits.get(msg.author.id, "credits") < credits) {
            return msg.channel.send("You don't have enough credits!");
        }

        // Remove the specified amount of credits from the user's account
        client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") - credits, "credits");

        // Send a success message
        msg.channel.send(`You used **${credits}** credits to spin the slot machine!`);

        var slotMsg = await msg.channel.send("Spinning slot machine...");

        var spinInt = setInterval(() => {
            // After 2 times, run this. The message will be edited a total of 3 times
            if (++t > 2) {
                clearInterval(spinInt);

                var finalSpin = spin();

                var slotEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("You spun the slot machine!")
                    .addField("Machine", `\`\`\`${finalSpin.join("")}\`\`\``, true)
                    .addField("Possible Outcomes", `A match is a row of 3 of the same icon. The match can be vertical, horizontal, or diagonal. \n\`\`\` 1 match:   ${credits * 1 * 2}\n 2 matches: ${credits * 2 * 2}\n 3 matches: ${credits * 3 * 2}\n 4 matches: ${credits * 4 * 2}\n 5 matches: ${credits * 5 * 2}\n 6 matches: ${credits * 6 * 2}\n 7 matches: ${credits * 7 * 2}\n 8 matches: ${credits * 8 * 2}\`\`\``, true);

                slotMsg.edit({
                    embeds: [slotEmb]
                });

                // Check to see if the spin is a winner
                slotEmb.addField("Results", checkWin(finalSpin, credits));

                return slotMsg.edit({
                    content: null,
                    embeds: [slotEmb]
                });
            } else {
                var slotEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("You spun the slot machine!")
                    .addField("Machine", `\`\`\`${spin().join("")}\`\`\``, true)
                    .addField("Possible Outcomes", `A match is a row of 3 of the same icon. The match can be vertical, horizontal, or diagonal. \n\`\`\` 1 match:   ${credits * 1 * 2}\n 2 matches: ${credits * 2 * 2}\n 3 matches: ${credits * 3 * 2}\n 4 matches: ${credits * 4 * 2}\n 5 matches: ${credits * 5 * 2}\n 6 matches: ${credits * 6 * 2}\n 7 matches: ${credits * 7 * 2}\n 8 matches: ${credits * 8 * 2}\`\`\``, true)

                slotMsg.edit({
                    embeds: [slotEmb]
                });
            }
        }, 1500);

        function spin() {
            // Define the possible emotes to use
            var emotes = [
                "🍇",
                "🍒",
                "🍌",
                "🍐",
                "🍊",
                "🍈",
                "🍎",
                "🍏",
                "🍓",
                "🍅",
                "🥦",
                "🍙",
                "🍬",
                "☕",
                "🍪",
                "🍉",
                "🍋",
                "🍍",
                "🥝",
                "💸",
                "💰",
                "💳",
                "💴",
                "💲"
            ];

            // Select 7 of those emotes
            const slotEmotes = getItemsFromArray(emotes, 7);

            // Set a blank array. This will store the full grid
            var grid = [];

            // Create each row of the array
            for (let h = 0; h < 3; h++) {
                var row = [];

                // Push 3 random emotes to the row array
                for (let l = 0; l < 3; l++) {
                    row.push(slotEmotes[Math.floor(Math.random() * slotEmotes.length)]);
                }

                // Push the row to the full grid
                grid.push(`${row.join("")}\n`);
            }

            return grid;
        }

        function getItemsFromArray(arr, n) {
            var items = [];

            // Get the specified number of random items from the given array
            for (let i = 0; i < n; i++) {
                items.push(arr[Math.floor(Math.random() * arr.length)]);
            }

            return items;
        }

        function checkWin(i, credits) {
            var allChar = [];

            var hasWon = 0;

            // Check to see if a row has 3 of the same emote in a row
            i.forEach(row => {
                var rowItems = splitter.splitGraphemes(row);

                // Push each individual emote to the array
                rowItems.forEach(item => allChar.push(item));

                // Check if the emotes match each other
                if (rowItems[0] === rowItems[1] && rowItems[1] === rowItems[2]) {
                    ++hasWon;
                }
            });

            // Get the first column and check if it matches
            if (allChar[0] === allChar[4] && allChar[4] === allChar[8]) {
                ++hasWon;
            }

            // Get the second column and check if it matches
            if (allChar[1] === allChar[5] && allChar[5] === allChar[9]) {
                ++hasWon;
            }

            // Get the third column and check if it matches
            if (allChar[2] === allChar[6] && allChar[6] === allChar[10]) {
                ++hasWon;
            }

            // Get one of the diagonals and check if it matches
            if (allChar[0] === allChar[5] && allChar[5] === allChar[10]) {
                ++hasWon;
            }

            // Get the other diagonal line and check if it matches
            if (allChar[8] === allChar[5] && allChar[5] === allChar[2]) {
                ++hasWon;
            }

            // Calculate the total amount of credits won
            var totalWon = credits * hasWon * 2;

            client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") + totalWon, "credits");

            // Check if no credits were given to make the message look nicer
            if (totalWon === 0) {
                totalWon = 'nothing';
            } else {
                totalWon = `${totalWon} credits`;
            }

            return `You bet **${credits}** credit(s) and won **${totalWon}**`;
        }
    },
};