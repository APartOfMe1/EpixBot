const Discord = require('discord.js');
const config = require("../../config/config.json");
const {
    get
} = require('node-superfetch');

module.exports = {
    name: 'trivia',
    description: 'Play a game of trivia! How far can you get?',
    category: 'Monetary',
    aliases: ["quiz"],
    cooldown: 5000,
    usage: '`{prefix}trivia <amount>`, or `{prefix}trivia <amount> <category>`',
    examples: '`{prefix}trivia 250`, `{prefix}trivia 500 Geography`',
    async execute(msg, args) {
        var streak = 0;

        if (!parseInt(args[0])) {
            return getCategories();
        }

        // Get the amount of credits to bet
        var credits = parseInt(args[0], 10);

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

        const highlow = await getCategories(true);

        // Check if the category is valid
        if (args[1] && !parseInt(args[1]) || args[1] && parseInt(args[1]) > highlow.high || args[1] && parseInt(args[1]) < highlow.low) {
            return getCategories();
        }

        var url = "https://opentdb.com/api.php?amount=1&encode=url3986";

        // Change the url to use the selected category
        if (args[1] && parseInt(args[1])) {
            url = `https://opentdb.com/api.php?amount=1&encode=url3986&category=${parseInt(args[1])}`;
        }

        // Remove the specified amount of credits from the user's account
        client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") - credits, "credits");

        msg.channel.send(`You used **${credits}** credits to play trivia!`);

        // Get a question
        return newQuestion(url);

        async function newQuestion(url) {
            // Get the question info
            // The question is retrieved in RFC 3986 and decoded later to avoid issues with the default format
            const {
                body
            } = await get(url);

            // Get the incorrect answers in an array
            var answers = body.results[0].incorrect_answers;

            // Add the correct answer to the array
            answers.push(body.results[0].correct_answer);

            // Randomize the order of the answers
            shuffle(answers);

            var i = 0;

            var numbers = [];

            var correctNumber = null;

            answers = answers.map((a) => {
                +i;

                numbers.push(i = i + 1);

                // Add the correct answer to the variable
                if (a === body.results[0].correct_answer) {
                    correctNumber = i;
                }

                // Format the message correctly
                return `${`**${i}.**`} ${a}`;
            }).join('\n');

            const questionEmbed = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle(decodeURIComponent(body.results[0].question))
                .setDescription(`Category: \`${decodeURIComponent(body.results[0].category)}\`, Difficulty: \`${decodeURIComponent(body.results[0].difficulty)}\``)
                .addField("Answers", decodeURIComponent(answers), true)
                .setFooter(`Respond with ${numbers.join(", ")} to select an answer! You have 30 seconds`);

            msg.channel.send({
                embeds: [questionEmbed]
            });

            // Create a filter that only accepts messages from the original author and that includes a valid answer
            const filter = m => m.author.id === msg.author.id && numbers.join(",").includes(m.content);

            msg.channel.awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                // Check if the correct answer was given
                if (collected.first().content == correctNumber) {
                    ++streak;

                    msg.channel.send(`You got it right! Your streak is now ${streak}`);

                    // Get a new question
                    return newQuestion(url);
                } else {
                    var earnedCredits = credits * streak;

                    if (earnedCredits > 5000) {
                        earnedCredits = 5000;
                    }

                    // Set the credits
                    client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") + earnedCredits, "credits");

                    const failEmbed = new Discord.MessageEmbed()
                        .setTitle("Game Over")
                        .setColor(config.embedColor)
                        .setDescription("That was the wrong answer!")
                        .addField("Correct Answer", `${decodeURIComponent(body.results[0].correct_answer)}`, true)
                        .addField("Your Streak", streak, true)
                        .addField("Credits Earned", earnedCredits, true);

                    return msg.channel.send({
                        embeds: [failEmbed]
                    });
                }
            }).catch(e => {
                var earnedCredits = credits * streak;

                if (earnedCredits > 5000) {
                    earnedCredits = 5000;
                }

                // Set the credits
                client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") + earnedCredits, "credits");

                const timeEmbed = new Discord.MessageEmbed()
                    .setTitle("Game Over")
                    .setColor(config.embedColor)
                    .setDescription("You ran out of time!")
                    .addField("Correct Answer", `${decodeURIComponent(body.results[0].correct_answer)}`, true)
                    .addField("Your Streak", streak, true)
                    .addField("Credits Earned", earnedCredits, true);

                return msg.channel.send({
                    embeds: [timeEmbed]
                });
            });
        }

        // Uses the Fisher–Yates shuffle algorithm
        function shuffle(a) {
            var j, x, i;

            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));

                x = a[i];

                a[i] = a[j];

                a[j] = x;
            }

            return a;
        }

        async function getCategories(getNums) {
            const list = [];

            const {
                body
            } = await get('https://opentdb.com/api_category.php');

            // If we just want to get the highest/lowest IDs
            if (getNums === true) {
                var high = 0;

                // Set this variable high so that it's basically guaranteed that something will be lower
                var low = 999;

                for (const n of body.trivia_categories) {
                    if (n.id > high) {
                        high = n.id;
                    }

                    if (n.id < low) {
                        low = n.id;
                    }
                }

                return ({
                    high: high,
                    low: low
                });
            }

            body.trivia_categories.map(i => {
                list.push(`\`${i.id}\` ${i.name}`);
            });

            const catEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle("Trivia")
                .setDescription(`Use \`${config.prefix}trivia <bet> <category>\` to play trivia! You can bet anywhere from 1-500 credits. Not specifying a category will cause them to be randomly chosen`)
                .addField("ID/Category List", list.join("\n", true));

            return msg.channel.send({
                embeds: [catEmb]
            });
        }
    },
};