const fs = require('fs');
const dir = "./assets/images/gifs/";
const actions = require("../../assets/images/gifs/tenses.json");

module.exports = {
    name: 'action',
    description: 'Perform an action',
    category: 'Actions',
    usage: '`/action <action> @user` or `/action <action> username`',
    examples: '`/action bite @apartofme` or `/action explode APOM`',
    slashOptions: new client.slashCommand()
        .addStringOption(o => {
            o.setName('action')
                .setDescription('The action to perform')
                .setRequired(true);

            // Add each action as a choice
            for (const i of Object.keys(actions)) {
                // Convert the first letter to uppercase
                o.addChoices({name: i.slice(0, 1).toUpperCase() + i.slice(1), value: i});
            }

            return o;
        })
        .addUserOption(o => {
            return o.setName('user')
                .setDescription('The user to perform the action on')
                .setRequired(true);
        }),
    async execute(interaction) {
        // Uploading the image might take longer than 3 seconds, so we defer the reply
        await interaction.deferReply();

        // Get interaction options
        const action = interaction.options.getString('action');
        const user = interaction.options.getUser('user');

        // Get the members nickname
        const nick = interaction.member.guild.members.cache.get(user.id).displayName || user.username;

        // Get the nickname of the message author
        const auth = interaction.member.nickname || interaction.user.username;

        // Set an array of all gifs in the folder
        const gifArr = fs.readdirSync(dir + action);

        // Choose a random image from the list and send it as an attachment
        const gif = `${dir}${action}/${gifArr[Math.floor(Math.random() * gifArr.length)]}`;

        return interaction.editReply({
            content: `**${auth}** ${actions[action]} **${nick}**!`,
            files: [gif]
        });
    },
};