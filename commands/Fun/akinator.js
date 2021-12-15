const Discord = require('discord.js');
const config = require("../../config/config.json");
const {
    Aki
} = require('aki-api');

module.exports = {
    name: 'akinator',
    description: 'Try to have me guess who you\'re thinking of!',
    category: 'Fun',
    aliases: ["aki"],
    cooldown: 30000,
    async execute(msg, args) {
        const reactions = [
            "✅",
            "❌",
            "🤷‍♀️",
            "👍",
            "👎"
        ];

        const gameMsg = await msg.channel.send("Starting game...");

        for (const r of reactions) {
            await gameMsg.react(r);
        }

        const aki = new Aki("en");

        // Wait for the game to start
        await aki.start();

        return newQuestion(gameMsg);

        async function newQuestion(gameMsg) {
            // Check if the game is over
            if (aki.progress >= 70 || aki.currentStep >= 78) {
                await aki.win();

                // Remove all reactions
                gameMsg.reactions.removeAll();

                // Get the first result
                const character = aki.answers[0];

                const winEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("My Guess")
                    .setImage(character.absolute_picture_path)
                    .addField("Character", `\`\`\`Name: ${character.name}\nDescription: ${character.description}\nPopularity: ${character.ranking}\`\`\``, true)
                    .addField("Total Guesses", `\`\`\`${aki.currentStep}\`\`\``, true)
                    .setFooter(`${config.name} | You have 45 seconds to make a choice`, client.user.avatarURL());

                // Edit the message with the new embed
                return gameMsg.edit({
                    content: null,
                    embeds: [winEmb]
                });
            }

            const gameEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle(`Guess #${aki.currentStep}`)
                .addField("Question", aki.question, true)
                .addField("Progress", aki.progress.toString(), true)
                .addField("Reactions", `Yes: ✅\nNo: ❌\nDon't Know: 🤷‍♀️\nProbably: 👍\nProbably Not: 👎`)
                .setFooter(`${config.name} | You have 45 seconds to make a choice`, client.user.avatarURL());

            // Edit the message with the new embed
            gameMsg.edit({
                content: null,
                embeds: [gameEmb]
            });

            // Make sure the reaction emoji is valid and the reactor is the message author
            const reactionFilter = (r, u) => reactions.includes(r.emoji.name) && u.id === msg.author.id;
            
            gameMsg.awaitReactions({
                reactionFilter,
                max: 1,
                time: 45000,
                errors: ["time"]
            }).then(async collected => {
                // Remove the reaction
                collected.first().emoji.reaction.users.remove(msg.author.id);

                // Check for the desired result
                switch (collected.first().emoji.name) {
                    case "✅":
                        await aki.step(0);

                        newQuestion(gameMsg);

                        break;

                    case "❌":
                        await aki.step(1);

                        newQuestion(gameMsg);

                        break;

                    case "🤷‍♀️":
                        await aki.step(2);

                        newQuestion(gameMsg);

                        break;

                    case "👍":
                        await aki.step(3);

                        newQuestion(gameMsg);

                        break;

                    case "👎":
                        await aki.step(4);

                        newQuestion(gameMsg);

                        break;
                }
            }).catch(e => {
                // Remove all reactions
                gameMsg.reactions.removeAll();

                return gameMsg.edit({
                    content: "The answer wasn't given in time!",
                    embeds: []
                });
            })
        };
    },
};