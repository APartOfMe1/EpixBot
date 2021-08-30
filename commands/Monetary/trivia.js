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
        };

        var credits = parseInt(args[0], 10); //Get the amount of credits to bet

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

        const highlow = await getCategories(true);

        if (args[1] && !parseInt(args[1]) || args[1] && parseInt(args[1]) > highlow.high || args[1] && parseInt(args[1]) < highlow.low) { //Check if the category is valid
            return getCategories();
        };

        var url = "https://opentdb.com/api.php?amount=1&encode=url3986";

        if (args[1] && parseInt(args[1])) { //Change the url to use the selected category
            url = `https://opentdb.com/api.php?amount=1&encode=url3986&category=${parseInt(args[1])}`;
        };

        client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") - credits, "credits"); //Remove the specified amount of credits from the user's account

        msg.channel.send(`You used **${credits}** credits to play trivia!`);

        return newQuestion(url); //Get a question

        async function newQuestion(url) {
            const {
                body
            } = await get(url); //Get the question info. The question is retrieved in RFC 3986 and decoded later to avoid issues with the default format

            var answers = body.results[0].incorrect_answers; //Get the incorrect answers in an array

            answers.push(body.results[0].correct_answer); //Add the correct answer to the array

            shuffle(answers); //Randomize the order of the answers

            var i = 0; //Set a variable for the answer number

            var numbers = []; //An array that will contain the total number of answers

            var correctNumber = null; //Set a blank variable that will store the number of the correct answer

            answers = answers.map((a) => { //Get all the answers
                +i; //Increment the counter by one

                numbers.push(i = i + 1); //Add the current number to the array

                if (a === body.results[0].correct_answer) { //Add the correct answer to the variable
                    correctNumber = i;
                };

                return `${`**${i}.**`} ${a}`; //Format the message correctly
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

            const filter = m => m.author.id === msg.author.id && numbers.join(",").includes(m.content); //Create a filter that only accepts messages from the original author and that includes a valid answer

            msg.channel.awaitMessages(filter, {
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(collected => {
                if (collected.first().content == correctNumber) { //Check if the correct answer was given
                    ++streak //Add 1 to the members streak

                    msg.channel.send(`You got it right! Your streak is now ${streak}`);

                    return newQuestion(url); //Get a new question
                } else {
                    var earnedCredits = credits * streak;

                    if (earnedCredits > 5000) {
                        earnedCredits = 5000;
                    };

                    client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") + earnedCredits, "credits"); //Set the credits

                    const failEmbed = new Discord.MessageEmbed() //End the game if the user gave the wrong answer
                        .setTitle("Game Over")
                        .setColor(config.embedColor)
                        .setDescription("That was the wrong answer!")
                        .addField("Correct Answer", `${decodeURIComponent(body.results[0].correct_answer)}`, true)
                        .addField("Your Streak", streak, true)
                        .addField("Credits Earned", earnedCredits, true);

                    return msg.channel.send({
                        embeds: [failEmbed]
                    });
                };
            }).catch(e => {
                var earnedCredits = credits * streak;

                if (earnedCredits > 5000) {
                    earnedCredits = 5000;
                };

                client.db.credits.set(msg.author.id, client.db.credits.get(msg.author.id, "credits") + earnedCredits, "credits"); //Set the credits

                const timeEmbed = new Discord.MessageEmbed() //End the game if the user ran out of time
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
        };

        function shuffle(a) { //Uses the Fisher–Yates shuffle algorithm
            var j, x, i;

            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));

                x = a[i];

                a[i] = a[j];

                a[j] = x;
            };

            return a;
        };

        async function getCategories(getNums) {
            const list = [];

            const {
                body
            } = await get('https://opentdb.com/api_category.php');

            if (getNums === true) { //If we just want to get the highest/lowest IDs
                var high = 0;

                var low = 999; //Set this variable high so that it's basically guaranteed that something will be lower

                for (const n of body.trivia_categories) {
                    if (n.id > high) {
                        high = n.id;
                    };

                    if (n.id < low) {
                        low = n.id;
                    };
                };

                return ({
                    high: high,
                    low: low
                });
            };

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
        };
    },
};