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
        var credits = parseInt(args[0], 10); //Get the amount of credits to bet

        var t = 0;

        if (!credits) { //If there were no credits specified, set the amount to 1
            credits = 1;
        };

        if (credits > 500) { //Make sure the user doesn't bet more than 500 credits at a time
            credits = 500;
        };

        client.db.credits.ensure(msg.author.id, { //Set the default settings for credits
            user: msg.author.id,
            credits: 0,
            streak: 0,
            totalcredits: 0,
            totaldailies: 0
        });

        if (client.db.credits.get(msg.author.id, "credits") < credits) { //Check to see if the user has enough credits to play
            return msg.channel.send("You don't have enough credits!");
        };

        client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") - credits, "credits"); //Remove the specified amount of credits from the user's account

        msg.channel.send(`You used **${credits}** credits to spin the slot machine!`); //Send a success message

        var slotMsg = await msg.channel.send("Spinning slot machine..."); //Send a message to edit later

        var spinInt = setInterval(() => {
            if (++t > 2) { //After 2 times, run this. The message will be edited a total of 3 times
                clearInterval(spinInt); //Stop the interval

                var finalSpin = spin(); //Spin the machine

                var slotEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("You spun the slot machine!")
                    .addField("Machine", `\`\`\`${finalSpin.join("")}\`\`\``, true)
                    .addField("Possible Outcomes", `A match is a row of 3 of the same icon. The match can be vertical, horizontal, or diagonal. \n\`\`\` 1 match:   ${credits * 1 * 2}\n 2 matches: ${credits * 2 * 2}\n 3 matches: ${credits * 3 * 2}\n 4 matches: ${credits * 4 * 2}\n 5 matches: ${credits * 5 * 2}\n 6 matches: ${credits * 6 * 2}\n 7 matches: ${credits * 7 * 2}\n 8 matches: ${credits * 8 * 2}\`\`\``, true);

                slotMsg.edit({ //Edit the message with the spin
                    embed: slotEmb
                });

                slotEmb.addField("Results", checkWin(finalSpin, credits)); //Check to see if the spin is a winner

                return slotMsg.edit({ //Edit the message with the final results
                    embed: slotEmb
                });
            } else {
                var slotEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("You spun the slot machine!")
                    .addField("Machine", `\`\`\`${spin().join("")}\`\`\``, true)
                    .addField("Possible Outcomes", `A match is a row of 3 of the same icon. The match can be vertical, horizontal, or diagonal. \n\`\`\` 1 match:   ${credits * 1 * 2}\n 2 matches: ${credits * 2 * 2}\n 3 matches: ${credits * 3 * 2}\n 4 matches: ${credits * 4 * 2}\n 5 matches: ${credits * 5 * 2}\n 6 matches: ${credits * 6 * 2}\n 7 matches: ${credits * 7 * 2}\n 8 matches: ${credits * 8 * 2}\`\`\``, true)

                slotMsg.edit({ //Edit the message with a new spin
                    embed: slotEmb
                });
            };
        }, 1500);

        function spin() {
            var emotes = [ //Define the emotes used
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

            const slotEmotes = getItemsFromArray(emotes, 7); //Get 7 items from the array

            var grid = []; //Set a blank array. This will store the full grid

            for (let h = 0; h < 3; h++) { //Create each row of the array
                var row = [];

                for (let l = 0; l < 3; l++) { //Push 3 random emotes to the row array
                    row.push(slotEmotes[Math.floor(Math.random() * slotEmotes.length)]);
                };

                grid.push(`${row.join("")}\n`); //Push the row to the full grid
            };

            return grid;
        };

        function getItemsFromArray(arr, n) {
            var items = [];

            for (let i = 0; i < n; i++) { //Get the specified number of random items from the given array
                items.push(arr[Math.floor(Math.random() * arr.length)]);
            };

            return items;
        };

        function checkWin(i, credits) {
            var allChar = []; //This will store the emotes for later

            var hasWon = 0; //This will store how many rows match

            i.forEach(row => { //Check to see if a row has 3 of the same emote in a row
                var rowItems = splitter.splitGraphemes(row);

                rowItems.forEach(item => allChar.push(item)); //Push each individual emote to the array

                if (rowItems[0] === rowItems[1] && rowItems[1] === rowItems[2]) { //Check if the emotes match each other
                    ++hasWon;
                };
            });

            if (allChar[0] === allChar[4] && allChar[4] === allChar[8]) { //Get the first column and check if it matches
                ++hasWon;
            };

            if (allChar[1] === allChar[5] && allChar[5] === allChar[9]) { //Get the second column and check if it matches
                ++hasWon;
            };

            if (allChar[2] === allChar[6] && allChar[6] === allChar[10]) { //Get the third column and check if it matches
                ++hasWon;
            };

            if (allChar[0] === allChar[5] && allChar[5] === allChar[10]) { //Get one of the diagonals and check if it matches
                ++hasWon;
            };

            if (allChar[8] === allChar[5] && allChar[5] === allChar[2]) { //Get the other diagonal line and check if it matches
                ++hasWon;
            };

            var totalWon = credits * hasWon * 2; //Calculate the total amount of credits won

            client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") + totalWon, "credits"); //Set the credits

            if (totalWon === 0) { //Check if no credits were given to make the message look nicer
                totalWon = 'nothing';
            } else {
                totalWon = `${totalWon} credits`;
            };

            return `You bet **${credits}** credit(s) and won **${totalWon}**`;
        };
    },
};