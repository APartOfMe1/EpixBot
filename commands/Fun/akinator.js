const Discord = require('discord.js');
const config = require("../../config/config.json");
const {
    Aki
} = require('aki-api');
const currentGames = [];

module.exports = {
    name: 'akinator',
    description: 'Try to have me guess who you\'re thinking of!',
    category: 'Fun',
    aliases: ["aki"],
    cooldown: 30000,
    slashOptions: new client.slashCommand(),
    async execute(interaction) {
        if (currentGames.includes(interaction.channelId)) {
            return interaction.reply('There\'s already a game going on in this channel!');
        }

        currentGames.push(interaction.channelId);

        setTimeout(() => {
            currentGames.splice(currentGames.indexOf(interaction.channelId), 1);
        }, 3600000);

        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('yes')
                    .setStyle('SECONDARY')
                    .setLabel('Yes'),
                new Discord.MessageButton()
                    .setCustomId('no')
                    .setStyle('SECONDARY')
                    .setLabel('No'),
                new Discord.MessageButton()
                    .setCustomId('dontKnow')
                    .setStyle('SECONDARY')
                    .setLabel('Don\'t Know'),
                new Discord.MessageButton()
                    .setCustomId('probably')
                    .setStyle('SECONDARY')
                    .setLabel('Probably'),
                new Discord.MessageButton()
                    .setCustomId('probablyNot')
                    .setStyle('SECONDARY')
                    .setLabel('Probably Not'),
            );


        await interaction.reply("Starting game...");

        const aki = new Aki("en");

        // Wait for the game to start
        await aki.start();

        return newQuestion(interaction, interaction.id);

        async function newQuestion(interaction, id) {
            // Check if the game is over
            if (aki.progress >= 70 || aki.currentStep >= 78) {
                await aki.win();

                currentGames.splice(currentGames.indexOf(interaction.channelId), 1);

                // Get the first result
                const character = aki.answers[0];

                const winEmb = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle("My Guess")
                    .setImage(character.absolute_picture_path)
                    .addField("Character", `\`\`\`Name: ${character.name}\nDescription: ${character.description}\nPopularity: ${character.ranking}\`\`\``, true)
                    .addField("Total Guesses", `\`\`\`${aki.currentStep}\`\`\``, true)
                    .setFooter(`${config.name}`, client.user.avatarURL());

                // Edit the message with the new embed
                return interaction.editReply({
                    content: null,
                    components: [],
                    embeds: [winEmb],
                }).catch(e => {
                    currentGames.splice(currentGames.indexOf(interaction.channelId), 1);
                });
            }

            const gameEmb = new Discord.MessageEmbed()
                .setColor(config.embedColor)
                .setTitle(`Guess #${aki.currentStep}`)
                .addField("Question", aki.question, true)
                .addField("Progress", aki.progress.toString(), true)
                .setFooter(`${config.name} | You have 45 seconds to make a choice`, client.user.avatarURL());

            // Edit the message with the new embed
            await interaction.editReply({
                content: null,
                embeds: [gameEmb],
                components: [row]
            }).catch(e => {
                currentGames.splice(currentGames.indexOf(interaction.channelId), 1);
            });

            const buttonFilter = i => ['yes', 'no', 'dontKnow', 'probably', 'probablyNot'].includes(i.customId) && i.user.id === interaction.user.id && i.message.interaction.id === interaction.id;

            interaction.channel.awaitMessageComponent({
                buttonFilter,
                componentType: 'BUTTON',
                time: 45000
            }).then(async i => {
                i.deferUpdate();

                switch (i.customId) {
                    case 'yes':
                        await aki.step(0);

                        newQuestion(i, id);

                        break;

                    case 'no':
                        await aki.step(1);

                        newQuestion(i, id);

                        break;

                    case 'dontKnow':
                        await aki.step(2);

                        newQuestion(i, id);

                        break;

                    case 'probably':
                        await aki.step(3);

                        newQuestion(i, id);

                        break;

                    case 'probablyNot':
                        await aki.step(4);

                        newQuestion(i, id);

                        break;
                }
            }).catch(() => {
                return interaction.editReply({
                    content: "The answer wasn't given in time!",
                    embeds: [],
                    components: [],
                }).catch(e => {
                    currentGames.splice(currentGames.indexOf(interaction.channelId), 1);
                });
            });
        };
    },
};